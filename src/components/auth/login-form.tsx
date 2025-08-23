'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setError(data.error || '登录失败')
      }
    } catch (_error) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-900">登录</CardTitle>
        <CardDescription className="text-gray-700">请输入您的邮箱和密码</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-800">
              邮箱
            </label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-800">
              密码
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}

          <Button type="submit" className="w-full bg-gray-900 text-white hover:bg-gray-800 font-semibold py-3" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          <span className="text-gray-700">测试账号：</span>
          <br />
          <span className="text-gray-600">学生：student@example.com / password</span>
          <br />
          <span className="text-gray-600">家长：parent@example.com / password</span>
        </div>

        <div className="mt-4 text-center">
          <span className="text-sm text-gray-700">
            还没有账号？
            <button
              type="button"
              onClick={() => router.push("/register")}
              className="text-blue-600 hover:underline ml-1"
            >
              立即注册
            </button>
          </span>
        </div>
      </CardContent>
    </Card>
  )
}