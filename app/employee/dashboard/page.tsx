"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/hooks/use-session"
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, FileText, Plus, Trash2, ChevronLeft, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// Importamos el componente de navegación
import { Navigation } from "@/components/navigation"

// --- Interface ---

interface AbsenceRequest {
  id: number
  request_type: string
  start_date: string
  end_date: string
  total_days: number
  reason: string
  status: string
  current_approval_stage: string
  created_at: string
  shift_details: string | null
}

// --- Component ---

export default function EmployeeDashboard() {
  const { session, loading } = useSession()
  const router = useRouter()
  const [requests, setRequests] = useState<AbsenceRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(true)
  // 1. State for Info Check Modal
  const [selectedRequest, setSelectedRequest] = useState<AbsenceRequest | null>(null)


  useEffect(() => {
    if (!loading && session) {
      fetchRequests()
    }
  }, [loading, session])

  const fetchRequests = async () => {
    try {
      const response = await fetch("/api/requests/my-requests")
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



const handleDeleteRequest = async (e: React.MouseEvent, requestId: number) => {
    // Detiene el evento click para que no se propague al div de la solicitud y abra el modal
    e.stopPropagation() 

    if (!window.confirm("¿Está seguro de que desea ocultar esta solicitud del dashboard? No se eliminará permanentemente del sistema, solo se archivará.")) {
        return
    }

    try {
        // CAMBIO CLAVE: Usamos el método PATCH en lugar de DELETE para el "soft delete" (archivado)
        const response = await fetch(`/api/requests/${requestId}`, {
            method: "PATCH", // <--- Usamos PATCH
            // Opcional: Si el PATCH necesitara un cuerpo, iría aquí, pero el servidor
            // lo maneja leyendo solo el ID de la URL para establecer el estado a 'ARCHIVED'.
        })

        if (response.ok) {
            // Éxito: Simplemente actualizamos el estado local para que desaparezca.
            // Esto se alinea con la lógica del frontend: desaparecer de la vista.
            setRequests(prev => prev.filter(r => r.id !== requestId))
            
            // Si la solicitud estaba abierta en el modal, lo cerramos
            if (selectedRequest && selectedRequest.id === requestId) {
                setSelectedRequest(null)
            }
            // Opcional: Mostrar un mensaje de éxito
            alert("Solicitud archivada y oculta del dashboard con éxito.") 
        } else {
            // Manejo de errores (similar al original, pero con mensaje actualizado):
            let errorMessage = `Error ${response.status}: Error al archivar solicitud.`
            
            try {
                const errorData = await response.json()
                errorMessage = errorData.error || errorData.message || errorMessage
            } catch (jsonError) {
                console.error("Server returned non-JSON error response.", jsonError);
                if (response.status === 404) {
                    errorMessage = "Error: La ruta de la API de archivado no fue encontrada. Verifique la ruta del servidor."
                }
            }
            
            alert(`Error al archivar solicitud: ${errorMessage}`)
        }
    } catch (error) {
        console.error("Error archiving request:", error)
        alert("Ocurrió un error de red inesperado al intentar archivar la solicitud.")
    }
}



  if (loading || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle className="h-4 w-4" />
      case "PENDING":
        return <Clock className="h-4 w-4" />
      case "DECLINED":
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const formatRequestType = (type: string) => {
    const types: Record<string, string> = {
      permisoConGoce: "Permiso con Goce (Paid)",
      permisoSinGoce: "Permiso sin Goce (Unpaid)",
      vacaciones: "Vacaciones (Vacation)",
      paseEntrada: "Pase de Entrada (Late)",
      paseSalida: "Pase de Salida (Early Exit)",
      cambioTurno: "Cambio de Turno (Shift Change)",
      tiempoPorTiempo: "Tiempo por Tiempo",

      VACATION: "Vacation",
      SICK_LEAVE: "Sick Leave",
      PERSONAL: "Personal Leave",
      UNPAID: "Unpaid Leave",
      OTHER: "Other",
    }
    return types[type] || type
  }

  // Helper function to render request details in modal
  const renderRequestDetails = (request: AbsenceRequest) => {
    const details = [
      { label: "Tipo de Solicitud", value: formatRequestType(request.request_type) },
      { label: "Razón Principal", value: request.reason },
      { label: "Días Solicitados", value: `${request.total_days} días` },
      { label: "Inicio", value: new Date(request.start_date).toLocaleDateString() },
      { label: "Fin", value: new Date(request.end_date).toLocaleDateString() },
      { label: "Etapa de Aprobación", value: request.current_approval_stage },
    ]

    if (request.shift_details) {
      details.push({ label: "Detalles de Turno/Pase", value: request.shift_details })
    }

    return (
      <div className="space-y-3">
        {details.map((detail, index) => (
          <div key={index} className="flex justify-between items-start text-sm border-b border-gray-100 pb-2 last:border-b-0">
            <span className="font-medium text-gray-600">{detail.label}</span>
            <span className="font-semibold text-gray-800 text-right">{detail.value}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/10 to-cyan-400/10 rounded-full blur-3xl"></div>
      </div>

      {/* 1. BARRA DE NAVEGACIÓN INTEGRADA */}
      <Navigation user={session} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Employee Dashboard</h1>
            <p className="mt-2 text-lg text-gray-600">Welcome back, {session.name}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-gray-200 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {requests.filter((r) => r.status === "PENDING").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {requests.filter((r) => r.status === "APPROVED").length}
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
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>My Absence Requests</CardTitle>
                    <CardDescription>View and track your absence requests</CardDescription>
                  </div>
                  <Button
                    onClick={() => router.push("/employee/request/new")}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Request
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingRequests ? (
                  <div className="text-center py-8 text-gray-500">Loading requests...</div>
                ) : requests.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No absence requests yet</p>
                    <Button
                      onClick={() => router.push("/employee/request/new")}
                      variant="outline"
                      className="border-gray-300"
                    >
                      Create your first request
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.map((request) => (
                      <div
                        key={request.id}
                        className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow cursor-pointer"
                        // 3. Change click handler to open modal
                        onClick={() => setSelectedRequest(request)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{formatRequestType(request.request_type)}</h4>
                            <p className="text-sm text-gray-600 mt-1">{request.reason}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}
                            >
                              {getStatusIcon(request.status)}
                              {request.status}
                            </span>
                            
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-3">
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
                        {request.status === "PENDING" && (
                          <div className="mt-3 text-xs text-gray-500">
                            Current stage: <span className="font-medium">{request.current_approval_stage}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Info */}
          <div className="space-y-6">
           

            <Card className="border-gray-200 shadow-xl">
              <CardHeader>
                <CardTitle>Approval Process</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-600">1</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Supervisor</p>
                      <p className="text-xs text-gray-600">First approval</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-600">2</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Manager</p>
                      <p className="text-xs text-gray-600">Second approval</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-600">3</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">HR</p>
                      <p className="text-xs text-gray-600">Final approval</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Payroll</p>
                      <p className="text-xs text-gray-600">Notification sent</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 5. Info Check Modal Implementation (Conditional Rendering) */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all animate-fadeIn">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Info className="h-6 w-6 text-blue-600" />
                Request Details
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setSelectedRequest(null)}>
                <XCircle className="h-5 w-5 text-gray-500" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              {/* Status */}
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-lg font-semibold text-gray-700">Status:</span>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold border ${getStatusColor(selectedRequest.status)}`}>
                  {getStatusIcon(selectedRequest.status)}
                  {selectedRequest.status}
                </span>
              </div>

              {/* Details */}
              {renderRequestDetails(selectedRequest)}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                
                
              </div>
            </div>
          </div>
        </div>
      )}
      {/* End of Modal */}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}
