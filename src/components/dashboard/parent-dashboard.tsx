'use client'

import { useState, useEffect } from "react"
import { DollarSign, Calculator, TrendingUp, BookOpen, CheckCircle, AlertCircle, Clock, Edit } from 'lucide-react'
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
}

interface FinancialPlan {
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
  const [viewMode, setViewMode] = useState<'overview' | 'financial'>('overview')
  const [financialPlans, setFinancialPlans] = useState<Record<string, FinancialPlan>>({})
  const [editingApplication, setEditingApplication] = useState<Application | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    notes: ''
  })
  const [editError, setEditError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showFinancialPlanModal, setShowFinancialPlanModal] = useState(false)
  const [financialPlanForm, setFinancialPlanForm] = useState<FinancialPlan>({
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
      fetchFinancialPlans(studentId)
    }
  }, [studentId])

  const fetchApplications = async (targetStudentId: string) => {
    try {
      const response = await fetch(`/api/student/applications?studentId=${targetStudentId}`)
      if (response.ok) {
        const data = await response.json()
        setApplications(data.applications)
      }
    } catch (_error) {
      console.error('Error fetching applications:', _error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFinancialPlans = async (_targetStudentId: string) => {
    // 这里可以调用API获取财务规划数据
    // 暂时使用模拟数据
    const mockPlans: Record<string, FinancialPlan> = {
      'cmemeyr5h00002fb3fdv99h31': {
        tuition: 45000,
        roomAndBoard: 15000,
        booksAndSupplies: 2000,
        personalExpenses: 3000,
        transportation: 2000,
        otherFees: 1500
      }
    }
    setFinancialPlans(mockPlans)
  }

  const handleEditNotes = (application: Application) => {
    setEditingApplication(application)
    setEditForm({
      notes: application.notes || ''
    })
    setShowEditModal(true)
    setEditError('')
  }

  const handleCreateFinancialPlan = () => {
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
      // 这里可以调用API保存财务规划
      // 暂时更新本地状态
      const newPlan: FinancialPlan = { ...financialPlanForm }
      setFinancialPlans(prev => ({
        ...prev,
        [studentId]: newPlan
      }))
      
      setShowFinancialPlanModal(false)
      // 切换到财务视图
      setViewMode('financial')
    } catch (error) {
      console.error('保存财务规划失败:', error)
    }
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

      // 重新获取最新数据以确保完全同步
      await fetchApplications(studentId)
      setShowEditModal(false)
      setEditingApplication(null)
      setEditForm({ notes: '' })
      setEditError('')
    } catch (_error) {
      console.error('Error updating notes:', _error)
      setEditError('网络错误，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'REJECTED':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case 'WAITLISTED':
        return <Clock className="h-5 w-3.5 text-orange-600" />
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

  const calculateTotalCost = (plan: FinancialPlan) => {
    return (plan.tuition || 0) + (plan.roomAndBoard || 0) + (plan.booksAndSupplies || 0) + 
           (plan.personalExpenses || 0) + (plan.transportation || 0) + (plan.otherFees || 0)
  }

  const getQuickStats = () => {
    const total = applications.length
    const submitted = applications.filter(app => app.status === 'SUBMITTED').length
    const accepted = applications.filter(app => app.decisionType === 'ACCEPTED').length
    const pending = applications.filter(app => 
      app.status === 'NOT_STARTED' || app.status === 'IN_PROGRESS'
    ).length

    return { total, submitted, accepted, pending }
  }

  const stats = getQuickStats()
  const currentFinancialPlan = financialPlans[studentId]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with View Toggle */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">家长仪表板</h1>
        <div className="flex space-x-2">
          <Button
            variant={viewMode === 'overview' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('overview')}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            申请概览
          </Button>
          <Button
            variant={viewMode === 'financial' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('financial')}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            财务规划
          </Button>
        </div>
      </div>

      {/* Overview View */}
      {viewMode === 'overview' && (
        <>
          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle>申请总览</CardTitle>
              <CardDescription>共 {stats.total} 个申请</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300 relative"
                  style={{ width: `${stats.total > 0 ? (stats.submitted + stats.accepted) / stats.total * 100 : 0}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 rounded-full"></div>
                </div>
              </div>
              <div className="flex justify-between items-center mt-3">
                <p className="text-sm font-medium text-gray-600">
                  {stats.total > 0 ? Math.round((stats.submitted + stats.accepted) / stats.total * 100) : 0}% 完成
                </p>
                <div className="flex space-x-3 text-xs flex-wrap">
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-gray-300 rounded-full mr-1"></span>
                    未开始: {applications.filter(app => app.status === 'NOT_STARTED').length}
                  </span>
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mr-1"></span>
                    进行中: {applications.filter(app => app.status === 'IN_PROGRESS').length}
                  </span>
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                    已提交: {stats.submitted}
                  </span>
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                    审核中: {applications.filter(app => app.status === 'UNDER_REVIEW').length}
                  </span>
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-red-400 rounded-full mr-1"></span>
                    已录取: {stats.accepted}
                  </span>
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
                    被拒绝: {applications.filter(app => app.decisionType === 'REJECTED').length}
                  </span>
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-orange-400 rounded-full mr-1"></span>
                    等待名单: {applications.filter(app => app.decisionType === 'WAITLISTED').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Applications List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">申请列表</h2>
            {applications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-600 mb-4" />
                  <p className="text-gray-600">还没有添加任何申请</p>
                </CardContent>
              </Card>
            ) : (
              applications.map((application) => (
                <Card key={application.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {application.university.name}
                        </CardTitle>
                        <CardDescription>
                          #{application.university.usNewsRanking} · {application.university.country}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(application.decisionType || application.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                          {application.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">申请类型:</span>
                        <span className="text-sm font-medium">
                          {application.applicationType.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">截止日期:</span>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium px-2 py-1 rounded ${getDeadlineColor(application.deadline).color}`}>
                            {new Date(application.deadline).toLocaleDateString('zh-CN')}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${getDeadlineColor(application.deadline).color}`}>
                            {getDeadlineColor(application.deadline).text}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">要求进度:</span>
                        <div className="mt-2">
                          <div className="flex space-x-2">
                            {application.requirements.map((req) => (
                              <span 
                                key={req.id}
                                className={`px-2 py-1 rounded text-xs ${
                                  req.status === 'COMPLETED' 
                                    ? 'bg-green-100 text-green-800' 
                                    : req.status === 'IN_PROGRESS'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {req.requirementType.replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* Status Change History */}
                      {application.statusLogs && application.statusLogs.length > 0 && (
                        <div className="border-t pt-3">
                          <span className="text-sm text-gray-600">状态变更历史:</span>
                          <div className="mt-2 space-y-2">
                            {application.statusLogs.slice(0, 3).map((log) => (
                              <div key={log.id} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                                <div className="flex items-center space-x-2">
                                  <span className="text-gray-600">
                                    {log.oldStatus.replace('_', ' ')} → {log.newStatus.replace('_', ' ')}
                                  </span>
                                  {log.reason && (
                                    <span className="text-gray-500">({log.reason})</span>
                                  )}
                                </div>
                                <div className="text-right text-gray-500">
                                  <div>{log.changedByUser.name}</div>
                                  <div className="text-xs">{new Date(log.createdAt).toLocaleDateString('zh-CN')}</div>
                                </div>
                              </div>
                            ))}
                            {application.statusLogs.length > 3 && (
                              <div className="text-xs text-gray-500 text-center">
                                还有 {application.statusLogs.length - 3} 条记录...
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Notes Section */}
                      <div className="border-t pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">备注:</span>
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
                          <div className="text-sm text-gray-700 bg-blue-50 p-2 rounded">
                            {application.notes}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400 italic">
                            暂无备注
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}

      {/* Financial Planning View */}
      {viewMode === 'financial' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">财务规划</h2>
          
          {currentFinancialPlan ? (
            <>
              {/* Total Cost Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                    年度总费用概览
                  </CardTitle>
                  <CardDescription>预估每年的总教育成本</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600 mb-2">
                      ${calculateTotalCost(currentFinancialPlan).toLocaleString()}
                    </div>
                    <p className="text-gray-600">每年总费用</p>
                  </div>
                </CardContent>
              </Card>

              {/* Cost Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calculator className="h-5 w-5 mr-2 text-blue-600" />
                      学费成本
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>学费</span>
                        <span className="font-semibold">${(currentFinancialPlan.tuition || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>住宿餐饮</span>
                        <span className="font-semibold">${(currentFinancialPlan.roomAndBoard || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>书籍用品</span>
                        <span className="font-semibold">${(currentFinancialPlan.booksAndSupplies || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
                      其他费用
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>个人开支</span>
                        <span className="font-semibold">${(currentFinancialPlan.personalExpenses || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>交通费用</span>
                        <span className="font-semibold">${(currentFinancialPlan.transportation || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>其他费用</span>
                        <span className="font-semibold">${(currentFinancialPlan.otherFees || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Financial Planning Tools */}
              <Card>
                <CardHeader>
                  <CardTitle>财务规划工具</CardTitle>
                  <CardDescription>帮助您更好地规划教育投资</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button variant="outline" className="h-20 flex-col">
                      <Calculator className="h-6 w-6 mb-2" />
                      费用计算器
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <TrendingUp className="h-6 w-6 mb-2" />
                      投资回报分析
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <DollarSign className="h-6 w-6 mb-2" />
                      奖学金搜索
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <DollarSign className="h-12 w-12 text-gray-600 mb-4" />
                <p className="text-gray-600">暂无财务规划数据</p>
                <Button 
                  className="mt-4" 
                  variant="outline"
                  onClick={() => handleCreateFinancialPlan()}
                >
                  创建财务规划
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

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
            <h3 className="text-lg font-semibold mb-4">创建财务规划</h3>
            <p className="text-sm text-gray-600 mb-4">为孩子的大学教育制定详细的财务预算</p>
            
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
                onClick={() => setShowFinancialPlanModal(false)}
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