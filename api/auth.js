/**
 * Vercel Serverless Function: POST /api/auth
 * Simple password gate. Checks password against APP_PASSWORD env var.
 * Returns a token (hash) that the client stores to stay authenticated.
 */

import { createHmac } from "node:crypto";

function hashToken(password) {
  return createHmac("sha256", "ttc-salt").update(password).digest("hex");
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method === "POST") {
    const appPassword = process.env.APP_PASSWORD;
    if (!appPassword) {
      return res.status(500).json({ error: "APP_PASSWORD not configured" });
    }

    const { password } = req.body || {};
    if (!password || typeof password !== "string") {
      return res.status(400).json({ error: "Missing password" });
    }

    if (password === appPassword) {
      const token = hashToken(appPassword);
      return res.status(200).json({ ok: true, token });
    }
    return res.status(401).json({ error: "Wrong password" });
  }

  // GET /api/auth?token=xxx — verify a stored token
  if (req.method === "GET") {
    const appPassword = process.env.APP_PASSWORD;
    if (!appPassword) {
      return res.status(500).json({ error: "APP_PASSWORD not configured" });
    }
    const { token } = req.query;
    const expected = hashToken(appPassword);
    if (token === expected) {
      return res.status(200).json({ ok: true });
    }
    return res.status(401).json({ error: "Invalid token" });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
