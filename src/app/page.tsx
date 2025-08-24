"use client"

import { useState, useEffect } from "react"
import { LoginForm } from '@/components/auth/login-form'
import { RegisterForm } from '@/components/auth/register-form'

export default function HomePage() {
  const [isLogin, setIsLogin] = useState(true)
  
  // 检查URL参数，自动切换到登录表单
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const tab = urlParams.get('tab')
    if (tab === 'login') {
      setIsLogin(true)
    } else if (tab === 'register') {
      setIsLogin(false)
    }
  }, [])

  // 监听注册成功后的切换事件
  useEffect(() => {
    const handleSwitchToLogin = () => {
      setIsLogin(true)
    }

    window.addEventListener('switchToLogin', handleSwitchToLogin)
    
    return () => {
      window.removeEventListener('switchToLogin', handleSwitchToLogin)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            大学申请追踪系统
          </h1>
          <p className="mt-2 text-gray-600">
            一站式管理您的大学申请
          </p>
        </div>
        
        {isLogin ? <LoginForm /> : <RegisterForm />}
        
        <div className="text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:underline"
          >
            {isLogin ? "还没有账号？立即注册" : "已有账号？立即登录"}
          </button>
        </div>
      </div>
    </div>
  )
}
