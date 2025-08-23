import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'

const prisma = new PrismaClient()

async function main() {
  // 创建示例学生
  const student = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      email: 'student@example.com',
      password: hashPassword('password'),
      name: '张三',
      role: 'STUDENT',
      graduationYear: 2025,
      gpa: 3.8,
      satScore: 1450,
      actScore: 32,
      targetCountries: ['美国', '加拿大'],
      intendedMajors: ['计算机科学', '数据科学'],
    },
  })

  // 创建示例家长
  const parent = await prisma.user.upsert({
    where: { email: 'parent@example.com' },
    update: {},
    create: {
      email: 'parent@example.com',
      password: hashPassword('password'),
      name: '张妈妈',
      role: 'PARENT',
    },
  })

  // 关联家长和学生
  await prisma.parentStudent.upsert({
    where: {
      parentId_studentId: {
        parentId: parent.id,
        studentId: student.id,
      },
    },
    update: {},
    create: {
      parentId: parent.id,
      studentId: student.id,
    },
  })

  // 创建示例大学
  const universities = await Promise.all([
    prisma.university.upsert({
      where: { id: 'mit' },
      update: {},
      create: {
        id: 'mit',
        name: '麻省理工学院',
        country: '美国',
        state: '马萨诸塞州',
        city: '剑桥',
        usNewsRanking: 2,
        acceptanceRate: 4.0,
        applicationSystem: 'Direct',
        tuitionInState: 57000,
        tuitionOutState: 57000,
        applicationFee: 75,
        deadlines: {
          early_action: '2025-10-15',
          regular: '2025-11-01',
        },
        requirements: {
          gpa: 4.0,
          sat: { min: 1500, max: 1600 },
          act: { min: 34, max: 36 },
          toefl: 100,
          essays: ['个人陈述', 'MIT社区文书', '为什么选择MIT'],
          recommendations: 2,
          portfolio: false,
          interview: true,
          extracurriculars: ['STEM竞赛', '研究项目', '领导力活动'],
        },
      },
    }),
    prisma.university.upsert({
      where: { id: 'stanford' },
      update: {},
      create: {
        id: 'stanford',
        name: '斯坦福大学',
        country: '美国',
        state: '加利福尼亚州',
        city: '斯坦福',
        usNewsRanking: 3,
        acceptanceRate: 3.9,
        applicationSystem: 'Common App',
        tuitionInState: 56000,
        tuitionOutState: 56000,
        applicationFee: 90,
        deadlines: {
          early_action: '2025-10-01',
          regular: '2025-11-05',
        },
        requirements: {
          gpa: 3.9,
          sat: { min: 1450, max: 1600 },
          act: { min: 32, max: 36 },
          toefl: 100,
          ielts: 7.0,
          essays: ['个人陈述', '斯坦福短文', '活动列表'],
          recommendations: 2,
          portfolio: false,
          interview: false,
          extracurriculars: ['学术成就', '社区服务', '创新项目'],
        },
      },
    }),
    prisma.university.upsert({
      where: { id: 'berkeley' },
      update: {},
      create: {
        id: 'berkeley',
        name: '加州大学伯克利分校',
        country: '美国',
        state: '加利福尼亚州',
        city: '伯克利',
        usNewsRanking: 15,
        acceptanceRate: 11.4,
        applicationSystem: 'Direct',
        tuitionInState: 15000,
        tuitionOutState: 45000,
        applicationFee: 70,
        deadlines: {
          regular: '2025-11-30',
        },
        requirements: {
          gpa: 3.7,
          sat: { min: 1300, max: 1500 },
          act: { min: 29, max: 34 },
          toefl: 80,
          ielts: 6.5,
          essays: ['个人陈述', '加州大学文书'],
          recommendations: 0,
          portfolio: false,
          interview: false,
          extracurriculars: ['学术准备', '个人成就', '社区参与'],
        },
      },
    }),
  ])

  // 创建示例申请
  await prisma.application.upsert({
    where: {
      id: 'app1',
    },
    update: {},
    create: {
      id: 'app1',
      studentId: student.id,
      universityId: universities[0].id,
      applicationType: 'EARLY_ACTION',
      deadline: new Date('2024-11-01'),
      status: 'IN_PROGRESS',
    },
  })

  await prisma.application.upsert({
    where: {
      id: 'app2',
    },
    update: {},
    create: {
      id: 'app2',
      studentId: student.id,
      universityId: universities[1].id,
      applicationType: 'REGULAR_DECISION',
      deadline: new Date('2025-01-05'),
      status: 'NOT_STARTED',
    },
  })

  console.log('✅ 数据库种子数据创建成功！')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })