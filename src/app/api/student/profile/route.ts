import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: '无效的token' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        graduationYear: true,
        gpa: true,
        satScore: true,
        actScore: true,
        targetCountries: true,
        intendedMajors: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    if (payload.role !== 'STUDENT') {
      return NextResponse.json({ error: '只有学生可以访问此接口' }, { status: 403 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('获取学生资料失败:', error);
    return NextResponse.json({ error: '获取资料失败' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: '无效的token' }, { status: 401 });
    }

    if (payload.role !== 'STUDENT') {
      return NextResponse.json({ error: '只有学生可以修改资料' }, { status: 403 });
    }

    const body = await request.json();
    const {
      graduationYear,
      gpa,
      satScore,
      actScore,
      targetCountries,
      intendedMajors,
    } = body;

    // 验证数据
    if (graduationYear && (graduationYear < 2020 || graduationYear > 2030)) {
      return NextResponse.json({ error: '毕业年份应在2020-2030之间' }, { status: 400 });
    }

    if (gpa && (gpa < 0 || gpa > 4.0)) {
      return NextResponse.json({ error: 'GPA应在0-4.0之间' }, { status: 400 });
    }

    if (satScore && (satScore < 400 || satScore > 1600)) {
      return NextResponse.json({ error: 'SAT分数应在400-1600之间' }, { status: 400 });
    }

    if (actScore && (actScore < 1 || actScore > 36)) {
      return NextResponse.json({ error: 'ACT分数应在1-36之间' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        graduationYear,
        gpa,
        satScore,
        actScore,
        targetCountries: targetCountries || [],
        intendedMajors: intendedMajors || [],
      },
      select: {
        id: true,
        name: true,
        email: true,
        graduationYear: true,
        gpa: true,
        satScore: true,
        actScore: true,
        targetCountries: true,
        intendedMajors: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('更新学生资料失败:', error);
    return NextResponse.json({ error: '更新资料失败' }, { status: 500 });
  }
}