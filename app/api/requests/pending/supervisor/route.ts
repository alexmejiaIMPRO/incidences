import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDatabase } from "@/lib/db"

export async function GET() {
  try {
    const session = await getSession()

    if (!session || session.role !== "SUPERVISOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = getDatabase()

    // Get pending requests for employees supervised by this user
    const requests = db
      .prepare(
        `
      SELECT 
        ar.*,
        u.name as employee_name
      FROM absence_requests ar
      JOIN users u ON ar.employee_id = u.id
      WHERE u.supervisor_id = ? 
        AND ar.status = 'PENDING' 
        AND ar.current_approval_stage = 'SUPERVISOR'
      ORDER BY ar.created_at ASC
    `,
      )
      .all(session.id)

    return NextResponse.json({ requests }, { status: 200 })
  } catch (error) {
    console.error("[v0] Get pending requests error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
