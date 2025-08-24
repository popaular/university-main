const { PrismaClient } = require('@prisma/client')
const jwt = require('jsonwebtoken')

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'

async function testAuth() {
  try {
    console.log('=== 测试认证流程 ===')
    
    // 1. 检查数据库连接
    console.log('1. 测试数据库连接...')
    await prisma.$connect()
    console.log('✅ 数据库连接成功')
    
    // 2. 查找学生用户
    console.log('2. 查找学生用户...')
    const student = await prisma.user.findFirst({
      where: { role: 'STUDENT' }
    })
    
    if (!student) {
      console.log('❌ 没有找到学生用户')
      return
    }
    
    console.log('✅ 找到学生用户:', {
      id: student.id,
      email: student.email,
      name: student.name,
      role: student.role
    })
    
    // 3. 测试密码验证
    console.log('3. 测试密码验证...')
    const bcrypt = require('bcryptjs')
    const testPassword = 'password'
    const isPasswordValid = bcrypt.compareSync(testPassword, student.password || '')
    console.log('密码验证结果:', isPasswordValid)
    
    // 4. 测试JWT生成
    console.log('4. 测试JWT生成...')
    const tokenPayload = {
      userId: student.id,
      email: student.email,
      role: student.role,
    }
    
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' })
    console.log('✅ JWT生成成功:', token.substring(0, 20) + '...')
    
    // 5. 测试JWT验证
    console.log('5. 测试JWT验证...')
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      console.log('✅ JWT验证成功:', decoded)
    } catch (error) {
      console.log('❌ JWT验证失败:', error.message)
    }
    
    // 6. 检查环境变量
    console.log('6. 检查环境变量...')
    console.log('JWT_SECRET:', JWT_SECRET)
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? '已设置' : '未设置')
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAuth() 