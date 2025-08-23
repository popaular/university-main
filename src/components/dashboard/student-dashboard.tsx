'use client'

import { useState, useEffect } from "react"
import { Plus, Calendar, CheckCircle, Clock, AlertCircle, Edit, Trash2, User, Settings, TrendingUp, List } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDeadline, calculateProgress, getStatusColor } from '@/lib/utils'
import { ApplicationTimeline } from './application-timeline'

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
}

interface StudentDashboardProps {
  studentId?: string
}

export function StudentDashboard({ studentId }: StudentDashboardProps) {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [editingApplication, setEditingApplication] = useState<Application | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    status: '',
    notes: '',
    applicationType: ''
  })
  const [editError, setEditError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [viewMode, setViewMode] = useState<'cards' | 'timeline'>('cards')

  // 获取允许的状态选项
  const getAllowedStatusOptions = (currentStatus: string) => {
    const validTransitions: Record<string, string[]> = {
      'NOT_STARTED': ['IN_PROGRESS'],
      'IN_PROGRESS': ['SUBMITTED', 'ACCEPTED', 'REJECTED', 'WAITLISTED'],
      'SUBMITTED': ['UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'WAITLISTED'],
      'UNDER_REVIEW': ['ACCEPTED', 'REJECTED', 'WAITLISTED'],
      'ACCEPTED': [],
      'REJECTED': [],
      'WAITLISTED': ['ACCEPTED', 'REJECTED']
    }

    const statusLabels: Record<string, string> = {
      'NOT_STARTED': '未开始',
      'IN_PROGRESS': '进行中',
      'SUBMITTED': '已提交',
      'UNDER_REVIEW': '审核中',
      'ACCEPTED': '已录取',
      'REJECTED': '被拒绝',
      'WAITLISTED': '等待名单'
    }

    const allowedTransitions = validTransitions[currentStatus] || []
    return allowedTransitions.map(status => ({
      value: status,
      label: statusLabels[status]
    }))
  }

  useEffect(() => {
    if (studentId) {
      fetchApplications(studentId)
    } else {
      fetchApplications()
    }
  }, [studentId])

  const fetchApplications = async (targetStudentId?: string) => {
    try {
      let url = '/api/student/applications'
      if (targetStudentId) {
        url += `?studentId=${targetStudentId}`
      }
      
      const response = await fetch(url)
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

  const handleEdit = (application: Application) => {
    setEditingApplication(application)
    setEditForm({
      status: application.status,
      notes: application.notes || '',
      applicationType: application.applicationType
    })
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
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
          ...(editForm.status && { status: editForm.status }),
          ...(editForm.notes && { notes: editForm.notes }),
          ...(editForm.applicationType && { applicationType: editForm.applicationType }),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setEditError(data.error || '更新失败')
        return
      }

      // 重新获取最新数据以确保完全同步
      await fetchApplications()
      setShowEditModal(false)
      setEditingApplication(null)
      setEditForm({ status: '', notes: '', applicationType: '' })
      setEditError('')
    } catch (error) {
      console.error('Error updating application:', error)
      setEditError('网络错误，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (applicationId: string) => {
    if (!confirm('确定要删除这个申请吗？此操作不可撤销。')) {
      return
    }

    try {
      const response = await fetch(`/api/student/applications/${applicationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || '删除失败')
        return
      }

      // 重新获取最新数据以确保完全同步
      await fetchApplications()
    } catch (error) {
      console.error('Error deleting application:', error)
      alert('删除申请失败')
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
        return <Calendar className="h-5 w-5 text-gray-600" />
    }
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
  const progress = calculateProgress(applications)

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
        <h1 className="text-2xl font-bold">我的申请</h1>
        <div className="flex space-x-2">
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('cards')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            卡片视图
          </Button>
          <Button
            variant={viewMode === 'timeline' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('timeline')}
          >
            <List className="h-4 w-4 mr-2" />
            时间线视图
          </Button>
        </div>
      </div>

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
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 rounded-full"></div>
            </div>
          </div>
          <div className="flex justify-between items-center mt-3">
            <p className="text-sm font-medium text-gray-600">{progress}% 完成</p>
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



      {/* Applications List - Only show in cards view */}
      {viewMode === 'cards' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">申请列表</h2>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/student/profile'}
              >
                <User className="h-4 w-4 mr-2" />
                完善资料
              </Button>
              <Button onClick={() => window.location.href = '/applications/new'}>
                <Plus className="h-4 w-4 mr-2" />
                创建新申请
              </Button>
            </div>
          </div>

        {applications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-gray-600 mb-4" />
              <p className="text-gray-600">还没有添加任何申请</p>
              <Button className="mt-4" variant="outline" onClick={() => window.location.href = '/applications/new'}>
                开始创建申请
              </Button>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(application)}
                      className="h-7 w-7 p-0"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(application.id)}
                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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
                    <span className={`text-sm font-medium px-2 py-1 rounded ${formatDeadline(application.deadline).color}`}>
                      {formatDeadline(application.deadline).text}
                    </span>
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
                </div>
              </CardContent>
            </Card>
          )))}
        </div>
      )}

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <div>
          <ApplicationTimeline />
        </div>
      )}

      {/* 编辑模态框 */}
      {showEditModal && editingApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
            编辑申请 - {editingApplication.university.name}
          </h3>
          {editError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{editError}</p>
            </div>
          )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">申请状态</label>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    当前状态: <span className="font-medium">{editingApplication.status.replace('_', ' ')}</span>
                  </p>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">保持当前状态</option>
                    {getAllowedStatusOptions(editingApplication.status).map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {getAllowedStatusOptions(editingApplication.status).length === 0 && (
                    <p className="text-sm text-orange-600">
                      ⚠️ 当前状态为终态，无法修改
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">申请类型</label>
                <select
                  value={editForm.applicationType}
                  onChange={(e) => setEditForm(prev => ({ ...prev, applicationType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="REGULAR_DECISION">常规申请 (RD)</option>
                  <option value="EARLY_ACTION">提前行动 (EA)</option>
                  <option value="EARLY_DECISION">提前决定 (ED)</option>
                  <option value="ROLLING_ADMISSION">滚动录取</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">备注</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
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
                  setEditForm({ status: '', notes: '', applicationType: '' })
                  setEditError('')
                }}
                className="flex-1"
              >
                取消
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving ? '保存中...' : '保存修改'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}