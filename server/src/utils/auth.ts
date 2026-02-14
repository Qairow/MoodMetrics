import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES || "7d";

if (!JWT_SECRET) {
  console.warn("⚠️ JWT_SECRET is not set. Add it to server/.env and Render env vars.");
}

export type JWTPayload = { userId: string; role: string };

export function generateToken(userId: string, role: string) {
  if (!JWT_SECRET) throw new Error("JWT_SECRET not set");
  const payload: JWTPayload = { userId, role };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    if (!JWT_SECRET) return null;
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}
