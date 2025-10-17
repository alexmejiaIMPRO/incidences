"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/hooks/use-session"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, ChevronLeft, AlertCircle, Clock, CheckCircle, XCircle } from "lucide-react"
// Assuming you have a Navigation component that handles Logout
// import { Navigation } from "@/components/navigation" 

// --- Constants based on index.html ---

const REQUEST_TYPE_OPTIONS = [
  { value: "permisoConGoce", label: "Permiso con goce (Paid Leave)", color: "from-green-50 to-green-100 border-green-200", icon: CheckCircle },
  { value: "permisoSinGoce", label: "Permiso sin goce (Unpaid Leave)", color: "from-yellow-50 to-yellow-100 border-yellow-200", icon: XCircle },
  { value: "vacaciones", label: "Vacaciones (Vacation)", color: "from-purple-50 to-purple-100 border-purple-200", icon: Calendar },
  { value: "paseEntrada", label: "Pase de entrada - Retardo (Late Entry)", color: "from-red-50 to-red-100 border-red-200", icon: Clock },
  { value: "paseSalida", label: "Pase de salida (Early Exit)", color: "from-orange-50 to-orange-100 border-orange-200", icon: Clock },
  { value: "cambioTurno", label: "Cambio de turno (Shift Change)", color: "from-teal-50 to-teal-100 border-teal-200", icon: Clock },
  { value: "tiempoPorTiempo", label: "Tiempo por Tiempo (Time for Time)", color: "from-indigo-50 to-indigo-100 border-indigo-200", icon: Clock },
]

const MOTIVOS_CON_GOCE = [
  { value: "Matrimonio", label: "Matrimonio" },
  { value: "Fallecimiento familiar directo", label: "Fallecimiento familiar directo" },
  { value: "Paternidad", label: "Paternidad" },
]

const MOTIVOS_SIN_GOCE = [
  { value: "1. Motivos médicos personales", label: "1. Motivos médicos personales" },
  { value: "2. Enfermedad o emergencia de un familiar directo", label: "2. Enfermedad o emergencia de un familiar directo" },
  { value: "3. Trámites legales o administrativos obligatorios", label: "3. Trámites legales o administrativos obligatorios" },
  { value: "4. Eventos escolares o académicos importantes (propios o de hijos)", label: "4. Eventos escolares o académicos importantes (propios o de hijos)" },
  { value: "5. Situaciones extraordinarias imprevistas", label: "5. Situaciones extraordinarias imprevistas" },
]

// --- Component ---

export default function NewRequestPage() {
  const router = useRouter()
  // Extract session and loading status
  const { session, loading } = useSession() //
  // Access the employee ID. Assuming SessionUser is the User object (session?.id). 
  // Adjust to session?.user?.id if needed.
  const employeeId = session?.id

  // --- State variables ---
  const [requestType, setRequestType] = useState("")
  const [reason, setReason] = useState("") // Used for Textarea motives in non-leave requests

  // Date/time-based requests
  const [startDate, setStartDate] = useState("") // for multi-day requests (ConGoce, SinGoce, Vacaciones)
  const [endDate, setEndDate] = useState("")

  // Specific state variables to match index.html fields
  const [paidLeaveReason, setPaidLeaveReason] = useState("") // for permisoConGoce
  const [unpaidLeaveReason, setUnpaidLeaveReason] = useState("") // for permisoSinGoce

  // Single-day/Time requests
  const [lateEntryDate, setLateEntryDate] = useState("") // for paseEntrada
  const [lateEntryTime, setLateEntryTime] = useState("")
  const [earlyExitDate, setEarlyExitDate] = useState("") // for paseSalida
  const [earlyExitTime, setEarlyExitTime] = useState("")
  const [shiftChangeDate, setShiftChangeDate] = useState("") // for cambioTurno
  const [currentShift, setCurrentShift] = useState("")
  const [newShift, setNewShift] = useState("")
  const [timeForTimeDate, setTimeForTimeDate] = useState("") // for tiempoPorTiempo
  const [timeForTimeHours, setTimeForTimeHours] = useState("")
  const [timeForTimePayShift, setTimeForTimePayShift] = useState("")

  const [hoursPerDay] = useState("8")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Helper functions
  const requestTypeDetails = REQUEST_TYPE_OPTIONS.find(opt => opt.value === requestType)
  const getCardColor = () => requestTypeDetails?.color || "from-gray-50 to-gray-100 border-gray-200"
  const RequestIcon = requestTypeDetails?.icon || Calendar

  const calculateDays = () => {
    // Only calculate for multi-day requests
    if (requestType === "paseEntrada" || requestType === "paseSalida" || requestType === "cambioTurno" || requestType === "tiempoPorTiempo") {
      return 0
    }
    if (!startDate || !endDate) return 0
    const start = new Date(startDate)
    const end = new Date(endDate)
    // Add 1 to include the end date
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays > 0 ? diffDays : 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)

    // 🚨 FIX 1: Safety Check - Prevents submission if the ID hasn't loaded 
    if (!employeeId) {
      setError("Employee session not found. Please log in again.")
      setSubmitting(false)
      // Since the top-level check handles redirects, this simply stops submission.
      return
    }

    let requestData: any = {
      employee_id: employeeId, // 🚨 FIX 2: Passes the employee ID to satisfy the foreign key constraint
      request_type: requestType,
      hours_per_day: Number.parseFloat(hoursPerDay) || 8.0,
      paid_days: 0,
      unpaid_days: 0,
      unpaid_comments: null,
      shift_details: null,
      start_date: "",
      end_date: "",
      total_days: 0,
      reason: "",
    }

    // --- Validation and Data Mapping ---
    switch (requestType) {
      case "permisoConGoce":
        const conGoceDays = calculateDays()
        if (conGoceDays <= 0 || !paidLeaveReason) {
          setError("Please select valid dates and a reason for paid leave.")
          setSubmitting(false)
          return
        }
        requestData.start_date = startDate
        requestData.end_date = endDate
        requestData.reason = paidLeaveReason
        requestData.total_days = conGoceDays
        requestData.paid_days = conGoceDays
        break

      case "permisoSinGoce":
        const sinGoceDays = calculateDays()
        if (sinGoceDays <= 0 || !unpaidLeaveReason) {
          setError("Please select valid dates and a reason for unpaid leave.")
          setSubmitting(false)
          return
        }
        requestData.start_date = startDate
        requestData.end_date = endDate
        requestData.reason = unpaidLeaveReason
        requestData.total_days = sinGoceDays
        requestData.unpaid_days = sinGoceDays
        requestData.unpaid_comments = unpaidLeaveReason
        break

      case "vacaciones":
        const vacationDays = calculateDays()
        if (vacationDays <= 0) {
          setError("Please select valid dates for vacation.")
          setSubmitting(false)
          return
        }
        requestData.start_date = startDate
        requestData.end_date = endDate
        requestData.reason = "Vacaciones"
        requestData.total_days = vacationDays
        requestData.paid_days = vacationDays
        break

      case "paseEntrada":
        if (!lateEntryDate || !lateEntryTime || !reason.trim()) {
          setError("Please fill in the date, time, and motive for the late entry.")
          setSubmitting(false)
          return
        }
        // Map single day requests to the start/end date fields
        requestData.start_date = lateEntryDate
        requestData.end_date = lateEntryDate
        requestData.total_days = 0.1 // Use a partial day indicator if necessary
        requestData.reason = `Pase de Entrada (Retardo). Hora: ${lateEntryTime}. Motivo: ${reason.trim()}`
        requestData.shift_details = `Late Entry Time: ${lateEntryTime}`
        break

      case "paseSalida":
        if (!earlyExitDate || !earlyExitTime || !reason.trim()) {
          setError("Please fill in the date, time, and motive for the early exit.")
          setSubmitting(false)
          return
        }
        requestData.start_date = earlyExitDate
        requestData.end_date = earlyExitDate
        requestData.total_days = 0.1
        requestData.reason = `Pase de Salida. Hora: ${earlyExitTime}. Motivo: ${reason.trim()}`
        requestData.shift_details = `Early Exit Time: ${earlyExitTime}`
        break

      case "cambioTurno":
        if (!shiftChangeDate || !currentShift.trim() || !newShift.trim() || !reason.trim()) {
          setError("Please fill in the date, current shift, new shift, and motive for the shift change.")
          setSubmitting(false)
          return
        }
        requestData.start_date = shiftChangeDate
        requestData.end_date = shiftChangeDate
        requestData.total_days = 0
        requestData.reason = `Cambio de Turno. Motivo: ${reason.trim()}`
        requestData.shift_details = `Current Shift: ${currentShift.trim()}, New Shift: ${newShift.trim()}`
        break

      case "tiempoPorTiempo":
        if (!timeForTimeDate || !timeForTimeHours || !timeForTimePayShift.trim() || !reason.trim()) {
          setError("Please fill in the date, hours, pay shift, and motive for Time for Time.")
          setSubmitting(false)
          return
        }
        requestData.start_date = timeForTimeDate
        requestData.end_date = timeForTimeDate
        requestData.total_days = 0
        requestData.reason = `Tiempo por Tiempo. Motivo: ${reason.trim()}`
        requestData.shift_details = `Hours: ${timeForTimeHours}, Pay Shift: ${timeForTimePayShift.trim()}`
        break

      default:
        setError("Please select a request type.")
        setSubmitting(false)
        return
    }

    try {
      const response = await fetch("/api/requests/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to create request")
        return
      }

      router.push("/employee/dashboard")
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  // --- Conditional Rendering Function ---
  const renderFormFields = () => {
    switch (requestType) {
      case "permisoConGoce":
        return (
          <>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-4 animate-fadeIn">
              <Label htmlFor="paidLeaveReason" className="text-gray-900 font-semibold mb-2 block">Motivo</Label>
              <Select value={paidLeaveReason} onValueChange={setPaidLeaveReason} required>
                <SelectTrigger className="bg-white border-green-300">
                  <SelectValue placeholder="Seleccionar motivo" />
                </SelectTrigger>
                <SelectContent>
                  {MOTIVOS_CON_GOCE.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate" className="text-gray-700 font-semibold flex items-center gap-2"><Calendar className="h-4 w-4" />Fecha inicio</Label>
                <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="mt-2 border-gray-300" />
              </div>
              <div>
                <Label htmlFor="endDate" className="text-gray-700 font-semibold flex items-center gap-2"><Calendar className="h-4 w-4" />Fecha fin</Label>
                <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required min={startDate} className="mt-2 border-gray-300" />
              </div>
            </div>
          </>
        )

      case "permisoSinGoce":
        return (
          <>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-4 animate-fadeIn">
              <Label htmlFor="unpaidLeaveReason" className="text-gray-900 font-semibold mb-2 block">Motivo</Label>
              <Select value={unpaidLeaveReason} onValueChange={setUnpaidLeaveReason} required>
                <SelectTrigger className="bg-white border-yellow-300">
                  <SelectValue placeholder="Seleccionar motivo" />
                </SelectTrigger>
                <SelectContent>
                  {MOTIVOS_SIN_GOCE.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate" className="text-gray-700 font-semibold flex items-center gap-2"><Calendar className="h-4 w-4" />Fecha inicio</Label>
                <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="mt-2 border-gray-300" />
              </div>
              <div>
                <Label htmlFor="endDate" className="text-gray-700 font-semibold flex items-center gap-2"><Calendar className="h-4 w-4" />Fecha fin</Label>
                <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required min={startDate} className="mt-2 border-gray-300" />
              </div>
            </div>
          </>
        )

      case "vacaciones":
        return (
          <div className="grid md:grid-cols-2 gap-4 animate-fadeIn">
            <div>
              <Label htmlFor="startDate" className="text-gray-700 font-semibold flex items-center gap-2"><Calendar className="h-4 w-4" />Fecha inicio</Label>
              <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="mt-2 border-gray-300" />
            </div>
            <div>
              <Label htmlFor="endDate" className="text-gray-700 font-semibold flex items-center gap-2"><Calendar className="h-4 w-4" />Fecha fin</Label>
              <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required min={startDate} className="mt-2 border-gray-300" />
            </div>
          </div>
        )

      case "paseEntrada":
        return (
          <>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-4 animate-fadeIn">
              <Label htmlFor="reason" className="text-gray-900 font-semibold mb-2 block">Motivo</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Escribir el motivo del retardo..."
                rows={3}
                required
                className="border-red-300 bg-white"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lateEntryDate" className="text-gray-700 font-semibold flex items-center gap-2"><Calendar className="h-4 w-4" />Fecha</Label>
                <Input id="lateEntryDate" type="date" value={lateEntryDate} onChange={(e) => setLateEntryDate(e.target.value)} required className="mt-2 border-gray-300" />
              </div>
              <div>
                <Label htmlFor="lateEntryTime" className="text-gray-700 font-semibold flex items-center gap-2"><Clock className="h-4 w-4" />Hora de entrada</Label>
                <Input id="lateEntryTime" type="time" value={lateEntryTime} onChange={(e) => setLateEntryTime(e.target.value)} required className="mt-2 border-gray-300" />
              </div>
            </div>
          </>
        )

      case "paseSalida":
        return (
          <>
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg space-y-4 animate-fadeIn">
              <Label htmlFor="reason" className="text-gray-900 font-semibold mb-2 block">Motivo</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Escribir el motivo de la salida..."
                rows={3}
                required
                className="border-orange-300 bg-white"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="earlyExitDate" className="text-gray-700 font-semibold flex items-center gap-2"><Calendar className="h-4 w-4" />Fecha</Label>
                <Input id="earlyExitDate" type="date" value={earlyExitDate} onChange={(e) => setEarlyExitDate(e.target.value)} required className="mt-2 border-gray-300" />
              </div>
              <div>
                <Label htmlFor="earlyExitTime" className="text-gray-700 font-semibold flex items-center gap-2"><Clock className="h-4 w-4" />Hora de salida</Label>
                <Input id="earlyExitTime" type="time" value={earlyExitTime} onChange={(e) => setEarlyExitTime(e.target.value)} required className="mt-2 border-gray-300" />
              </div>
            </div>
          </>
        )

      case "cambioTurno":
        return (
          <>
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg space-y-4 animate-fadeIn">
              <Label htmlFor="reason" className="text-gray-900 font-semibold mb-2 block">Motivo</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Escribir el motivo del cambio de turno..."
                rows={3}
                required
                className="border-teal-300 bg-white"
              />
            </div>
            <div>
              <Label htmlFor="shiftChangeDate" className="text-gray-700 font-semibold flex items-center gap-2"><Calendar className="h-4 w-4" />Fecha del día trabajado</Label>
              <Input id="shiftChangeDate" type="date" value={shiftChangeDate} onChange={(e) => setShiftChangeDate(e.target.value)} required className="mt-2 border-gray-300" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currentShift" className="text-gray-700 font-semibold">Turno actual</Label>
                <Input id="currentShift" type="text" value={currentShift} onChange={(e) => setCurrentShift(e.target.value)} placeholder="ej: Matutino" required className="mt-2 border-gray-300" />
              </div>
              <div>
                <Label htmlFor="newShift" className="text-gray-700 font-semibold">Turno nuevo</Label>
                <Input id="newShift" type="text" value={newShift} onChange={(e) => setNewShift(e.target.value)} placeholder="ej: Vespertino" required className="mt-2 border-gray-300" />
              </div>
            </div>
          </>
        )

      case "tiempoPorTiempo":
        return (
          <>
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg space-y-4 animate-fadeIn">
              <Label htmlFor="reason" className="text-gray-900 font-semibold mb-2 block">Motivo</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Escribir el motivo..."
                rows={3}
                required
                className="border-indigo-300 bg-white"
              />
            </div>
            <div>
              <Label htmlFor="timeForTimeDate" className="text-gray-700 font-semibold flex items-center gap-2"><Calendar className="h-4 w-4" />Fecha del día trabajado</Label>
              <Input id="timeForTimeDate" type="date" value={timeForTimeDate} onChange={(e) => setTimeForTimeDate(e.target.value)} required className="mt-2 border-gray-300" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="timeForTimeHours" className="text-gray-700 font-semibold">Horas laboradas</Label>
                <Input id="timeForTimeHours" type="number" step="1" min="1" value={timeForTimeHours} onChange={(e) => setTimeForTimeHours(e.target.value)} placeholder="ej: 8" required className="mt-2 border-gray-300" />
              </div>
              <div>
                <Label htmlFor="timeForTimePayShift" className="text-gray-700 font-semibold">Turno en que paga</Label>
                <Input id="timeForTimePayShift" type="text" value={timeForTimePayShift} onChange={(e) => setTimeForTimePayShift(e.target.value)} placeholder="ej: Matutino" required className="mt-2 border-gray-300" />
              </div>
            </div>
          </>
        )

      default:
        return (
          <div className="p-6 text-center text-gray-500 border border-dashed rounded-xl">
            <AlertCircle className="h-6 w-6 mx-auto mb-2" />
            <p>Select a **Tipo de Solicitud** to display the required fields.</p>
          </div>
        )
    }
  }

  // 🚨 FIX 1: Session Safety Check - Early Return
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session || !employeeId) {
    // Redirect logic: Pushes to login page if session is clearly invalid/missing after loading.
    setTimeout(() => {
      router.push("/login")
    }, 100)

    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center">
        <AlertCircle className="h-6 w-6 text-red-500 mr-2 inline" />
        <p className="text-gray-700">Session expired or not found. Redirecting to login...</p>
      </div>
    )
  }

  // --- Main Component Render ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header (simplified, assuming Navigation component handles logout) */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()} className="border-gray-300">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Formulario de Solicitudes</h1>
              <p className="text-gray-600 mt-1">Llene los detalles para su solicitud de ausencia o cambio</p>
            </div>
          </div>
          {/* If you have a Navigation component, it should be displayed here or handle the layout. */}
        </div>

        <Card className="border-gray-200 shadow-2xl">
          <CardHeader>
            <CardTitle>Detalles de la Solicitud</CardTitle>
            <CardDescription>Seleccione el tipo de solicitud y llene los campos requeridos.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Request Type Selection */}
              <div className={`p-6 rounded-xl border bg-gradient-to-r ${getCardColor()} transition-all`}>
                <Label htmlFor="requestType" className="text-gray-900 font-semibold mb-3 block flex items-center gap-2">
                  <RequestIcon className="h-5 w-5" />
                  Tipo de Solicitud
                </Label>
                <Select value={requestType} onValueChange={setRequestType} required>
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder="Seleccionar tipo de solicitud" />
                  </SelectTrigger>
                  <SelectContent>
                    {REQUEST_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Conditional Form Fields */}
              <div className="space-y-6 animate-fadeIn">
                {renderFormFields()}

                {/* Display total days for multi-day forms */}
                {(requestType === "permisoConGoce" || requestType === "permisoSinGoce" || requestType === "vacaciones") && startDate && endDate && calculateDays() > 0 && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">
                      Total de días solicitados: <span className="text-lg font-bold">{calculateDays()}</span>
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              {requestType && (
                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="flex-1 border-gray-300"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {submitting ? "Enviando..." : "Enviar Solicitud"}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  )
}