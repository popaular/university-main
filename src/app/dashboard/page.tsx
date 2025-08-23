"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { User } from "lucide-react"
import { StudentDashboard } from "@/components/dashboard/student-dashboard"
import { Navigation } from "@/components/layout/navigation"

interface User {
  id: string
  name: string
  email: string
  role: string
  parentChildren?: Array<{
    student: {
      id: string
      name: string
      email: string
    }
  }>
  studentParents?: Array<{
    parent: {
      id: string
      name: string
      email: string
    }
  }>
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
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
          
          // 如果是学生，直接使用自己的ID
          if (userData.role === 'STUDENT') {
            setSelectedStudentId(userData.id)
          }
        } else {
          router.push("/")
        }
      } catch (_error) {
        console.error("Auth check failed:", _error)
        router.push("/")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // 获取家长绑定的学生列表
  const parentStudents = user.parentChildren?.map(pc => pc.student) || []

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user.role === 'PARENT' && !selectedStudentId ? (
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">选择学生</h1>
            <div className="grid gap-4">
              {parentStudents.map((student) => (
                <div
                  key={student.id}
                  className="p-4 border rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  onClick={() => setSelectedStudentId(student.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                <p className="font-medium text-lg">{student.name}</p>
                <p className="text-sm text-gray-600">{student.email}</p>
              </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                {user.role === 'PARENT' ? `${parentStudents.find(s => s.id === selectedStudentId)?.name || ''}的仪表板` : '学生仪表板'}
              </h1>
              <p className="mt-2 text-gray-600">
                {user.role === 'PARENT' ? '查看和管理学生的大学申请' : '管理您的大学申请和追踪进度'}
              </p>
              {user.role === 'PARENT' && (
                <button
                  onClick={() => setSelectedStudentId(null)}
                  className="mt-2 text-blue-600 hover:underline text-sm"
                >
                  切换学生
                </button>
              )}
            </div>
            {selectedStudentId && <StudentDashboard studentId={selectedStudentId} />}
          </>
        )}
      </div>
    </div>
  )
}