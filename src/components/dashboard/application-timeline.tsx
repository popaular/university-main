'use client'

import { useState, useEffect, useCallback } from "react"
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  ChevronRight,
  Target,
  BookOpen,
  Award,
  FileText,
  Plus,
  User,
  Edit
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { calculateProgress } from '@/lib/utils'

interface Application {
  id: string
  university: {
    name: string
    usNewsRanking?: number
    country: string
    logo?: string
  }
  applicationType: string
  deadline: string
  status: string
  decisionType?: string
  requirements: Array<{
    id: string
    requirementType: string
    status: string
    completedAt?: string
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
  createdAt: string
  updatedAt: string
}

interface TimelineStats {
  totalApplications: number
  upcomingDeadlines: number
  completedApplications: number
  averageProgress: number
  urgentDeadlines: number
}

interface ApplicationTimelineProps {
  userRole?: 'STUDENT' | 'PARENT'
}

export function ApplicationTimeline({ userRole = 'STUDENT' }: ApplicationTimelineProps) {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [showStatusSelector, setShowStatusSelector] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [statusReason, setStatusReason] = useState<string>('')
  const [timelineStats, setTimelineStats] = useState<TimelineStats>({
    totalApplications: 0,
    upcomingDeadlines: 0,
    completedApplications: 0,
    averageProgress: 0,
    urgentDeadlines: 0
  })
  const [isClient, setIsClient] = useState(false)

  const calculateTimelineStats = useCallback((apps: Application[]) => {
    if (!isClient) return {
      totalApplications: 0,
      upcomingDeadlines: 0,
      completedApplications: 0,
      averageProgress: 0,
      urgentDeadlines: 0
    }
    
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const stats = {
      totalApplications: apps.length,
      upcomingDeadlines: apps.filter(app => 
        new Date(app.deadline) <= thirtyDaysFromNow && 
        new Date(app.deadline) >= now &&
        app.status !== 'SUBMITTED' && app.status !== 'ACCEPTED'
      ).length,
      completedApplications: apps.filter(app => 
        app.status === 'SUBMITTED' || app.status === 'ACCEPTED'
      ).length,
      averageProgress: apps.length > 0 
        ? apps.reduce((sum, app) => sum + calculateProgress([app]), 0) / apps.length 
        : 0,
      urgentDeadlines: apps.filter(app => {
        const deadline = new Date(app.deadline)
        const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return daysUntilDeadline <= 7 && daysUntilDeadline >= 0 && app.status !== 'SUBMITTED'
      }).length
    }

    return stats
  }, [isClient])

  const fetchTimelineData = useCallback(async () => {
    try {
      const response = await fetch('/api/student/applications')
      if (response.ok) {
        const data = await response.json()
        setApplications(data.applications)
        setTimelineStats(calculateTimelineStats(data.applications))
      } else {
        console.error('Failed to fetch applications')
      }
    } catch (error) {
      console.error('Error fetching timeline data:', error)
    } finally {
      setLoading(false)
    }
  }, [calculateTimelineStats])

  const updateApplicationStatus = async (applicationId: string, newStatus: string, reason?: string) => {
    try {
      setUpdatingStatus(applicationId)
      const response = await fetch(`/api/student/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, reason }),
      })

      if (response.ok) {
        const data = await response.json()
        // 更新本地状态
        setApplications(prev => 
          prev.map(app => 
            app.id === applicationId ? data.application : app
          )
        )
        // 重新计算统计
        setTimelineStats(calculateTimelineStats(applications))
        // 关闭状态选择器
        setShowStatusSelector(null)
        setSelectedStatus('')
        setStatusReason('')
      } else {
        console.error('Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleStatusUpdate = (applicationId: string) => {
    if (selectedStatus) {
      updateApplicationStatus(applicationId, selectedStatus, statusReason || undefined)
    }
  }

  useEffect(() => {
    setIsClient(true)
    fetchTimelineData()
  }, [fetchTimelineData])

  const getTimelineItems = () => {
    if (!isClient) return []
    
    const now = new Date()
    const sortedApps = [...applications].sort((a, b) => 
      new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    )

    const items = sortedApps.map(app => {
      const deadline = new Date(app.deadline)
      const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const progress = calculateProgress([app])
      
      return {
        ...app,
        daysUntilDeadline,
        progress,
        urgency: daysUntilDeadline <= 7 ? 'urgent' : daysUntilDeadline <= 30 ? 'soon' : 'normal'
      }
    })

    // 调试信息
    console.log('=== getTimelineItems 结果 ===')
    items.forEach((item, index) => {
      console.log(`Timeline Item ${index + 1}:`, {
        id: item.id,
        university: item.university?.name,
        statusLogsCount: item.statusLogs?.length || 0,
        hasStatusLogs: !!item.statusLogs && item.statusLogs.length > 0
      })
    })

    return items
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return <Award className="h-5 w-5 text-green-600" />
      case 'REJECTED':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case 'WAITLISTED':
        return <Clock className="h-5 w-5 text-orange-600" />
      case 'SUBMITTED':
        return <CheckCircle className="h-5 w-5 text-blue-600" />
      case 'IN_PROGRESS':
        return <TrendingUp className="h-5 w-5 text-yellow-600" />
      default:
        return <Target className="h-5 w-5 text-gray-600" />
    }
  }

  const getTimelineColor = (urgency: string, status: string) => {
    if (status === 'ACCEPTED') return 'border-green-500 bg-green-50'
    if (status === 'REJECTED') return 'border-red-500 bg-red-50'
    
    switch (urgency) {
      case 'urgent':
        return 'border-red-500 bg-red-50'
      case 'soon':
        return 'border-orange-500 bg-orange-50'
      default:
        return 'border-blue-500 bg-blue-50'
    }
  }

  const formatTimelineDate = (date: string) => {
    if (!isClient) return '计算中...'
    
    const deadline = new Date(date)
    const now = new Date()
    const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntil < 0) return `已截止 (${Math.abs(daysUntil)}天前)`
    if (daysUntil === 0) return '今天截止'
    if (daysUntil === 1) return '明天截止'
    return `${daysUntil}天后截止`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const timelineItems = getTimelineItems()

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">总申请数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{timelineStats.totalApplications}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">即将截止</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{timelineStats.upcomingDeadlines}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">紧急截止</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{timelineStats.urgentDeadlines}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">平均进度</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(timelineStats.averageProgress)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline View */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">申请时间线</h2>
            {userRole === 'STUDENT' && (
              <Button onClick={() => window.location.href = '/applications/new'}>
                <Plus className="h-4 w-4 mr-2" />
                创建新申请
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {timelineItems.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">还没有创建任何申请</p>
              {userRole === 'STUDENT' && (
                <Button 
                  className="mt-4" 
                  variant="outline"
                  onClick={() => window.location.href = '/applications/new'}
                >
                  创建第一个申请
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {timelineItems.map((item, index) => (
                <div key={item.id} className="relative">
                  {/* Timeline line */}
                  {index < timelineItems.length - 1 && (
                    <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200"></div>
                  )}
                  
                  {/* Timeline item */}
                  <div className={`relative flex items-start space-x-4 p-4 rounded-lg border-2 ${getTimelineColor(item.urgency, item.status)}`}>
                    {/* Timeline dot */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                      item.status === 'ACCEPTED' ? 'bg-green-500' :
                      item.status === 'REJECTED' ? 'bg-red-500' :
                      item.urgency === 'urgent' ? 'bg-red-500' :
                      item.urgency === 'soon' ? 'bg-orange-500' : 'bg-blue-500'
                    }`}>
                      {getStatusIcon(item.status)}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{item.university.name}</h3>
                          <p className="text-sm text-gray-600">
                            #{item.university.usNewsRanking} · {item.university.country} · {item.applicationType.replace('_', ' ')}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={item.urgency === 'urgent' ? 'destructive' : 
                                     item.urgency === 'soon' ? 'secondary' : 'default'}
                            className="mb-1"
                          >
                            <span suppressHydrationWarning>{formatTimelineDate(item.deadline)}</span>
                          </Badge>
                          <p className="text-xs text-gray-500" suppressHydrationWarning>
                            {new Date(item.deadline).toLocaleDateString('zh-CN')}
                          </p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>完成进度</span>
                          <span>{item.progress}%</span>
                        </div>
                        <Progress value={item.progress} className="h-2" />
                      </div>

                      {/* Requirements */}
                      {item.requirements.length > 0 && (
                        <div className="mt-3">
                          <div className="flex flex-wrap gap-2">
                            {item.requirements.map(req => (
                              <Badge 
                            key={req.id}
                            variant={req.status === 'COMPLETED' ? 'default' : 'outline'}
                            className="text-xs bg-green-100 text-green-800"
                          >
                            {req.requirementType.replace('_', ' ')}
                          </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Status Change History */}
                      <div className="mt-3">
                        <div className="border-t pt-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">状态变更历史</h4>
                          
                          {item.statusLogs && item.statusLogs.length > 0 ? (
                            <div className="space-y-2">
                              {item.statusLogs.slice(0, 3).map((log) => (
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
                              {item.statusLogs.length > 3 && (
                                <div className="text-xs text-gray-500 text-center">
                                  还有 {item.statusLogs.length - 3} 条记录...
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400 text-center py-2">
                              暂无状态变更记录
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="mt-3 flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.location.href = `/applications/${item.id}`}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          详情
                        </Button>
                        {item.status === 'NOT_STARTED' && (
                          <Button size="sm">
                            <ChevronRight className="h-3 w-3 mr-1" />
                            开始申请
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setShowStatusSelector(item.id)}
                          disabled={updatingStatus === item.id}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          {updatingStatus === item.id ? '更新中...' : '更新状态'}
                        </Button>
                      </div>

                      {/* Status Update Selector */}
                      {showStatusSelector === item.id && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                选择新状态
                              </label>
                              <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              >
                                <option value="">请选择状态</option>
                                <option value="NOT_STARTED">未开始</option>
                                <option value="IN_PROGRESS">进行中</option>
                                <option value="SUBMITTED">已提交</option>
                                <option value="UNDER_REVIEW">审核中</option>
                                <option value="DECISION_RECEIVED">收到决定</option>
                                <option value="INTERVIEW_SCHEDULED">面试已安排</option>
                                <option value="ACCEPTED">已录取</option>
                                <option value="REJECTED">被拒绝</option>
                                <option value="WAITLISTED">等待名单</option>
                                <option value="DEFERRED">延期</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                变更原因 (可选)
                              </label>
                              <input
                                type="text"
                                value={statusReason}
                                onChange={(e) => setStatusReason(e.target.value)}
                                placeholder="请输入状态变更原因"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              />
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => handleStatusUpdate(item.id)}
                                disabled={!selectedStatus || updatingStatus === item.id}
                              >
                                确认更新
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setShowStatusSelector(null)
                                  setSelectedStatus('')
                                  setStatusReason('')
                                }}
                              >
                                取消
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">快速操作</CardTitle>
          <CardDescription>管理你的申请流程</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => window.location.href = '/applications/new'}
            >
              <Plus className="h-4 w-4 mr-2" />
              创建新申请
            </Button>
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => window.location.href = '/student/profile'}
            >
              <User className="h-4 w-4 mr-2" />
              完善个人资料
            </Button>
            <Button 
              variant="outline" 
              className="justify-start"
            >
              设置提醒
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}