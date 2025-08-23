"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface NavigationProps {
  user?: {
    id: string
    name: string
    email: string
    role: string
  }
}

export function Navigation({ user }: NavigationProps) {
  const router = useRouter()

  const handleLogout = () => {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    router.push('/')
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">
              大学申请追踪系统
            </h1>
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                欢迎, {user.name}
              </span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {user.role === 'STUDENT' ? '学生' : '家长'}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
              >
                退出登录
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}