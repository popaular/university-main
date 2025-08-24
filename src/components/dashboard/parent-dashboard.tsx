'use client'

import { useState, useEffect } from "react"
import { DollarSign, Calculator, TrendingUp, BookOpen, CheckCircle, AlertCircle, Clock, Edit, Plus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Application {
  id: string
  university: {
    name: string
    usNewsRanking?: number
    country: string
  }
  applicationType: string
  deadline: string
  status: string
  decisionType?: string
  requirements: Array<{
    id: string
    requirementType: string
    status: string
  }>
  statusLogs: Array<{
    id: string
    oldStatus: string
    newStatus: string
    changedBy: string
    changedByRole: string
    reason?: string
    createdAt: string
    changedByUser: {
      name: string
      role: string
    }
  }>
  notes?: string
  financialPlan?: FinancialPlan
}

interface FinancialPlan {
  id: string
  applicationId: string
  parentId: string
  tuition?: number
  roomAndBoard?: number
  booksAndSupplies?: number
  personalExpenses?: number
  transportation?: number
  otherFees?: number
  notes?: string
  createdAt: string
  updatedAt: string
  application: {
    id: string
    university: {
      name: string
      country: string
    }
  }
  parent: {
    id: string
    name: string
    email: string
  }
}

interface FinancialPlanForm {
  tuition?: number
  roomAndBoard?: number
  booksAndSupplies?: number
  personalExpenses?: number
  transportation?: number
  otherFees?: number
}

interface ParentDashboardProps {
  studentId: string
}

export function ParentDashboard({ studentId }: ParentDashboardProps) {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  // 移除 viewMode 状态，因为不再需要标签页切换
  
  // 编辑备注状态
  const [editingApplication, setEditingApplication] = useState<Application | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({ notes: '' })
  const [editError, setEditError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  
  // 财务规划状态
  const [showFinancialPlanModal, setShowFinancialPlanModal] = useState(false)
  const [selectedApplicationId, setSelectedApplicationId] = useState<string>('')
  const [financialPlanForm, setFinancialPlanForm] = useState<FinancialPlanForm>({
    tuition: undefined,
    roomAndBoard: undefined,
    booksAndSupplies: undefined,
    personalExpenses: undefined,
    transportation: undefined,
    otherFees: undefined
  })

  useEffect(() => {
    if (studentId) {
      fetchApplications(studentId)
    }
  }, [studentId])

  const fetchApplications = async (targetStudentId: string) => {
    try {
      const response = await fetch(`/api/student/applications?studentId=${targetStudentId}`)
      if (response.ok) {
        const data = await response.json()
        setApplications(data.applications)
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditNotes = (application: Application) => {
    setEditingApplication(application)
    setEditForm({
      notes: application.notes || ''
    })
    setShowEditModal(true)
    setEditError('')
  }

  const handleSaveNotes = async () => {
    if (!editingApplication) return

    setEditError('')
    setIsSaving(true)
    
    try {
      const response = await fetch(`/api/student/applications/${editingApplication.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: editForm.notes,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setEditError(data.error || '更新备注失败')
        return
      }

      // 重新获取最新数据
      await fetchApplications(studentId)
      setShowEditModal(false)
      setEditingApplication(null)
      setEditForm({ notes: '' })
      setEditError('')
    } catch (error) {
      console.error('Error updating notes:', error)
      setEditError('网络错误，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateFinancialPlan = (applicationId: string) => {
    setSelectedApplicationId(applicationId)
    setShowFinancialPlanModal(true)
    // 重置表单为空值
    setFinancialPlanForm({
      tuition: undefined,
      roomAndBoard: undefined,
      booksAndSupplies: undefined,
      personalExpenses: undefined,
      transportation: undefined,
      otherFees: undefined
    })
  }

  const handleSaveFinancialPlan = async () => {
    try {
      // 调用API保存财务规划
      const response = await fetch('/api/financial-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId: selectedApplicationId,
          tuition: financialPlanForm.tuition,
          roomAndBoard: financialPlanForm.roomAndBoard,
          booksAndSupplies: financialPlanForm.booksAndSupplies,
          personalExpenses: financialPlanForm.personalExpenses,
          transportation: financialPlanForm.transportation,
          otherFees: financialPlanForm.otherFees,
          notes: ''
        }),
      })

      if (response.ok) {
        // 重新获取申请数据，包含新的财务规划
        await fetchApplications(studentId)
        setShowFinancialPlanModal(false)
        setSelectedApplicationId('')
        // 财务规划创建成功
      } else {
        const errorData = await response.json()
        console.error('保存财务规划失败:', errorData.error)
        alert('保存失败: ' + errorData.error)
      }
    } catch (error) {
      console.error('保存财务规划失败:', error)
      alert('网络错误，请稍后重试')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'REJECTED':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case 'WAITLISTED':
        return <Clock className="h-5 w-5 text-orange-600" />
      default:
        return <BookOpen className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NOT_STARTED':
        return 'bg-gray-100 text-gray-800'
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800'
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-800'
      case 'UNDER_REVIEW':
        return 'bg-purple-100 text-purple-800'
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      case 'WAITLISTED':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getDeadlineColor = (deadline: string) => {
    const today = new Date()
    const deadlineDate = new Date(deadline)
    const timeDiff = deadlineDate.getTime() - today.getTime()
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
    
    if (daysDiff < 0) {
      return { color: 'bg-red-100 text-red-800', text: '已到期' }
    } else if (daysDiff <= 15) {
      return { color: 'bg-orange-100 text-orange-800', text: '即将到期' }
    } else {
      return { color: 'bg-green-100 text-green-800', text: '正常' }
    }
  }

  const calculateTotalCost = (plan: FinancialPlanForm) => {
    return (plan.tuition || 0) + (plan.roomAndBoard || 0) + (plan.booksAndSupplies || 0) + 
           (plan.personalExpenses || 0) + (plan.transportation || 0) + (plan.otherFees || 0)
  }

  const getQuickStats = () => {
    const total = applications.length
    const submitted = applications.filter(app => app.status === 'SUBMITTED').length
    const accepted = applications.filter(app => app.status === 'ACCEPTED').length
    const withFinancialPlan = applications.filter(app => app.financialPlan).length
    
    return { total, submitted, accepted, withFinancialPlan }
  }

  const stats = getQuickStats()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">学生申请概览</h1>
        <div>
        
        </div>
      </div>

      {/* 快速统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-gray-600">总申请</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.submitted}</p>
                <p className="text-sm text-gray-600">已提交</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.accepted}</p>
                <p className="text-sm text-gray-600">已录取</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{stats.withFinancialPlan}</p>
                <p className="text-sm text-gray-600">财务规划</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {applications.map((application) => (
            <Card key={application.id} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl text-gray-900">
                      {application.university.name}
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      {application.university.country} • {application.applicationType.replace('_', ' ')}
                      {application.university.usNewsRanking && (
                        <span className="ml-2">排名: #{application.university.usNewsRanking}</span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(application.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                      {application.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* 申请基本信息 - 重新设计为更清晰的布局 */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 左侧：基本信息 */}
                    <div className="lg:col-span-2 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">截止日期</span>
                            <div className="text-right">
                              <div className={`text-sm font-semibold px-2 py-1 rounded-full ${getDeadlineColor(application.deadline).color}`}>
                                {new Date(application.deadline).toLocaleDateString('zh-CN')}
                              </div>
                              <div className={`text-xs mt-1 px-2 py-1 rounded-full ${getDeadlineColor(application.deadline).color}`}>
                                {getDeadlineColor(application.deadline).text}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">申请类型</span>
                            <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                              {application.applicationType.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">申请状态</span>
                            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${getStatusColor(application.status)}`}>
                              {application.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">财务规划</span>
                            {application.financialPlan ? (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">已创建</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCreateFinancialPlan(application.id)}
                                  className="h-7 px-2 text-blue-600 border-blue-600 hover:bg-blue-50"
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  编辑
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCreateFinancialPlan(application.id)}
                                className="h-7 px-2 text-blue-600 border-blue-600 hover:bg-blue-50"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                创建规划
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 右侧：备注 */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">备注</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditNotes(application)}
                          className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {application.notes ? (
                        <div className="text-sm text-gray-700 bg-white p-3 rounded border">
                          {application.notes}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400 italic bg-white p-3 rounded border">
                          暂无备注
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* 状态变更历史 - 更清晰的表格样式 */}
                  {application.statusLogs && application.statusLogs.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-600" />
                        状态变更历史
                      </h4>
                      <div className="bg-white rounded-lg border overflow-hidden">
                        <div className="grid grid-cols-5 gap-4 p-3 bg-gray-100 text-xs font-medium text-gray-700 border-b">
                          <div>日期</div>
                          <div>原状态</div>
                          <div>新状态</div>
                          <div>变更人</div>
                          <div>原因</div>
                        </div>
                        {application.statusLogs.slice(0, 3).map((log) => (
                          <div key={log.id} className="grid grid-cols-5 gap-4 p-3 text-xs text-gray-600 border-b last:border-b-0">
                            <div>{new Date(log.createdAt).toLocaleDateString('zh-CN')}</div>
                            <div className="text-gray-500">{log.oldStatus.replace('_', ' ')}</div>
                            <div className="text-gray-500">→ {log.newStatus.replace('_', ' ')}</div>
                            <div className="text-gray-500">{log.changedByUser.name}</div>
                            <div className="text-gray-400">{log.reason || '-'}</div>
                          </div>
                        ))}
                      </div>
                      {application.statusLogs.length > 3 && (
                        <div className="text-xs text-blue-600 mt-2 text-center">
                          还有 {application.statusLogs.length - 3} 条记录...
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 申请要求状态 - 更直观的进度显示 */}
                  {application.requirements && application.requirements.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2 text-gray-600" />
                        申请要求进度
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {application.requirements.map((req) => (
                          <div key={req.id} className="bg-white p-3 rounded-lg border">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`w-3 h-3 rounded-full ${
                                req.status === 'COMPLETED' ? 'bg-green-500' : 
                                req.status === 'IN_PROGRESS' ? 'bg-yellow-500' : 'bg-gray-400'
                              }`}></span>
                              <span className="text-xs font-medium text-gray-700">{req.requirementType.replace('_', ' ')}</span>
                            </div>
                            <div className={`text-xs px-2 py-1 rounded-full text-center ${
                              req.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                              req.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {req.status === 'COMPLETED' ? '已完成' : 
                               req.status === 'IN_PROGRESS' ? '进行中' : '未开始'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* 财务规划详情 - 更突出的费用展示 */}
                  {application.financialPlan && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                      <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                        <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
                        财务规划详情
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-white p-3 rounded-lg border border-blue-100">
                          <p className="text-xs text-gray-600 mb-1">学费</p>
                          <p className="text-lg font-bold text-blue-900">${(application.financialPlan.tuition || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-blue-100">
                          <p className="text-xs text-gray-600 mb-1">住宿餐饮</p>
                          <p className="text-lg font-bold text-blue-900">${(application.financialPlan.roomAndBoard || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-blue-100">
                          <p className="text-xs text-gray-600 mb-1">书籍用品</p>
                          <p className="text-lg font-bold text-blue-900">${(application.financialPlan.booksAndSupplies || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-blue-100">
                          <p className="text-xs text-gray-600 mb-1">个人开支</p>
                          <p className="text-lg font-bold text-blue-900">${(application.financialPlan.personalExpenses || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-blue-100">
                          <p className="text-xs text-gray-600 mb-1">交通费用</p>
                          <p className="text-lg font-bold text-blue-900">${(application.financialPlan.transportation || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-blue-100">
                          <p className="text-xs text-gray-600 mb-1">其他费用</p>
                          <p className="text-lg font-bold text-blue-900">${(application.financialPlan.otherFees || 0).toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg border border-blue-200">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-blue-900">总费用预估</span>
                          <span className="text-2xl font-bold text-blue-900">
                            ${((application.financialPlan.tuition || 0) +
                               (application.financialPlan.roomAndBoard || 0) +
                               (application.financialPlan.booksAndSupplies || 0) +
                               (application.financialPlan.personalExpenses || 0) +
                               (application.financialPlan.transportation || 0) +
                               (application.financialPlan.otherFees || 0)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

      {/* 编辑备注模态框 */}
      {showEditModal && editingApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              编辑备注 - {editingApplication.university.name}
            </h3>
            {editError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{editError}</p>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">备注内容</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="添加关于此申请的备注..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false)
                  setEditingApplication(null)
                  setEditForm({ notes: '' })
                  setEditError('')
                }}
                className="flex-1"
              >
                取消
              </Button>
              <Button
                onClick={handleSaveNotes}
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving ? '保存中...' : '保存备注'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 创建财务规划模态框 */}
      {showFinancialPlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <h3 className="text-lg font-semibold mb-4">
              创建财务规划 - {applications.find(app => app.id === selectedApplicationId)?.university.name}
            </h3>
            <p className="text-sm text-gray-600 mb-4">为此申请制定详细的财务预算</p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">学费 (美元)</label>
                  <input
                    type="number"
                    value={financialPlanForm.tuition || ''}
                    onChange={(e) => setFinancialPlanForm(prev => ({ ...prev, tuition: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入费用"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">住宿和餐饮 (美元)</label>
                  <input
                    type="number"
                    value={financialPlanForm.roomAndBoard || ''}
                    onChange={(e) => setFinancialPlanForm(prev => ({ ...prev, roomAndBoard: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入费用"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">书籍和用品 (美元)</label>
                  <input
                    type="number"
                    value={financialPlanForm.booksAndSupplies || ''}
                    onChange={(e) => setFinancialPlanForm(prev => ({ ...prev, booksAndSupplies: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入费用"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">个人开支 (美元)</label>
                  <input
                    type="number"
                    value={financialPlanForm.personalExpenses || ''}
                    onChange={(e) => setFinancialPlanForm(prev => ({ ...prev, personalExpenses: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入费用"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">交通费用 (美元)</label>
                  <input
                    type="number"
                    value={financialPlanForm.transportation || ''}
                    onChange={(e) => setFinancialPlanForm(prev => ({ ...prev, transportation: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入费用"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">其他费用 (美元)</label>
                  <input
                    type="number"
                    value={financialPlanForm.otherFees || ''}
                    onChange={(e) => setFinancialPlanForm(prev => ({ ...prev, otherFees: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入费用"
                  />
                </div>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>总费用预估:</strong> ${calculateTotalCost(financialPlanForm).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowFinancialPlanModal(false)
                  setSelectedApplicationId('')
                }}
                className="flex-1"
              >
                取消
              </Button>
              <Button
                onClick={handleSaveFinancialPlan}
                className="flex-1"
              >
                保存财务规划
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 