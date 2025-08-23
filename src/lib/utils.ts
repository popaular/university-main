import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDeadline(date: string | Date) {
  const deadline = new Date(date)
  const today = new Date()
  const diffTime = deadline.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return { text: 'Overdue', color: 'text-red-600 bg-red-50' }
  } else if (diffDays <= 7) {
    return { text: `${diffDays} days left`, color: 'text-orange-600 bg-orange-50' }
  } else if (diffDays <= 30) {
    return { text: `${diffDays} days left`, color: 'text-yellow-600 bg-yellow-50' }
  } else {
    return { text: `${diffDays} days left`, color: 'text-green-600 bg-green-50' }
  }
}

export function getStatusColor(status: string) {
  const colors = {
    NOT_STARTED: 'bg-gray-100 text-gray-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    SUBMITTED: 'bg-purple-100 text-purple-800',
    UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    WAITLISTED: 'bg-orange-100 text-orange-800',
    DEFERRED: 'bg-gray-100 text-gray-800',
  }
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

export function calculateProgress(applications: any[]) {
  if (!applications.length) return 0
  const completed = applications.filter(app => 
    app.status === 'SUBMITTED' || app.status === 'DECISION_RECEIVED'
  ).length
  return Math.round((completed / applications.length) * 100)
}