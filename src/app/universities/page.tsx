"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/layout/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface University {
  id: string
  name: string
  country: string
  ranking: number
  acceptanceRate: number
  tuitionFee: number
  website: string
}

interface User {
  id: string
  name: string
  email: string
  role: string
}

export default function UniversitiesPage() {
  const [user, setUser] = useState<User | null>(null)
  const [universities, setUniversities] = useState<University[]>([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchParams, setSearchParams] = useState({
    search: "",
    country: "",
    minRanking: "",
    maxRanking: "",
    minAcceptanceRate: "",
    maxAcceptanceRate: ""
  })
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include"
        })
        
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
          fetchUniversities()
        } else {
          router.push("/")
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        router.push("/")
      }
    }

    checkAuth()
  }, [router])

  const fetchUniversities = async () => {
    try {
      const params = new URLSearchParams()
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await fetch(`/api/universities?${params}`, {
        credentials: "include"
      })

      if (response.ok) {
        const data = await response.json()
        setUniversities(data.universities)
      }
    } catch (error) {
      console.error("Failed to fetch universities:", error)
    } finally {
      setLoading(false)
      setSearchLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchLoading(true)
    fetchUniversities()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSearchParams(prev => ({ ...prev, [name]: value }))
  }

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            大学搜索
          </h1>
          <p className="mt-2 text-gray-600">
            查找适合您的大学
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>搜索条件</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">搜索关键词</label>
                <Input
                  name="search"
                  placeholder="大学名称"
                  value={searchParams.search}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">国家</label>
                <Input
                  name="country"
                  placeholder="如：美国、英国"
                  value={searchParams.country}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">最低排名</label>
                <Input
                  name="minRanking"
                  type="number"
                  placeholder="1"
                  value={searchParams.minRanking}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">最高排名</label>
                <Input
                  name="maxRanking"
                  type="number"
                  placeholder="100"
                  value={searchParams.maxRanking}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">最低录取率</label>
                <Input
                  name="minAcceptanceRate"
                  type="number"
                  placeholder="0"
                  min="0"
                  max="100"
                  value={searchParams.minAcceptanceRate}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">最高录取率</label>
                <Input
                  name="maxAcceptanceRate"
                  type="number"
                  placeholder="100"
                  min="0"
                  max="100"
                  value={searchParams.maxAcceptanceRate}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="md:col-span-2 lg:col-span-3">
                <Button 
                  type="submit" 
                  className="w-full md:w-auto"
                  disabled={searchLoading}
                >
                  {searchLoading ? "搜索中..." : "搜索大学"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {universities.map((university) => (
            <Card key={university.id}>
              <CardHeader>
                <CardTitle className="text-lg">{university.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">国家:</span>
                    <span>{university.country}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">排名:</span>
                    <span>#{university.ranking}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">录取率:</span>
                    <span>{university.acceptanceRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">学费:</span>
                    <span>${university.tuitionFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">网站:</span>
                    <a 
                      href={university.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      访问官网
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {universities.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">没有找到符合条件的大学</p>
          </div>
        )}
      </div>
    </div>
  )
}