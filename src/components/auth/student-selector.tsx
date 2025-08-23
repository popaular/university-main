"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User } from "lucide-react"

interface Student {
  id: string
  name: string
  email: string
}

interface StudentSelectorProps {
  students: Student[]
  onSelectStudent: (studentId: string) => void
}

export function StudentSelector({ students, onSelectStudent }: StudentSelectorProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)

  const handleSelect = (studentId: string) => {
    setSelectedStudentId(studentId)
    onSelectStudent(studentId)
  }

  if (students.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>暂无绑定学生</CardTitle>
          <CardDescription>
            您还没有绑定任何学生账号。请联系学生或管理员添加绑定关系。
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>选择学生</CardTitle>
        <CardDescription>
          请选择您要查看的学生账号
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {students.map((student) => (
            <div
              key={student.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedStudentId === student.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => handleSelect(student.id)}
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-full">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium">{student.name}</p>
                  <p className="text-sm text-gray-500">{student.email}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}