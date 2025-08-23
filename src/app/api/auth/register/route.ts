import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role = 'STUDENT', studentEmail, ...profile } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      )
    }

    let userData: any = {
      email,
      password: hashPassword(password),
      name,
      role,
      ...profile,
    }

    // 创建用户基础数据
    const user = await prisma.user.create({
      data: {
        email,
        password: hashPassword(password),
        name,
        role,
        ...profile,
      },
    })

    // 如果是家长注册且提供了学生邮箱，建立绑定关系
    if (role === 'PARENT' && studentEmail) {
      const student = await prisma.user.findUnique({
        where: { email: studentEmail },
      })

      if (!student || student.role !== 'STUDENT') {
        // 如果学生不存在，删除刚创建的家长用户
        await prisma.user.delete({
          where: { id: user.id }
        })
        
        return NextResponse.json(
          { error: '学生邮箱不存在或不是学生账号' },
          { status: 400 }
        )
      }

      // 创建家长-学生关系
      await prisma.parentStudent.create({
        data: {
          parentId: user.id,
          studentId: student.id,
        },
      })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('注册API错误:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}