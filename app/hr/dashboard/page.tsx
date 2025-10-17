"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/hooks/use-session"
// import { LogoutButton } from "@/components/logout-button" // Ya no es necesario
import { Calendar, Clock, CheckCircle, XCircle, User, AlertCircle, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

// Importamos el componente de navegación
import { Navigation } from "@/components/navigation" // Asegúrate de que esta ruta sea correcta

interface AbsenceRequest {
  id: number
  employee_id: number
  employee_name: string
  request_type: string
  start_date: string
  end_date: string
  total_days: number
  reason: string
  status: string
  current_approval_stage: string
  created_at: string
  approval_history?: string
}

export default function HRDashboard() {
  const { session, loading } = useSession()
  const router = useRouter()
  const [requests, setRequests] = useState<AbsenceRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<AbsenceRequest | null>(null)
  const [comments, setComments] = useState("")
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (!loading && session) {
      fetchPendingRequests()
    }
  }, [loading, session])

  const fetchPendingRequests = async () => {
    try {
      const response = await fetch("/api/requests/pending/hr")
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

  const handleApproval = async (requestId: number, action: "APPROVED" | "DECLINED") => {
    setProcessing(true)
    try {
      const response = await fetch("/api/requests/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: requestId,
          action,
          comments,
          stage: "HR",
        }),
      })

      if (response.ok) {
        setSelectedRequest(null)
        setComments("")
        fetchPendingRequests()
      }
    } catch (error) {
      console.error("[v0] Error processing request:", error)
    } finally {
      setProcessing(false)
    }
  }

  // Manejamos el estado de carga y la falta de sesión
  if (loading || !session) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* 1. BARRA DE NAVEGACIÓN INTEGRADA */}
      {/* Pasamos el objeto session al componente Navigation */}
      <Navigation user={session} />

      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/10 to-cyan-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header: Limpiado de elementos redundantes */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">HR Dashboard</h1>
            <p className="mt-2 text-lg text-gray-600">Welcome, {session.name}. Final approval for absence requests</p>
          </div>
          {/* <LogoutButton /> <- Eliminado */}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-gray-200 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-gray-600">Final Review</p>
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
                  <p className="text-2xl font-bold text-gray-900">{new Set(requests.map((r) => r.employee_id)).size}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-gray-600">Total Days</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {requests.reduce((sum, r) => sum + r.total_days, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Request List */}
          <div className="lg:col-span-2">
            <Card className="border-gray-200 shadow-xl">
              <CardHeader>
                <CardTitle>Manager-Approved Requests</CardTitle>
                <CardDescription>Final HR approval for absence requests</CardDescription>
              </CardHeader>
              <CardContent>
                {requests.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">All caught up!</p>
                    <p className="text-sm text-gray-500 mt-2">No pending requests to review</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.map((request) => (
                      <div
                        key={request.id}
                        className={`p-4 border rounded-xl hover:shadow-md transition-all cursor-pointer ${selectedRequest?.id === request.id
                            ? "border-teal-500 bg-teal-50"
                            : "border-gray-200 hover:border-teal-300"
                          }`}
                        onClick={() => setSelectedRequest(request)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <User className="h-4 w-4 text-gray-600" />
                              <h4 className="font-semibold text-gray-900">{request.employee_name}</h4>
                            </div>
                            <p className="text-sm font-medium text-teal-600">
                              {formatRequestType(request.request_type)}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <CheckCircle className="h-3 w-3 text-green-600" />
                              <span className="text-xs text-gray-600">Supervisor & Manager Approved</span>
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800 border border-teal-200">
                            <Heart className="h-3 w-3" />
                            HR Review
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{request.reason}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(request.start_date).toLocaleDateString()} -{" "}
                            {new Date(request.end_date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {request.total_days} {request.total_days === 1 ? "day" : "days"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Approval Panel */}
          <div>
            <Card className="border-gray-200 shadow-xl sticky top-20"> {/* Ajustamos 'top-8' a 'top-20' para compensar la Navigation bar */}
              <CardHeader>
                <CardTitle>HR Final Approval</CardTitle>
                <CardDescription>
                  {selectedRequest ? "Final approval decision" : "Select a request to review"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedRequest ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
                      <p className="text-sm font-semibold text-teal-900 mb-2">Request Details</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-teal-700">Employee:</span>
                          <span className="font-medium text-teal-900">{selectedRequest.employee_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-teal-700">Type:</span>
                          <span className="font-medium text-teal-900">
                            {formatRequestType(selectedRequest.request_type)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-teal-700">Duration:</span>
                          <span className="font-medium text-teal-900">{selectedRequest.total_days} days</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-green-800">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">Approved by Supervisor & Manager</span>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="comments" className="text-gray-700 font-semibold">
                        Comments (Optional)
                      </Label>
                      <Textarea
                        id="comments"
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Add any comments or notes..."
                        rows={3}
                        className="mt-2 border-gray-300"
                      />
                    </div>

                    <div className="space-y-3 pt-2">
                      <Button
                        onClick={() => handleApproval(selectedRequest.id, "APPROVED")}
                        disabled={processing}
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {processing ? "Processing..." : "Final Approval"}
                      </Button>
                      <Button
                        onClick={() => handleApproval(selectedRequest.id, "DECLINED")}
                        disabled={processing}
                        variant="outline"
                        className="w-full border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Decline Request
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-600">Select a request from the list for final approval</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}