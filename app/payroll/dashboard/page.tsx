"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/hooks/use-session"
import { LogoutButton } from "@/components/logout-button"
import { Calendar, CheckCircle, User, DollarSign, FileText, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ApprovedRequest {
  id: number
  employee_id: number
  employee_name: string
  employee_department: string
  request_type: string
  start_date: string
  end_date: string
  total_days: number
  reason: string
  created_at: string
  approved_at: string
}

export default function PayrollDashboard() {
  const { session, loading } = useSession()
  const router = useRouter()
  const [requests, setRequests] = useState<ApprovedRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    if (!loading && session) {
      fetchApprovedRequests()
    }
  }, [loading, session, selectedMonth, selectedYear])

  const fetchApprovedRequests = async () => {
    try {
      const response = await fetch(`/api/requests/approved?month=${selectedMonth}&year=${selectedYear}`)
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests)
      }
    } catch (error) {
      console.error("[v0] Error fetching requests:", error)
    } finally {
      setLoadingRequests(false)
    }
  }

  const exportToCSV = () => {
    const headers = ["Employee Name", "Department", "Request Type", "Start Date", "End Date", "Total Days", "Reason"]
    const rows = requests.map((r) => [
      r.employee_name,
      r.employee_department || "N/A",
      formatRequestType(r.request_type),
      new Date(r.start_date).toLocaleDateString(),
      new Date(r.end_date).toLocaleDateString(),
      r.total_days.toString(),
      r.reason,
    ])

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `absence-requests-${selectedYear}-${selectedMonth + 1}.csv`
    a.click()
  }

  if (loading || loadingRequests) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
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

  const getRequestTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      VACATION: "bg-purple-100 text-purple-800 border-purple-200",
      SICK_LEAVE: "bg-red-100 text-red-800 border-red-200",
      PERSONAL: "bg-blue-100 text-blue-800 border-blue-200",
      UNPAID: "bg-yellow-100 text-yellow-800 border-yellow-200",
      OTHER: "bg-gray-100 text-gray-800 border-gray-200",
    }
    return colors[type] || colors.OTHER
  }

  const totalDays = requests.reduce((sum, r) => sum + r.total_days, 0)
  const uniqueEmployees = new Set(requests.map((r) => r.employee_id)).size

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/10 to-cyan-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Payroll Dashboard</h1>
            <p className="mt-2 text-lg text-gray-600">View approved absence requests for payroll processing</p>
          </div>
          <LogoutButton />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-gray-200 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-gray-600">Approved Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-gray-600">Employees</p>
                  <p className="text-2xl font-bold text-gray-900">{uniqueEmployees}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-gray-600">Total Days</p>
                  <p className="text-2xl font-bold text-gray-900">{totalDays}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-gray-600">Unpaid Days</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {requests.filter((r) => r.request_type === "UNPAID").reduce((sum, r) => sum + r.total_days, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Export */}
        <Card className="border-gray-200 shadow-xl mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Approved Absence Requests</CardTitle>
                <CardDescription>All fully approved requests for payroll processing</CardDescription>
              </div>
              <Button
                onClick={exportToCSV}
                variant="outline"
                className="border-gray-300 bg-white hover:bg-gray-50"
                disabled={requests.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i}>
                      {new Date(2025, i, 1).toLocaleString("default", { month: "long" })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - 2 + i
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>

            {requests.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No approved requests</p>
                <p className="text-sm text-gray-500 mt-2">
                  No approved absence requests for{" "}
                  {new Date(selectedYear, selectedMonth).toLocaleString("default", { month: "long", year: "numeric" })}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Employee</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Department</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Start Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">End Date</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Days</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((request) => (
                      <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-600" />
                            <span className="font-medium text-gray-900">{request.employee_name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">{request.employee_department || "N/A"}</td>
                        <td className="py-4 px-4">
                          <Badge className={`${getRequestTypeColor(request.request_type)} border`}>
                            {formatRequestType(request.request_type)}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {new Date(request.start_date).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {new Date(request.end_date).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                            {request.total_days}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600 max-w-xs truncate">{request.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary by Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {["VACATION", "SICK_LEAVE", "PERSONAL", "UNPAID", "OTHER"].map((type) => {
            const typeRequests = requests.filter((r) => r.request_type === type)
            const typeDays = typeRequests.reduce((sum, r) => sum + r.total_days, 0)

            return (
              <Card key={type} className="border-gray-200 shadow-xl">
                <CardContent className="p-6">
                  <div className="text-center">
                    <Badge className={`${getRequestTypeColor(type)} border mb-3`}>{formatRequestType(type)}</Badge>
                    <p className="text-3xl font-bold text-gray-900">{typeDays}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {typeDays === 1 ? "day" : "days"} ({typeRequests.length}{" "}
                      {typeRequests.length === 1 ? "request" : "requests"})
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
