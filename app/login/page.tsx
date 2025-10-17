"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Login failed")
        return
      }

      // Redirigir basado en el rol
      const role = data.user.role
      switch (role) {
        case "EMPLOYEE":
          router.push("/employee/dashboard")
          break
        case "SUPERVISOR":
          router.push("/supervisor/dashboard")
          break
        case "MANAGER":
          router.push("/manager/dashboard")
          break
        case "HR":
          router.push("/hr/dashboard")
          break
        case "PAYROLL":
          router.push("/payroll/dashboard")
          break
        default:
          router.push("/dashboard")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-md relative z-10 shadow-2xl border-gray-200">
        <CardHeader className="space-y-1">
          {/* *** LOGO DE IRIS TALENT - CREADO SOLO CON TAILWIND CSS *** */}
          <div className="flex justify-center items-end p-4 mb-2">
            <span className="text-4xl font-extrabold tracking-tight text-gray-900">
              IRIS
            </span>
            <span className="text-sm font-semibold text-blue-600 ml-1 pb-1 border-b-2 border-blue-600">
              Talent
            </span>
          </div>
          <CardTitle className="text-3xl font-bold text-center text-gray-900">Employee Portal</CardTitle>
          <CardDescription className="text-center text-gray-600">Sign in to manage absence requests</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-semibold">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-semibold">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-gray-300"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs font-semibold text-blue-900 mb-2">Demo Accounts:</p>
            <div className="space-y-1 text-xs text-blue-700">
              <p>Employee: employee@company.com</p>
              <p>Supervisor: supervisor@company.com</p>
              <p>Manager: manager@company.com</p>
              <p>HR: hr@company.com</p>
              <p>Payroll: payroll@company.com</p>
              <p className="mt-2 font-semibold">Password: password123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
