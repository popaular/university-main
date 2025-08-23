import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'

export interface JWTPayload {
  userId: string
  email: string
  role: 'STUDENT' | 'PARENT' | 'TEACHER' | 'ADMIN'
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    console.log('=== JWT验证详情 ===')
    console.log('JWT_SECRET:', JWT_SECRET)
    console.log('Token:', token)
    
    const result = jwt.verify(token, JWT_SECRET) as JWTPayload
    console.log('验证成功:', result)
    return result
  } catch (error) {
    console.error('JWT验证失败:', error)
    console.error('错误详情:', error instanceof Error ? error.message : error)
    return null
  }
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10)
}

export function verifyPassword(password: string, hashed: string): boolean {
  return bcrypt.compareSync(password, hashed)
}

export function getAuthHeaders() {
  return {
    'Set-Cookie': `token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
  }
}