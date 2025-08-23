import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface UniversityQuery {
  name?: { contains: string }
  country?: string
  usNewsRanking?: { gte?: number; lte?: number }
  acceptanceRate?: { gte?: number; lte?: number }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const country = searchParams.get('country')
    const minRanking = searchParams.get('minRanking')
    const maxRanking = searchParams.get('maxRanking')
    const minAcceptanceRate = searchParams.get('minAcceptanceRate')
    const maxAcceptanceRate = searchParams.get('maxAcceptanceRate')

    const where: UniversityQuery = {}

    if (search) {
      where.name = { contains: search }
    }

    if (country) {
      where.country = country
    }

    if (minRanking || maxRanking) {
      where.usNewsRanking = {}
      if (minRanking) where.usNewsRanking.gte = parseInt(minRanking)
      if (maxRanking) where.usNewsRanking.lte = parseInt(maxRanking)
    }

    if (minAcceptanceRate || maxAcceptanceRate) {
      where.acceptanceRate = {}
      if (minAcceptanceRate) where.acceptanceRate.gte = parseFloat(minAcceptanceRate)
      if (maxAcceptanceRate) where.acceptanceRate.lte = parseFloat(maxAcceptanceRate)
    }

    const universities = await prisma.university.findMany({
      select: {
        id: true,
        name: true,
        country: true,
        state: true,
        city: true,
        usNewsRanking: true,
        acceptanceRate: true,
        applicationSystem: true,
        tuitionInState: true,
        tuitionOutState: true,
        applicationFee: true,
        deadlines: true,
        requirements: true,
      },
      where,
      orderBy: { usNewsRanking: 'asc' },
    })

    return NextResponse.json({ universities })
  } catch (error) {
    console.error('API Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}