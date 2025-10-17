import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDatabase } from "@/lib/db"

export async function GET() {
  try {
    const session = await getSession()

    if (!session || session.role !== "HR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = getDatabase()

    // Get pending requests at HR approval stage
    const requests = db
      .prepare(
        `
      SELECT 
        ar.*,
        u.name as employee_name
      FROM absence_requests ar
      JOIN users u ON ar.employee_id = u.id
      WHERE ar.status = 'PENDING' 
        AND ar.current_approval_stage = 'HR'
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
