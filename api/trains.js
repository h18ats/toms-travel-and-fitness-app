/**
 * Vercel Serverless Function: GET /api/trains
 * Proxies National Rail Darwin requests so the Huxley URL stays server-side.
 * Requires auth token in query string.
 *
 * Query params:
 *   from  - CRS code (e.g. GOD, WOK, SND)
 *   to    - CRS code
 *   count - number of results (default 15)
 *   token - auth token from /api/auth
 */

import { createHmac } from "node:crypto";

function hashToken(password) {
  return createHmac("sha256", "ttc-salt").update(password).digest("hex");
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed. Use GET." });
  }

  // Verify auth token
  const appPassword = process.env.APP_PASSWORD;
  if (appPassword) {
    const { token } = req.query;
    if (!token || token !== hashToken(appPassword)) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  const { from, to, count = "15" } = req.query;
  if (!from || !to) {
    return res.status(400).json({ error: "Missing required query params: from, to" });
  }

  // Validate CRS codes (3 uppercase letters)
  const crsRegex = /^[A-Z]{3}$/;
  if (!crsRegex.test(from) || !crsRegex.test(to)) {
    return res.status(400).json({ error: "Invalid CRS code. Must be 3 uppercase letters." });
  }

  const countNum = Math.min(Math.max(parseInt(count, 10) || 15, 1), 25);
  const HUXLEY = process.env.HUXLEY_URL || "https://national-rail-api.davwheat.dev";

  try {
    const url = `${HUXLEY}/departures/${encodeURIComponent(from)}/to/${encodeURIComponent(to)}/${countNum}?expand=true`;
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(502).json({ error: "Upstream API error", status: response.status });
    }
    const data = await response.json();
    // Cache for 30 seconds
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
    return res.status(200).json(data);
  } catch (err) {
    console.error("Train proxy error:", err);
    return res.status(500).json({ error: "Failed to fetch train data" });
  }
}
