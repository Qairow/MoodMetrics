import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export function generateToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

export function hashPassword(password: string): string {
  // In production, use bcrypt
  return password; // Simplified for MVP
}

export function comparePassword(password: string, hash: string): boolean {
  // In production, use bcrypt.compare
  return password === hash; // Simplified for MVP
}
