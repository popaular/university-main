import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// 获取学生的财务规划
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    const payload = verifyToken(token || '')

    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    // 检查权限
    if (payload.role === 'STUDENT' && payload.userId !== studentId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (payload.role === 'PARENT') {
      const hasAccess = await prisma.parentStudent.findFirst({
        where: {
          parentId: payload.userId,
          studentId: studentId,
        },
      })

      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // 获取该学生的所有申请的财务规划
    const financialPlans = await prisma.financialPlan.findMany({
      where: {
        application: {
          studentId: studentId
        },
        parentId: payload.role === 'PARENT' ? payload.userId : undefined,
      },
      include: {
        application: {
          include: {
            university: {
              select: {
                name: true,
                country: true,
              }
            }
          }
        },
        parent: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    return NextResponse.json({ financialPlans })
  } catch (error) {
    console.error('Error fetching financial plans:', error)
    return NextResponse.json(
      { error: '获取财务规划失败' },
      { status: 500 }
    )
  }
}

// 创建财务规划
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    const payload = verifyToken(token || '')

    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (payload.role !== 'PARENT') {
      return NextResponse.json({ error: '只有家长可以创建财务规划' }, { status: 403 })
    }

    const { applicationId, tuition, roomAndBoard, booksAndSupplies, personalExpenses, transportation, otherFees, notes } = await request.json()

    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 })
    }

    // 检查申请是否存在
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        student: true
      }
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // 检查家长是否有权限管理该学生
    const hasAccess = await prisma.parentStudent.findFirst({
      where: {
        parentId: payload.userId,
        studentId: application.studentId,
      },
    })

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 检查是否已存在财务规划
    const existingPlan = await prisma.financialPlan.findFirst({
      where: {
        applicationId: applicationId,
        parentId: payload.userId,
      },
    })

    let financialPlan

    if (existingPlan) {
      // 更新现有财务规划
      financialPlan = await prisma.financialPlan.update({
        where: { id: existingPlan.id },
        data: {
          tuition: tuition || null,
          roomAndBoard: roomAndBoard || null,
          booksAndSupplies: booksAndSupplies || null,
          personalExpenses: personalExpenses || null,
          transportation: transportation || null,
          otherFees: otherFees || null,
          notes: notes || null,
        },
        include: {
          application: {
            include: {
              university: {
                select: {
                  name: true,
                  country: true,
                }
              }
            }
          },
          parent: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      })
    } else {
      // 创建新的财务规划
      financialPlan = await prisma.financialPlan.create({
        data: {
          applicationId: applicationId,
          parentId: payload.userId,
          tuition: tuition || null,
          roomAndBoard: roomAndBoard || null,
          booksAndSupplies: booksAndSupplies || null,
          personalExpenses: personalExpenses || null,
          transportation: transportation || null,
          otherFees: otherFees || null,
          notes: notes || null,
        },
        include: {
          application: {
            include: {
              university: {
                select: {
                  name: true,
                  country: true,
                }
              }
            }
          },
          parent: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      })
    }

    return NextResponse.json({ financialPlan })
  } catch (error) {
    console.error('Error creating/updating financial plan:', error)
    return NextResponse.json(
      { error: '创建财务规划失败' },
      { status: 500 }
    )
  }
} 