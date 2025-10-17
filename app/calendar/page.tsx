"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/hooks/use-session"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { format, parseISO, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from "date-fns"
import { CalendarIcon, ChevronLeft, ChevronRight, Clock, Download } from "lucide-react"
import { LogoutButton } from "@/components/logout-button"
import Image from "next/image"

interface CalendarRequest {
  id: number
  employee_id: number
  employee_name: string
  employee_email: string
  request_type: string
  start_date: string
  end_date: string
  total_days: number
  reason: string
  status: string
  current_approval_stage: string
  hours_per_day?: number
  paid_days?: number
  unpaid_days?: number
  unpaid_comments?: string
  shift_details?: string
  created_at: string
}

type ViewMode = "month" | "week" | "custom"

export default function CalendarView() {
  const { session, loading } = useSession()
  const router = useRouter()
  const [requests, setRequests] = useState<CalendarRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>("month")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>()
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>()
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterEmployee, setFilterEmployee] = useState<string>("all")
  const [selectedRequest, setSelectedRequest] = useState<CalendarRequest | null>(null)
  const [employees, setEmployees] = useState<Array<{ id: number; name: string }>>([])

  useEffect(() => {
    if (!loading && session) {
      fetchRequests()
      if (session.role !== "EMPLOYEE") {
        fetchEmployees()
      }
    }
  }, [loading, session, viewMode, selectedDate, customStartDate, customEndDate, filterStatus, filterEmployee])

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/users/employees")
      if (response.ok) {
        const data = await response.json()
        setEmployees(data.employees)
      }
    } catch (error) {
      console.error("[v0] Error fetching employees:", error)
    }
  }

  const fetchRequests = async () => {
    setLoadingRequests(true)
    try {
      let startDate: string | undefined
      let endDate: string | undefined

      if (viewMode === "month") {
        const monthStart = startOfMonth(selectedDate)
        const monthEnd = endOfMonth(selectedDate)
        startDate = format(monthStart, "yyyy-MM-dd")
        endDate = format(monthEnd, "yyyy-MM-dd")
      } else if (viewMode === "week") {
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })
        startDate = format(weekStart, "yyyy-MM-dd")
        endDate = format(weekEnd, "yyyy-MM-dd")
      } else if (viewMode === "custom" && customStartDate && customEndDate) {
        startDate = format(customStartDate, "yyyy-MM-dd")
        endDate = format(customEndDate, "yyyy-MM-dd")
      }

      const params = new URLSearchParams()
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)
      if (filterStatus !== "all") params.append("status", filterStatus)
      if (filterEmployee !== "all") params.append("employeeId", filterEmployee)

      const response = await fetch(`/api/requests/calendar?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests)
      }
    } catch (error) {
      console.error("[v0] Error fetching calendar requests:", error)
    } finally {
      setLoadingRequests(false)
    }
  }

  const getRequestsForDate = (date: Date) => {
    return requests.filter((request) => {
      const start = parseISO(request.start_date)
      const end = parseISO(request.end_date)
      return isWithinInterval(date, { start, end })
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-500"
      case "PENDING":
        return "bg-yellow-500"
      case "DECLINED":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200"
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "DECLINED":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatRequestType = (type: string) => {
    const types: Record<string, string> = {
      VACATION: "Vacation",
      SICK_LEAVE: "Sick Leave",
      PERSONAL: "Personal Leave",
      UNPAID: "Unpaid Leave",
      OTHER: "Other",
    }
    return types[type] || type
  }

  const navigateDate = (direction: "prev" | "next") => {
    if (viewMode === "month") {
      setSelectedDate((prev) => {
        const newDate = new Date(prev)
        newDate.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1))
        return newDate
      })
    } else if (viewMode === "week") {
      setSelectedDate((prev) => addDays(prev, direction === "next" ? 7 : -7))
    }
  }

  const exportToCSV = () => {
    const headers = [
      "Employee",
      "Type",
      "Start Date",
      "End Date",
      "Total Days",
      "Hours/Day",
      "Paid Days",
      "Unpaid Days",
      "Status",
      "Reason",
    ]
    const rows = requests.map((req) => [
      req.employee_name,
      formatRequestType(req.request_type),
      req.start_date,
      req.end_date,
      req.total_days,
      req.hours_per_day || 8,
      req.paid_days || 0,
      req.unpaid_days || 0,
      req.status,
      req.reason,
    ])

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `absence-calendar-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
  }

  if (loading || loadingRequests) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Image src="/logo.png" alt="IRIS Talent" width={120} height={40} className="object-contain" />
            <div>
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Absence Calendar</h1>
              <p className="mt-2 text-lg text-gray-600">View and manage absence requests</p>
            </div>
          </div>
          <LogoutButton />
        </div>

        {/* Filters */}
        <Card className="mb-6 shadow-xl">
          <CardHeader>
            <CardTitle>Filters & View Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>View Mode</Label>
                <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Monthly View</SelectItem>
                    <SelectItem value="week">7-Day Period</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="DECLINED">Declined</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {session?.role !== "EMPLOYEE" && (
                <div>
                  <Label>Employee</Label>
                  <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Employees</SelectItem>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-end">
                <Button onClick={exportToCSV} variant="outline" className="w-full bg-transparent">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>

            {viewMode === "custom" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customStartDate ? format(customStartDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={customStartDate} onSelect={setCustomStartDate} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customEndDate ? format(customEndDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={customEndDate} onSelect={setCustomEndDate} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar View */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>
                    {viewMode === "month" && format(selectedDate, "MMMM yyyy")}
                    {viewMode === "week" &&
                      `${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), "MMM d")} - ${format(
                        endOfWeek(selectedDate, { weekStartsOn: 1 }),
                        "MMM d, yyyy",
                      )}`}
                    {viewMode === "custom" &&
                      customStartDate &&
                      customEndDate &&
                      `${format(customStartDate, "MMM d")} - ${format(customEndDate, "MMM d, yyyy")}`}
                  </CardTitle>
                  {viewMode !== "custom" && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => navigateDate("prev")}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => navigateDate("next")}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  month={selectedDate}
                  onMonthChange={setSelectedDate}
                  className="rounded-md border"
                  components={{
                    DayContent: ({ date }) => {
                      const dayRequests = getRequestsForDate(date)
                      return (
                        <div className="relative w-full h-full flex flex-col items-center justify-center">
                          <span className="text-sm">{format(date, "d")}</span>
                          {dayRequests.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {dayRequests.slice(0, 3).map((req, idx) => (
                                <div
                                  key={idx}
                                  className={`h-1.5 w-1.5 rounded-full ${getStatusColor(req.status)}`}
                                  title={`${req.employee_name} - ${formatRequestType(req.request_type)}`}
                                />
                              ))}
                              {dayRequests.length > 3 && (
                                <span className="text-[8px] text-gray-600">+{dayRequests.length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    },
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Request Details */}
          <div>
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle>Requests for {format(selectedDate, "MMM d, yyyy")}</CardTitle>
                <CardDescription>{getRequestsForDate(selectedDate).length} request(s)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {getRequestsForDate(selectedDate).length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No requests for this date</p>
                  ) : (
                    getRequestsForDate(selectedDate).map((request) => (
                      <div
                        key={request.id}
                        className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedRequest(request)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-gray-900">{request.employee_name}</p>
                            <p className="text-sm text-gray-600">{formatRequestType(request.request_type)}</p>
                          </div>
                          <Badge className={getStatusBadgeColor(request.status)}>{request.status}</Badge>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {format(parseISO(request.start_date), "MMM d")} -{" "}
                            {format(parseISO(request.end_date), "MMM d")}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {request.total_days} days ({request.hours_per_day || 8}h/day)
                          </div>
                          {request.paid_days !== undefined && request.unpaid_days !== undefined && (
                            <div className="text-xs">
                              Paid: {request.paid_days} | Unpaid: {request.unpaid_days}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Request Detail Modal */}
            {selectedRequest && (
              <Card className="mt-6 shadow-xl">
                <CardHeader>
                  <CardTitle>Request Details</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedRequest(null)}
                    className="absolute top-4 right-4"
                  >
                    ×
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs text-gray-600">Employee</Label>
                    <p className="font-medium">{selectedRequest.employee_name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Type</Label>
                    <p className="font-medium">{formatRequestType(selectedRequest.request_type)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Period</Label>
                    <p className="font-medium">
                      {format(parseISO(selectedRequest.start_date), "MMM d, yyyy")} -{" "}
                      {format(parseISO(selectedRequest.end_date), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Duration</Label>
                    <p className="font-medium">
                      {selectedRequest.total_days} days × {selectedRequest.hours_per_day || 8} hours/day
                    </p>
                  </div>
                  {selectedRequest.paid_days !== undefined && (
                    <div>
                      <Label className="text-xs text-gray-600">Paid Days</Label>
                      <p className="font-medium">{selectedRequest.paid_days}</p>
                    </div>
                  )}
                  {selectedRequest.unpaid_days !== undefined && selectedRequest.unpaid_days > 0 && (
                    <div>
                      <Label className="text-xs text-gray-600">Unpaid Days</Label>
                      <p className="font-medium">{selectedRequest.unpaid_days}</p>
                      {selectedRequest.unpaid_comments && (
                        <p className="text-sm text-gray-600 mt-1">{selectedRequest.unpaid_comments}</p>
                      )}
                    </div>
                  )}
                  {selectedRequest.shift_details && (
                    <div>
                      <Label className="text-xs text-gray-600">Shift Change</Label>
                      <p className="font-medium">{selectedRequest.shift_details}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-xs text-gray-600">Reason</Label>
                    <p className="text-sm">{selectedRequest.reason}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Status</Label>
                    <Badge className={getStatusBadgeColor(selectedRequest.status)}>{selectedRequest.status}</Badge>
                  </div>
                  {selectedRequest.status === "PENDING" && (
                    <div>
                      <Label className="text-xs text-gray-600">Current Stage</Label>
                      <p className="font-medium">{selectedRequest.current_approval_stage}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
