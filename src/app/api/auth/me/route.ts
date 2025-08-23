import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    console.log('=== 收到的请求头 ===')
    console.log('所有cookie:', request.headers.get('cookie'))
    
    const token = request.cookies.get("token")?.value

    console.log('=== Token提取 ===')
    console.log('提取到的token:', token)

    if (!token) {
      console.log('❌ 未找到token')
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    console.log('=== Token验证开始 ===')
    console.log('获取到的token:', token.substring(0, 20) + '...')

    const payload = verifyToken(token)
    console.log('Token验证结果:', payload)
    
    if (!payload) {
      console.log('❌ Token验证失败，payload为null')
      return NextResponse.json({ error: "无效的token" }, { status: 401 })
    }
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        parentChildren: {
          select: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        studentChildren: {
          select: {
            parent: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        }
      },
    })

    if (!user) {
      console.log('❌ 用户不存在，用户ID:', payload.userId)
      return NextResponse.json({ error: "用户不存在" }, { status: 404 })
    }

    console.log('=== 用户信息查询成功 ===')
    console.log('用户ID:', user.id)
    console.log('用户名:', user.name)
    console.log('用户邮箱:', user.email)
    console.log('用户角色:', user.role)

    return NextResponse.json(user)
  } catch (error) {
    console.error("=== Token验证错误 ===")
    console.error("错误详情:", error)
    console.error("错误堆栈:", error instanceof Error ? error.stack : '无堆栈信息')
    return NextResponse.json({ error: "无效的token" }, { status: 401 })
  }
}