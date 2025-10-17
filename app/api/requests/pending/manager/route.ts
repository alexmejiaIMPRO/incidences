import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDatabase } from "@/lib/db"

export async function GET() {
  try {
    const session = await getSession()

    if (!session || session.role !== "MANAGER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = getDatabase()

    // Get pending requests at manager approval stage
    const requests = db
      .prepare(
        `
      SELECT 
        ar.*,
        u.name as employee_name,
        s.name as supervisor_name
      FROM absence_requests ar
      JOIN users u ON ar.employee_id = u.id
      LEFT JOIN users s ON u.supervisor_id = s.id
      WHERE ar.status = 'PENDING' 
        AND ar.current_approval_stage = 'MANAGER'
      ORDER BY ar.created_at ASC
    `,
      )
      .all()

    return NextResponse.json({ requests }, { status: 200 })
  } catch (error) {
    console.error("[v0] Get pending requests error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
