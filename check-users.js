const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    console.log('=== 检查数据库中的所有用户 ===')
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true
      }
    })
    
    console.log(`找到 ${users.length} 个用户:`)
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role}`)
      console.log(`   密码: ${user.password ? '已设置' : '未设置'}`)
      console.log(`   密码长度: ${user.password?.length || 0}`)
      console.log('')
    })
    
  } catch (error) {
    console.error('❌ 检查失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers() 