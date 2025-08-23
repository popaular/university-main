import { RegisterForm } from "@/components/auth/register-form"

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            大学申请追踪系统
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            一站式管理您的大学申请
          </p>
        </div>
        
        <RegisterForm />
      </div>
    </div>
  )
}