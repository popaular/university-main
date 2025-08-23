import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateToken, verifyPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log('=== 登录请求开始 ===')
    console.log('请求邮箱:', email)
    console.log('请求密码:', password ? '已提供' : '未提供')

    if (!email || !password) {
      console.log('❌ 缺少邮箱或密码')
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    console.log('=== 用户查询结果 ===')
    console.log('用户是否存在:', !!user)
    if (user) {
      console.log('用户ID:', user.id)
      console.log('用户名:', user.name)
      console.log('用户角色:', user.role)
      console.log('用户邮箱:', user.email)
      console.log('密码字段:', user.password ? '已设置' : '为空')
      console.log('密码长度:', user.password?.length || 0)
    } else {
      console.log('❌ 用户不存在')
    }

    if (!user) {
      console.log('❌ 用户不存在，返回401')
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const isPasswordValid = verifyPassword(password, user.password || '')
    console.log('=== 密码验证 ===')
    console.log('输入密码:', password)
    console.log('存储密码:', user.password)
    console.log('密码验证结果:', isPasswordValid)

    if (!isPasswordValid) {
      console.log('❌ 密码验证失败')
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    }
    console.log('=== Token生成 ===')
    console.log('Token载荷:', tokenPayload)

    const token = generateToken(tokenPayload)
    console.log('生成Token:', token.substring(0, 20) + '...')

    const responseData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    }
    console.log('=== 返回数据 ===')
    console.log('返回用户数据:', responseData)

    const response = NextResponse.json(responseData)

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    console.log('=== 登录成功 ===')
    console.log('Cookie已设置')
    return response
  } catch (error) {
    console.error('=== 登录错误 ===')
    console.error('错误详情:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}