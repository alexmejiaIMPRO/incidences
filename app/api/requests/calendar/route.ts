import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getCalendarRequests } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const employeeId = searchParams.get("employeeId")
    const status = searchParams.get("status")

    const requests = await getCalendarRequests({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      employeeId: employeeId || undefined,
      status: status || undefined,
      userRole: session.role,
      userId: session.userId,
    })

    return NextResponse.json({ requests })
  } catch (error) {
    console.error("[v0] Error fetching calendar requests:", error)
    return NextResponse.json({ error: "Failed to fetch calendar requests" }, { status: 500 })
  }
}
