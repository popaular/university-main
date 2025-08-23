import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
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

    const { status, notes, deadline, applicationType } = await request.json()

    // 查找申请并验证所有权
    const application = await prisma.application.findFirst({
      where: {
        id: id,
        studentId: payload.userId,
      },
    })

    if (!application) {
      return NextResponse.json({ error: '申请未找到' }, { status: 404 })
    }

    // 如果修改申请类型为ED，检查是否已存在其他ED申请
    if (applicationType === 'EARLY_DECISION' && application.applicationType !== 'EARLY_DECISION') {
      const existingEDApplication = await prisma.application.findFirst({
        where: {
          studentId: payload.userId,
          applicationType: 'EARLY_DECISION',
          id: { not: id }, // 排除当前申请
        },
      })

      if (existingEDApplication) {
        return NextResponse.json(
          { error: '您已经有一个提前决定(Early Decision)申请' },
          { status: 409 }
        )
      }
    }

    // 截止日期验证（如果提供）
    if (deadline) {
      const deadlineDate = new Date(deadline)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

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
    }

    // 状态流转验证
    if (status && status !== application.status) {
      const currentStatus = application.status
      const newStatus = status
      
      // 定义允许的状态流转路径
      const validTransitions: Record<string, string[]> = {
        'NOT_STARTED': ['IN_PROGRESS'],
        'IN_PROGRESS': ['SUBMITTED', 'ACCEPTED', 'REJECTED', 'WAITLISTED'],
        'SUBMITTED': ['UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'WAITLISTED'],
        'UNDER_REVIEW': ['ACCEPTED', 'REJECTED', 'WAITLISTED'],
        'ACCEPTED': [], // 终态，不能修改
        'REJECTED': [], // 终态，不能修改
        'WAITLISTED': ['ACCEPTED', 'REJECTED'] // 等待名单可以转为录取或拒绝
      }

      const allowedTransitions = validTransitions[currentStatus] || []
      if (!allowedTransitions.includes(newStatus)) {
        return NextResponse.json(
          { error: `不允许的状态修改：从 ${currentStatus.replace('_', ' ')} 到 ${newStatus.replace('_', ' ')}` },
          { status: 400 }
        )
      }
    }

    // 更新申请
    const updatedApplication = await prisma.application.update({
      where: { id: id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(deadline && { deadline: new Date(deadline) }),
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