"use client"

import { LogOut, User } from "lucide-react"
import { useRouter } from "next/navigation"
// import Image from "next/image" // Ya no es necesario si usamos solo Tailwind

interface NavigationProps {
  user: {
    name: string
    role: string
    email: string
  }
}

export function Navigation({ user }: NavigationProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case "EMPLOYEE":
        return "Employee"
      case "SUPERVISOR":
        return "Supervisor"
      case "MANAGER":
        return "Manager"
      case "HR":
        return "HR Manager"
      case "PAYROLL":
        return "Payroll"
      default:
        return "User"
    }
  }

  return (
    <nav className="bg-white/95 backdrop-blur-lg shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
      <div className="px-12 sm:px-6 lg:px-12 animate-slide-in-top">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">

              {/* *** LOGO DE IRIS TALENT con Tailwind CSS *** */}
              <div className="flex items-baseline py-1">
                <span className="text-xl font-extrabold tracking-tight text-gray-900">
                  IRIS
                </span>
                <span className="text-xs font-semibold text-blue-600 ml-1 border-b-2 border-blue-600">
                  Talent
                </span>
              </div>

            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="hidden sm:flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-gray-50/80 rounded-xl px-4 py-2">
                <div className="h-8 w-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="text-sm min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{user.name}</p>
                  <p className="text-gray-600 text-xs font-medium">{getRoleDisplay(user.role)}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 rounded-xl transition-all duration-200 focus-ring"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
