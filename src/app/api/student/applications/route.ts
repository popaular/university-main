import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    const payload = verifyToken(token || '')
    const { searchParams } = new URL(request.url)
    const targetStudentId = searchParams.get('studentId')

    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let studentIdToQuery = payload.userId

    // 如果是家长，检查是否有权限查看指定学生
    if (payload.role === 'PARENT') {
      if (!targetStudentId) {
        return NextResponse.json(
          { error: '需要指定学生ID' },
          { status: 400 }
        )
      }

      // 验证家长是否有权限查看该学生
      const hasAccess = await prisma.parentStudent.findFirst({
        where: {
          parentId: payload.userId,
          studentId: targetStudentId,
        },
      })

      if (!hasAccess) {
        return NextResponse.json(
          { error: '无权查看该学生的申请' },
          { status: 403 }
        )
      }

      studentIdToQuery = targetStudentId
    } else if (targetStudentId && targetStudentId !== payload.userId) {
      // 学生只能查看自己的申请
      return NextResponse.json(
        { error: '无权查看其他学生的申请' },
        { status: 403 }
      )
    }

    const applications = await prisma.application.findMany({
      where: { studentId: studentIdToQuery },
      include: {
        university: true,
        requirements: true,
        statusLogs: {
          include: {
            changedByUser: {
              select: {
                name: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        financialPlan: {
          include: {
            parent: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { deadline: 'asc' },
    })

    return NextResponse.json({ applications })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    const payload = verifyToken(token || '')

    if (!payload || payload.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { universityId, applicationType, deadline } = await request.json()

    if (!universityId || !applicationType || !deadline) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 截止日期验证
    const deadlineDate = new Date(deadline)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // 设置为当天开始

    if (isNaN(deadlineDate.getTime())) {
      return NextResponse.json(
        { error: '无效的截止日期格式' },
        { status: 400 }
      )
    }

    if (deadlineDate < today) {
      return NextResponse.json(
        { error: '截止日期不能早于今天' },
        { status: 400 }
      )
    }

    // 检查截止日期是否合理（不超过2年）
    const maxFutureDate = new Date()
    maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 2)
    if (deadlineDate > maxFutureDate) {
      return NextResponse.json(
        { error: '截止日期设置过于遥远，请检查是否正确' },
        { status: 400 }
      )
    }

    // 检查是否已存在提前决定(ED)申请
    if (applicationType === 'EARLY_DECISION') {
      const existingEDApplication = await prisma.application.findFirst({
        where: {
          studentId: payload.userId,
          applicationType: 'EARLY_DECISION',
        },
      })

      if (existingEDApplication) {
        return NextResponse.json(
          { error: '您已经有一个提前决定(Early Decision)申请。每个学生只能有一个ED申请。' },
          { status: 409 }
        )
      }
    }

    const application = await prisma.application.create({
      data: {
        studentId: payload.userId,
        universityId,
        applicationType,
        deadline: new Date(deadline),
        status: 'NOT_STARTED',
      },
      include: {
        university: true,
      },
    })

    // 创建默认申请要求
    const defaultRequirements = [
      { requirementType: 'ESSAY' as const },
      { requirementType: 'TRANSCRIPT' as const },
      { requirementType: 'RECOMMENDATION' as const },
      { requirementType: 'TEST_SCORES' as const },
    ]

    await prisma.applicationRequirement.createMany({
      data: defaultRequirements.map(req => ({
        applicationId: application.id,
        requirementType: req.requirementType,
        status: 'NOT_STARTED',
      })),
    })

    return NextResponse.json({ application })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}