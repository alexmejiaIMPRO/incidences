import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifySession } from "@/lib/auth"

const publicRoutes = ["/login"]
const roleRoutes = {
  EMPLOYEE: ["/employee"],
  SUPERVISOR: ["/supervisor"],
  MANAGER: ["/manager"],
  HR: ["/hr"],
  PAYROLL: ["/payroll"],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check for session
  const token = request.cookies.get("session")?.value

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Verify session
  const session = await verifySession(token)

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Check role-based access
  const userRole = session.role
  const allowedRoutes = roleRoutes[userRole] || []

  // Check if user is accessing their allowed routes
  const hasAccess = allowedRoutes.some((route) => pathname.startsWith(route))

  if (!hasAccess && pathname !== "/") {
    // Redirect to their dashboard
    const dashboardRoute = allowedRoutes[0] ? `${allowedRoutes[0]}/dashboard` : "/login"
    return NextResponse.redirect(new URL(dashboardRoute, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
