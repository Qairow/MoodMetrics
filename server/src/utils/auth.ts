import jwt, { SignOptions } from "jsonwebtoken";

export type JWTPayload = { userId: string; role: string };

function getJwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET not set");
  return s;
}

function getJwtExpires(): SignOptions["expiresIn"] {
  // jsonwebtoken типизирует expiresIn как StringValue | number
  // поэтому нужно привести тип (или валидировать строку)
  return (process.env.JWT_EXPIRES ?? "7d") as SignOptions["expiresIn"];
}

export function generateToken(userId: string, role: string) {
  const payload: JWTPayload = { userId, role };
  return jwt.sign(payload, getJwtSecret(), { expiresIn: getJwtExpires() });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as JWTPayload;
  } catch {
    return null;
  }
}
