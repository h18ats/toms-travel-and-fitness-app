/**
 * Vercel Serverless Function: POST /api/parse-timetable
 *
 * Accepts JSON body:
 *   { type: "image" | "text" | "exam_image" | "exam_text", content: string }
 *
 * - "image"      → base64 image of a weekly timetable
 * - "text"       → plain-text copy of a weekly timetable
 * - "exam_image" → base64 image of an exam timetable
 * - "exam_text"  → plain-text copy of an exam timetable
 *
 * Returns structured JSON parsed by Claude claude-sonnet-4-6.
 */

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const MODEL = "claude-sonnet-4-6";

// ── Prompts ──────────────────────────────────────────────────────────────────

const TIMETABLE_PROMPT = `You are a timetable-parsing assistant. Extract the weekly timetable into the following JSON structure and return ONLY valid JSON — no markdown, no explanation, no code fences.

{
  "sessions": {
    "1": {
      "label": "Monday",
      "sessions": [
        { "time": "HH:MM-HH:MM", "subj": "Subject Name", "teacher": "Teacher Name", "room": "Room" }
      ],
      "start": "HH:MM",
      "end": "HH:MM"
    },
    "2": {
      "label": "Tuesday",
      "sessions": [ ... ],
      "start": "HH:MM",
      "end": "HH:MM"
    }
  }
}

Rules:
- Keys "1", "2", … correspond to days in order of appearance (typically Monday=1 … Friday=5).
- "start" is the earliest session start time for that day; "end" is the latest session end time.
- Use 24-hour HH:MM format.
- If a field is missing or unclear, use an empty string "".
- Return ONLY the JSON object. No other text.`;

const EXAM_PROMPT = `You are a timetable-parsing assistant. Extract the exam timetable into the following JSON structure and return ONLY valid JSON — no markdown, no explanation, no code fences.

{
  "exams": [
    {
      "date": "YYYY-MM-DD",
      "time": "HH:MM",
      "duration": 90,
      "subj": "Subject Name",
      "room": "Room",
      "seatNumber": ""
    }
  ]
}

Rules:
- "duration" is in minutes (integer).
- Use 24-hour HH:MM format for "time".
- Use ISO YYYY-MM-DD for "date".
- "seatNumber" is optional — use "" if not provided.
- If a field is missing or unclear, use an empty string "" (or 0 for duration).
- Return ONLY the JSON object. No other text.`;

// ── Helpers ──────────────────────────────────────────────────────────────────

function getPromptForType(type) {
  if (type === "exam_image" || type === "exam_text") return EXAM_PROMPT;
  return TIMETABLE_PROMPT;
}

function isImageType(type) {
  return type === "image" || type === "exam_image";
}

/**
 * Detect the media type from the first bytes of a base64 string or a
 * data-URI prefix. Falls back to "image/png" when detection fails.
 */
function detectMediaType(base64String) {
  // Handle data URIs: "data:image/jpeg;base64,..."
  if (base64String.startsWith("data:")) {
    const match = base64String.match(/^data:(image\/[a-zA-Z+]+);base64,/);
    if (match) return { mediaType: match[1], data: base64String.split(",")[1] };
  }

  // Sniff magic bytes from raw base64
  const header = base64String.slice(0, 20);
  if (header.startsWith("/9j/")) return { mediaType: "image/jpeg", data: base64String };
  if (header.startsWith("iVBOR")) return { mediaType: "image/png", data: base64String };
  if (header.startsWith("R0lGO")) return { mediaType: "image/gif", data: base64String };
  if (header.startsWith("UklGR")) return { mediaType: "image/webp", data: base64String };

  return { mediaType: "image/png", data: base64String };
}

function buildMessages(type, content) {
  const systemPrompt = getPromptForType(type);

  if (isImageType(type)) {
    const { mediaType, data } = detectMediaType(content);
    return {
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: data,
              },
            },
            {
              type: "text",
              text: "Parse this timetable image.",
            },
          ],
        },
      ],
    };
  }

  // Text types
  return {
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Parse the following timetable text:\n\n${content}`,
      },
    ],
  };
}

// ── Handler ──────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  // CORS headers (useful when called from a browser)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server misconfiguration: ANTHROPIC_API_KEY is not set." });
  }

  // Validate body
  const { type, content } = req.body || {};

  const validTypes = ["image", "text", "exam_image", "exam_text"];
  if (!type || !validTypes.includes(type)) {
    return res.status(400).json({
      error: `Invalid or missing "type". Must be one of: ${validTypes.join(", ")}`,
    });
  }

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return res.status(400).json({ error: 'Missing or empty "content" string.' });
  }

  // Build the Anthropic API request
  const { system, messages } = buildMessages(type, content);

  const anthropicBody = {
    model: MODEL,
    max_tokens: 4096,
    system: system,
    messages: messages,
  };

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
        "content-type": "application/json",
      },
      body: JSON.stringify(anthropicBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Anthropic API error (${response.status}):`, errorText);
      return res.status(502).json({
        error: "Anthropic API request failed.",
        status: response.status,
        detail: errorText,
      });
    }

    const data = await response.json();

    // Extract the text content from Claude's response
    const textBlock = data.content && data.content.find((b) => b.type === "text");
    if (!textBlock || !textBlock.text) {
      return res.status(502).json({ error: "No text content in Anthropic response.", raw: data });
    }

    const rawText = textBlock.text.trim();

    // Strip markdown code fences if Claude included them despite instructions
    let jsonString = rawText;
    const fenceMatch = rawText.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/);
    if (fenceMatch) {
      jsonString = fenceMatch[1].trim();
    }

    // Parse and return
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (parseErr) {
      return res.status(502).json({
        error: "Failed to parse Claude response as JSON.",
        rawText: rawText,
      });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error.", detail: err.message });
  }
};
