"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function RegisterForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "STUDENT",
    studentEmail: "" // 用于家长注册时绑定学生
  })
  const [step, setStep] = useState(1) // 注册步骤：1基本信息 2绑定学生
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (step === 1) {
      // 第一步：验证基本信息
      if (formData.password !== formData.confirmPassword) {
        setError("密码不匹配")
        setLoading(false)
        return
      }

      if (formData.password.length < 6) {
        setError("密码至少需要6个字符")
        setLoading(false)
        return
      }

      if (formData.role === "PARENT") {
        // 家长注册需要第二步：绑定学生
        setStep(2)
        setLoading(false)
        return
      }
    }

    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      }

      // 如果是家长注册，添加学生邮箱
      if (formData.role === "PARENT" && formData.studentEmail) {
        payload.studentEmail = formData.studentEmail
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "注册失败")
      }

      // 注册成功后跳转到仪表板
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "注册失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-900">
          {step === 1 ? "注册新账号" : "绑定学生账号"}
        </CardTitle>
        <CardDescription className="text-gray-700">
          {step === 1 
            ? "创建账号开始管理您的大学申请" 
            : "请输入您要管理的学生邮箱"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-800">
              姓名
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="请输入您的姓名"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-800">
              邮箱
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="请输入您的邮箱"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2 text-gray-800">
              密码
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="请输入密码（至少6位）"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2 text-gray-800">
              确认密码
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          {step === 1 ? (
            <>
              <div>
                <label htmlFor="role" className="block text-sm font-medium mb-2 text-gray-800">
                  用户类型
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                >
                  <option value="STUDENT" className="text-gray-800">学生</option>
                  <option value="PARENT" className="text-gray-800">家长</option>
                </select>
              </div>
            </>
          ) : (
            <div>
              <label htmlFor="studentEmail" className="block text-sm font-medium mb-2 text-gray-800">
                学生邮箱
              </label>
              <Input
                id="studentEmail"
                name="studentEmail"
                type="email"
                placeholder="请输入学生的注册邮箱"
                value={formData.studentEmail}
                onChange={handleChange}
                required
              />
              <p className="text-sm text-gray-600 mt-1">
                请确保学生已注册账号，且邮箱填写正确
              </p>
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <div className="flex gap-2">
            {step === 2 && (
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={() => setStep(1)}
                disabled={loading}
              >
                上一步
              </Button>
            )}
            <Button type="submit" className="w-full bg-gray-900 text-white hover:bg-gray-800 font-semibold py-3" disabled={loading}>
              {loading ? (step === 1 ? "注册中..." : "绑定中...") : (step === 1 ? (formData.role === "PARENT" ? "下一步" : "注册") : "绑定")}
            </Button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <span className="text-sm text-gray-600">
            已有账号？
            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-blue-600 hover:underline ml-1"
            >
              立即登录
            </button>
          </span>
        </div>
      </CardContent>
    </Card>
  )
}