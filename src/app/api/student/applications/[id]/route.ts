import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value
    const payload = verifyToken(token || '')

    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const application = await prisma.application.findUnique({
      where: { id },
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
        }
      },
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // 检查权限
    if (payload.role === 'STUDENT' && application.studentId !== payload.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (payload.role === 'PARENT') {
      const hasAccess = await prisma.parentStudent.findFirst({
        where: {
          parentId: payload.userId,
          studentId: application.studentId,
        },
      })

      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    return NextResponse.json({ application })
  } catch (error) {
    console.error('Error fetching application:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value
    const payload = verifyToken(token || '')

    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { status, reason } = await request.json()

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    // 获取当前申请信息
    const currentApplication = await prisma.application.findUnique({
      where: { id },
      select: { 
        id: true, 
        status: true, 
        studentId: true 
      }
    })

    if (!currentApplication) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // 检查权限
    if (payload.role === 'STUDENT' && currentApplication.studentId !== payload.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (payload.role === 'PARENT') {
      const hasAccess = await prisma.parentStudent.findFirst({
        where: {
          parentId: payload.userId,
          studentId: currentApplication.studentId,
        },
      })

      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // 使用事务来更新状态和记录变更历史
    let result
    try {
      result = await prisma.$transaction(async (tx) => {
        // 更新申请状态
        const updatedApplication = await tx.application.update({
          where: { id },
          data: { status },
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
            }
          }
        })

        // 记录状态变更历史
        if (currentApplication.status !== status) {
          await tx.applicationStatusLog.create({
            data: {
              applicationId: id,
              oldStatus: currentApplication.status,
              newStatus: status,
              changedBy: payload.userId,
              changedByRole: payload.role,
              reason: reason || null,
            },
          })
        }

        return updatedApplication
      }, {
        timeout: 10000, // 10秒超时
        maxWait: 5000,  // 最大等待时间
      })
    } catch (transactionError) {
      console.error('Transaction failed:', transactionError)
      
      // 如果事务失败，尝试不使用事务的简单更新
      try {
        console.log('Falling back to non-transactional update...')
        
        // 先更新申请状态
        const updatedApplication = await prisma.application.update({
          where: { id },
          data: { status },
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
            }
          }
        })

        // 再记录状态变更历史
        if (currentApplication.status !== status) {
          await prisma.applicationStatusLog.create({
            data: {
              applicationId: id,
              oldStatus: currentApplication.status,
              newStatus: status,
              changedBy: payload.userId,
              changedByRole: payload.role,
              reason: reason || null,
            },
          })
        }

        result = updatedApplication
      } catch (fallbackError) {
        console.error('Fallback update also failed:', fallbackError)
        throw new Error('Failed to update application status')
      }
    }

    return NextResponse.json({ application: result })
  } catch (error) {
    console.error('Error updating application:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value
    const payload = verifyToken(token || '')

    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { notes, applicationType } = await request.json()

    // 获取当前申请信息
    const application = await prisma.application.findUnique({
      where: { id },
      select: { 
        id: true, 
        studentId: true 
      }
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // 检查权限
    if (payload.role === 'STUDENT' && application.studentId !== payload.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (payload.role === 'PARENT') {
      const hasAccess = await prisma.parentStudent.findFirst({
        where: {
          parentId: payload.userId,
          studentId: application.studentId,
        },
      })

      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // 更新申请的非状态字段
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: {
        ...(notes !== undefined && { notes }),
        ...(applicationType && { applicationType }),
      },
      include: {
        university: {
          select: {
            name: true,
            usNewsRanking: true,
            country: true,
          },
        },
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
        }
      },
    })

    return NextResponse.json({ application: updatedApplication })
  } catch (error) {
    console.error('Error updating application:', error)
    return NextResponse.json(
      { error: '更新申请失败' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value
    const payload = verifyToken(token || '')
    const { id } = await params

    if (!payload || payload.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 验证申请所有权
    const application = await prisma.application.findFirst({
      where: {
        id: id,
        studentId: payload.userId,
      },
    })

    if (!application) {
      return NextResponse.json({ error: '申请未找到' }, { status: 404 })
    }

    // 删除申请及其关联的要求
    await prisma.applicationRequirement.deleteMany({
      where: { applicationId: id },
    })

    await prisma.application.delete({
      where: { id: id },
    })

    return NextResponse.json({ message: '申请已删除' })
  } catch (error) {
    console.error('Error deleting application:', error)
    return NextResponse.json(
      { error: '删除申请失败' },
      { status: 500 }
    )
  }
}