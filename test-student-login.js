const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'

async function testStudentLogin() {
  try {
    console.log('=== 测试学生登录 ===')
    
    // 1. 查找student@example.com用户
    console.log('1. 查找student@example.com用户...')
    const student = await prisma.user.findUnique({
      where: { email: 'student@example.com' }
    })
    
    if (!student) {
      console.log('❌ 没有找到student@example.com用户')
      return
    }
    
    console.log('✅ 找到用户:', {
      id: student.id,
      email: student.email,
      name: student.name,
      role: student.role
    })
    
    // 2. 测试密码验证
    console.log('2. 测试密码验证...')
    const testPassword = 'password'
    const isPasswordValid = bcrypt.compareSync(testPassword, student.password || '')
    console.log('密码验证结果:', isPasswordValid)
    
    if (!isPasswordValid) {
      console.log('❌ 密码验证失败，尝试其他密码...')
      // 尝试其他可能的密码
      const otherPasswords = ['123456', 'password123', 'student', 'test']
      for (const pwd of otherPasswords) {
        const isValid = bcrypt.compareSync(pwd, student.password || '')
        if (isValid) {
          console.log(`✅ 找到正确密码: ${pwd}`)
          break
        }
      }
      return
    }
    
    // 3. 测试JWT生成和验证
    console.log('3. 测试JWT...')
    const tokenPayload = {
      userId: student.id,
      email: student.email,
      role: student.role,
    }
    
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' })
    console.log('✅ JWT生成成功')
    
    const decoded = jwt.verify(token, JWT_SECRET)
    console.log('✅ JWT验证成功:', decoded)
    
    console.log('=== 登录测试完成 ===')
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testStudentLogin() 