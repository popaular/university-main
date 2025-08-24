const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixDatabase() {
  try {
    console.log('开始修复数据库...');
    
    // 使用正确的列名（驼峰命名）
    const users = await prisma.$queryRaw`
      SELECT id, "targetCountries", "intendedMajors" 
      FROM users 
      WHERE "targetCountries" IS NOT NULL OR "intendedMajors" IS NOT NULL
    `;
    
    console.log(`找到 ${users.length} 个需要修复的用户`);
    
    for (const user of users) {
      try {
        let targetCountries = [];
        let intendedMajors = [];
        
        // 处理targetCountries
        if (user.targetCountries) {
          try {
            // 如果是数组格式，直接保留
            if (Array.isArray(user.targetCountries)) {
              targetCountries = user.targetCountries;
            } else {
              // 如果是字符串，尝试解析
              targetCountries = JSON.parse(user.targetCountries);
            }
          } catch {
            // 如果解析失败，重置为空数组
            targetCountries = [];
          }
        }
        
        // 处理intendedMajors
        if (user.intendedMajors) {
          try {
            if (Array.isArray(user.intendedMajors)) {
              intendedMajors = user.intendedMajors;
            } else {
              intendedMajors = JSON.parse(user.intendedMajors);
            }
          } catch {
            intendedMajors = [];
          }
        }
        
        // 使用Prisma更新，避免列名问题
        await prisma.user.update({
          where: { id: user.id },
          data: {
            targetCountries: targetCountries,
            intendedMajors: intendedMajors
          }
        });
        
        console.log(`修复用户 ${user.id} 成功`);
      } catch (error) {
        console.error(`修复用户 ${user.id} 失败:`, error);
      }
    }
    
    console.log('数据库修复完成！');
  } catch (error) {
    console.error('修复失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDatabase();