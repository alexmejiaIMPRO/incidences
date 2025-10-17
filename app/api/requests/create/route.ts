import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { createAbsenceRequest, getUserById, createNotification } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const {
      request_type,
      start_date,
      end_date,
      total_days,
      reason,
      hours_per_day,
      paid_days,
      unpaid_days,
      unpaid_comments,
      shift_details,
    } = await request.json()

    if (!request_type || !start_date || !end_date || !total_days || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const requestId = createAbsenceRequest({
      employee_id: session.id,
      request_type,
      start_date,
      end_date,
      total_days,
      reason,
      hours_per_day,
      paid_days,
      unpaid_days,
      unpaid_comments,
      shift_details,
    })

    // Get employee's supervisor
    const employee = getUserById(session.id)
    if (employee?.supervisor_id) {
      // Create notification for supervisor
      createNotification({
        user_id: employee.supervisor_id,
        request_id: requestId,
        message: `New absence request from ${session.name} requires your approval`,
      })
    }

    return NextResponse.json({ success: true, requestId }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
