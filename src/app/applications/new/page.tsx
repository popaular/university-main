"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/layout/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Filter, MapPin, Award, Percent, DollarSign, Building2, BookOpen, FileText, Users, Palette, Mic, ClipboardList, GraduationCap, CheckCircle, XCircle, ChevronDown, ChevronUp, Calendar, Clock, AlertCircle, Mail, Phone, Globe, TrendingUp, ExternalLink } from 'lucide-react'

interface University {
  id: string
  name: string
  country: string
  state?: string
  city?: string
  usNewsRanking?: number
  acceptanceRate?: number
  tuitionInState?: number
  tuitionOutState?: number
  applicationFee?: number
  applicationSystem?: string
  deadlines?: {
    early_action?: string
    early_decision?: string
    regular?: string
  }
  requirements?: {
    gpa?: number
    sat?: {
      min?: number
      max?: number
    }
    act?: {
      min?: number
      max?: number
    }
    toefl?: number
    ielts?: number
    essays?: string[]
    recommendations?: number
    portfolio?: boolean
    interview?: boolean
    extracurriculars?: string[]
  }
}

interface User {
  id: string
  name: string
  email: string
  role: string
}

export default function NewApplicationPage() {
  const [user, setUser] = useState<User | null>(null)
  const [universities, setUniversities] = useState<University[]>([])
  const [filteredUniversities, setFilteredUniversities] = useState<University[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [existingApplications, setExistingApplications] = useState<any[]>([])
  const [formData, setFormData] = useState({
    universityId: "",
    status: "NOT_STARTED",
    notes: "",
    deadline: "",
    applicationType: "REGULAR_DECISION"
  })
  const [searchParams, setSearchParams] = useState({
    search: "",
    country: "",
    state: "",
    minRanking: "",
    maxRanking: "",
    minAcceptanceRate: "",
    maxAcceptanceRate: "",
    minTuition: "",
    maxTuition: ""
  })
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [expandedRequirements, setExpandedRequirements] = useState<string[]>([])
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include"
        })
        
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
          fetchUniversities()
          fetchExistingApplications()
        } else {
          router.push("/")
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        router.push("/")
      }
    }

    checkAuth()
  }, [router])

  const fetchUniversities = async () => {
    try {
      const response = await fetch("/api/universities", {
        credentials: "include"
      })
      
      if (response.ok) {
        const data = await response.json()
        setUniversities(data.universities)
        setFilteredUniversities(data.universities)
      }
    } catch (error) {
      console.error("Failed to fetch universities:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchExistingApplications = async () => {
    try {
      const response = await fetch("/api/student/applications", {
        credentials: "include"
      })
      
      if (response.ok) {
        const data = await response.json()
        setExistingApplications(data.applications)
      }
    } catch (error) {
      console.error("Failed to fetch existing applications:", error)
    }
  }

  const handleSearch = () => {
    setSearchLoading(true)
    
    let filtered = universities.filter(university => {
      const matchesSearch = !searchParams.search || 
        university.name.toLowerCase().includes(searchParams.search.toLowerCase())
      
      const matchesCountry = !searchParams.country || 
        university.country.toLowerCase().includes(searchParams.country.toLowerCase())
      
      const matchesState = !searchParams.state || 
        (university.state && university.state.toLowerCase().includes(searchParams.state.toLowerCase()))
      
      const matchesRanking = (!searchParams.minRanking || (university.usNewsRanking && university.usNewsRanking >= parseInt(searchParams.minRanking))) &&
        (!searchParams.maxRanking || (university.usNewsRanking && university.usNewsRanking <= parseInt(searchParams.maxRanking)))
      
      const matchesAcceptance = (!searchParams.minAcceptanceRate || (university.acceptanceRate && university.acceptanceRate >= parseFloat(searchParams.minAcceptanceRate))) &&
        (!searchParams.maxAcceptanceRate || (university.acceptanceRate && university.acceptanceRate <= parseFloat(searchParams.maxAcceptanceRate)))
      
      const matchesTuition = (!searchParams.minTuition || (university.tuitionOutState && university.tuitionOutState >= parseInt(searchParams.minTuition))) &&
        (!searchParams.maxTuition || (university.tuitionOutState && university.tuitionOutState <= parseInt(searchParams.maxTuition)))
      
      return matchesSearch && matchesCountry && matchesState && matchesRanking && matchesAcceptance && matchesTuition
    })
    
    setFilteredUniversities(filtered)
    setSearchLoading(false)
  }

  useEffect(() => {
    handleSearch()
  }, [searchParams])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const hasExistingEDApplication = existingApplications.some(
    app => app.applicationType === 'EARLY_DECISION'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    if (!formData.universityId) {
      setError("请选择大学")
      setSubmitting(false)
      return
    }

    if (!formData.deadline) {
      setError("请选择截止日期")
      setSubmitting(false)
      return
    }

    // 前端截止日期验证
    const deadlineDate = new Date(formData.deadline)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (isNaN(deadlineDate.getTime())) {
      setError("无效的截止日期格式")
      setSubmitting(false)
      return
    }

    if (deadlineDate < today) {
      setError("截止日期不能早于今天")
      setSubmitting(false)
      return
    }

    const maxFutureDate = new Date()
    maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 2)
    if (deadlineDate > maxFutureDate) {
      setError("截止日期设置过于遥远，请检查是否正确")
      setSubmitting(false)
      return
    }

    if (formData.applicationType === 'EARLY_DECISION' && hasExistingEDApplication) {
      setError("您已经有一个提前决定 (ED) 申请，不能创建多个 ED 申请")
      setSubmitting(false)
      return
    }

    try {
      const response = await fetch("/api/student/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "创建申请失败")
      }

      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建申请失败")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleUniversitySelect = (university: University) => {
    setSelectedUniversity(university)
    setFormData(prev => ({ 
      ...prev, 
      universityId: university.id,
      deadline: university.deadlines?.regular || ''
    }))
  }

  const toggleRequirements = (universityId: string) => {
    setExpandedRequirements(prev => 
      prev.includes(universityId) 
        ? prev.filter(id => id !== universityId)
        : [...prev, universityId]
    )
  }

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSearchParams(prev => ({ ...prev, [name]: value }))
  }

  const getDeadlineOptions = () => {
    if (!selectedUniversity?.deadlines) return []
    
    const options = []
    if (selectedUniversity.deadlines.early_decision) {
      options.push({ value: selectedUniversity.deadlines.early_decision, label: '提前决定 (ED)' })
    }
    if (selectedUniversity.deadlines.early_action) {
      options.push({ value: selectedUniversity.deadlines.early_action, label: '提前行动 (EA)' })
    }
    if (selectedUniversity.deadlines.regular) {
      options.push({ value: selectedUniversity.deadlines.regular, label: '常规申请 (RD)' })
    }
    return options
  }

  const RequirementsDisplay = ({ university }: { university: University }) => {
    if (!university.requirements) {
      return (
        <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
          暂无申请要求信息
        </div>
      )
    }

    const { requirements } = university

    return (
      <div className="space-y-3">
        <h4 className="font-semibold text-sm text-gray-900 flex items-center">
          <ClipboardList className="h-4 w-4 mr-2" />
          申请要求清单
        </h4>
        
        <div className="grid grid-cols-1 gap-2 text-sm">
          {/* 学术要求 */}
          {requirements.gpa && (
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
              <div className="flex items-center">
                <GraduationCap className="h-4 w-4 mr-2 text-blue-600" />
                <span>GPA要求</span>
              </div>
              <span className="font-semibold text-blue-700">{requirements.gpa}</span>
            </div>
          )}

          {/* SAT要求 */}
          {requirements.sat && (
            <div className="flex items-center justify-between p-2 bg-green-50 rounded">
              <div className="flex items-center">
                <BookOpen className="h-4 w-4 mr-2 text-green-600" />
                <span>SAT分数</span>
              </div>
              <span className="font-semibold text-green-700">
                {requirements.sat.min}-{requirements.sat.max}
              </span>
            </div>
          )}

          {/* ACT要求 */}
          {requirements.act && (
            <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
              <div className="flex items-center">
                <BookOpen className="h-4 w-4 mr-2 text-purple-600" />
                <span>ACT分数</span>
              </div>
              <span className="font-semibold text-purple-700">
                {requirements.act.min}-{requirements.act.max}
              </span>
            </div>
          )}

          {/* 语言要求 */}
          {requirements.toefl && (
            <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
              <div className="flex items-center">
                <Mic className="h-4 w-4 mr-2 text-orange-600" />
                <span>TOEFL</span>
              </div>
              <span className="font-semibold text-orange-700">{requirements.toefl}</span>
            </div>
          )}

          {requirements.ielts && (
            <div className="flex items-center justify-between p-2 bg-red-50 rounded">
              <div className="flex items-center">
                <Mic className="h-4 w-4 mr-2 text-red-600" />
                <span>IELTS</span>
              </div>
              <span className="font-semibold text-red-700">{requirements.ielts}</span>
            </div>
          )}

          {/* 推荐信 */}
          {requirements.recommendations && (
            <div className="flex items-center justify-between p-2 bg-indigo-50 rounded">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-indigo-600" />
                <span>推荐信</span>
              </div>
              <span className="font-semibold text-indigo-700">{requirements.recommendations}封</span>
            </div>
          )}

          {/* 文书要求 */}
          {requirements.essays && requirements.essays.length > 0 && (
            <div className="p-2 bg-yellow-50 rounded">
              <div className="flex items-center mb-1">
                <FileText className="h-4 w-4 mr-2 text-yellow-600" />
                <span>文书要求</span>
              </div>
              <ul className="text-xs text-yellow-700 ml-6 space-y-1">
                {requirements.essays.map((essay, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-1">•</span>
                    <span>{essay}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 其他要求 */}
          <div className="space-y-1">
            {requirements.portfolio && (
              <div className="flex items-center p-2 bg-pink-50 rounded">
                <Palette className="h-4 w-4 mr-2 text-pink-600" />
                <span className="text-sm text-pink-700">需要作品集</span>
              </div>
            )}

            {requirements.interview && (
              <div className="flex items-center p-2 bg-teal-50 rounded">
                <Mic className="h-4 w-4 mr-2 text-teal-600" />
                <span className="text-sm text-teal-700">需要面试</span>
              </div>
            )}

            {requirements.extracurriculars && requirements.extracurriculars.length > 0 && (
              <div className="p-2 bg-gray-50 rounded">
                <div className="flex items-center mb-1">
                  <CheckCircle className="h-4 w-4 mr-2 text-gray-600" />
                  <span>课外活动</span>
                </div>
                <ul className="text-xs text-gray-700 ml-6 space-y-1">
                  {requirements.extracurriculars.map((activity, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-1">•</span>
                      <span>{activity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            创建新申请
          </h1>
          <p className="mt-2 text-gray-600">
            搜索并选择您感兴趣的大学，创建申请记录
          </p>
          
          {hasExistingEDApplication && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    申请类型限制提醒
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>您已经有一个<strong>提前决定 (ED)</strong>申请。根据美国大学申请规则，每个学生只能申请一个ED项目。</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 大学搜索和选择 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>搜索大学</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    {showFilters ? '隐藏筛选' : '显示筛选'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* 搜索栏 */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      name="search"
                      placeholder="搜索大学名称..."
                      value={searchParams.search}
                      onChange={handleSearchInputChange}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* 筛选条件 */}
                {showFilters && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium mb-1">国家</label>
                      <Input
                        name="country"
                        placeholder="如：美国"
                        value={searchParams.country}
                        onChange={handleSearchInputChange}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">州/省</label>
                      <Input
                        name="state"
                        placeholder="如：加利福尼亚"
                        value={searchParams.state}
                        onChange={handleSearchInputChange}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">排名范围</label>
                      <div className="flex gap-2">
                        <Input
                          name="minRanking"
                          type="number"
                          placeholder="最低"
                          value={searchParams.minRanking}
                          onChange={handleSearchInputChange}
                        />
                        <Input
                          name="maxRanking"
                          type="number"
                          placeholder="最高"
                          value={searchParams.maxRanking}
                          onChange={handleSearchInputChange}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">录取率(%)</label>
                      <div className="flex gap-2">
                        <Input
                          name="minAcceptanceRate"
                          type="number"
                          placeholder="最低"
                          min="0"
                          max="100"
                          value={searchParams.minAcceptanceRate}
                          onChange={handleSearchInputChange}
                        />
                        <Input
                          name="maxAcceptanceRate"
                          type="number"
                          placeholder="最高"
                          min="0"
                          max="100"
                          value={searchParams.maxAcceptanceRate}
                          onChange={handleSearchInputChange}
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">学费范围($)</label>
                      <div className="flex gap-2">
                        <Input
                          name="minTuition"
                          type="number"
                          placeholder="最低"
                          value={searchParams.minTuition}
                          onChange={handleSearchInputChange}
                        />
                        <Input
                          name="maxTuition"
                          type="number"
                          placeholder="最高"
                          value={searchParams.maxTuition}
                          onChange={handleSearchInputChange}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 大学列表 */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {searchLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="text-gray-500 mt-2">搜索中...</p>
                    </div>
                  ) : filteredUniversities.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">没有找到符合条件的大学</p>
                    </div>
                  ) : (
                    filteredUniversities.map((university) => (
                      <Card
                        key={university.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedUniversity?.id === university.id ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => handleUniversitySelect(university)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-lg">{university.name}</h3>
                              <p className="text-sm text-gray-600">
                                <MapPin className="inline h-3 w-3 mr-1" />
                                {university.city}, {university.state}, {university.country}
                              </p>
                            </div>
                            {selectedUniversity?.id === university.id && (
                              <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                已选择
                              </div>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                            <div className="flex items-center">
                              <Award className="h-4 w-4 mr-1 text-gray-400" />
                              <span>排名: #{university.usNewsRanking || 'N/A'}</span>
                            </div>
                            <div className="flex items-center">
                              <Percent className="h-4 w-4 mr-1 text-gray-400" />
                              <span>录取率: {university.acceptanceRate || 'N/A'}%</span>
                            </div>
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                              <span>学费: ${university.tuitionOutState?.toLocaleString() || 'N/A'}</span>
                            </div>
                            <div className="flex items-center">
                            <Building2 className="h-4 w-4 mr-1 text-gray-400" />
                            <span>申请费: ${university.applicationFee || 'N/A'}</span>
                          </div>
                        </div>

                        {/* 申请要求展示 */}
                        {university.requirements && (
                          <div className="border-t pt-3">
                            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                              {university.requirements.gpa && (
                                <div className="flex items-center">
                                  <GraduationCap className="h-3 w-3 mr-1 text-blue-600" />
                                  <span>GPA: {university.requirements.gpa}</span>
                                </div>
                              )}
                              {university.requirements.sat?.min && (
                                <div className="flex items-center">
                                  <BookOpen className="h-3 w-3 mr-1 text-green-600" />
                                  <span>SAT: {university.requirements.sat.min}-{university.requirements.sat.max}</span>
                                </div>
                              )}
                              {university.requirements.toefl && (
                                <div className="flex items-center">
                                  <Mic className="h-3 w-3 mr-1 text-purple-600" />
                                  <span>TOEFL: {university.requirements.toefl}</span>
                                </div>
                              )}
                              {university.requirements.recommendations && (
                                <div className="flex items-center">
                                  <Users className="h-3 w-3 mr-1 text-orange-600" />
                                  <span>推荐信: {university.requirements.recommendations}</span>
                                </div>
                              )}
                            </div>
                            
                            {university.requirements.essays && university.requirements.essays.length > 0 && (
                              <div className="mb-2">
                                <div className="text-xs text-gray-600 mb-1">文书要求:</div>
                                <div className="text-xs text-gray-500 line-clamp-2">
                                  {university.requirements.essays.slice(0, 2).join('、')}
                                  {university.requirements.essays.length > 2 && ` 等${university.requirements.essays.length}篇`}
                                </div>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleRequirements(university.id)
                              }}
                              className="flex items-center justify-between w-full text-sm font-medium text-blue-600 hover:text-blue-800"
                            >
                              <span className="flex items-center">
                                <ClipboardList className="h-4 w-4 mr-1" />
                                查看完整申请要求
                              </span>
                              <span className="text-xs">
                                {expandedRequirements.includes(university.id) ? '收起' : '展开'}
                              </span>
                            </button>
                              
                              {expandedRequirements.includes(university.id) && (
                                <div className="mt-3">
                                  <RequirementsDisplay university={university} />
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 申请表单 */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>申请详情</CardTitle>
                <CardDescription>
                  {selectedUniversity ? `为 ${selectedUniversity.name} 创建申请` : '请先选择一所大学'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedUniversity && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-sm text-blue-900 mb-2 flex items-center">
                      <ClipboardList className="h-4 w-4 mr-2" />
                      {selectedUniversity.name} 申请要求
                    </h4>
                    <RequirementsDisplay university={selectedUniversity} />
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* 隐藏的大学ID字段 */}
                  <input type="hidden" name="universityId" value={formData.universityId} />

                  <div>
                    <label htmlFor="applicationType" className="block text-sm font-medium mb-2">
                      申请类型
                    </label>
                    <select
                      id="applicationType"
                      name="applicationType"
                      value={formData.applicationType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!selectedUniversity}
                    >
                      <option value="REGULAR_DECISION">常规申请 (RD)</option>
                      <option value="EARLY_ACTION">提前行动 (EA)</option>
                      <option value="EARLY_DECISION" 
                        disabled={hasExistingEDApplication}
                      >
                        提前决定 (ED) {hasExistingEDApplication && "(已存在)"}
                      </option>
                    </select>
                    {hasExistingEDApplication && formData.applicationType === 'EARLY_DECISION' && (
                      <p className="mt-2 text-sm text-red-600">
                        ⚠️ 您已经有一个提前决定 (ED) 申请，每个学生只能申请一个 ED。
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="deadline" className="block text-sm font-medium mb-2">
                      截止日期
                    </label>
                    <select
                      id="deadline"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!selectedUniversity}
                    >
                      <option value="">选择截止日期</option>
                      {getDeadlineOptions().map(option => {
                        const optionDate = new Date(option.value)
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        const isExpired = optionDate < today
                        return (
                          <option key={option.value} value={option.value} disabled={isExpired}>
                            {option.label} - {optionDate.toLocaleDateString('zh-CN')}
                            {isExpired && " (已过期)"}
                          </option>
                        )
                      })}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="status" className="block text-sm font-medium mb-2">
                      当前状态
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!selectedUniversity}
                    >
                      <option value="NOT_STARTED">未开始</option>
                      <option value="IN_PROGRESS">进行中</option>
                      <option value="SUBMITTED">已提交</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium mb-2">
                      备注
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="添加关于此申请的备注..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!selectedUniversity}
                    />
                  </div>

                  {error && (
                    <div className="text-red-500 text-sm">{error}</div>
                  )}

                  <div className="flex space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/dashboard")}
                      className="flex-1"
                    >
                      取消
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting || !selectedUniversity}
                      className="flex-1"
                    >
                      {submitting ? "创建中..." : "创建申请"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}