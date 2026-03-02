import { createHmac } from "node:crypto";

const HMAC_SECRET = process.env.HMAC_SECRET || "ttc-salt";

export function hashToken(password) {
  return createHmac("sha256", HMAC_SECRET).update(password).digest("hex");
}
