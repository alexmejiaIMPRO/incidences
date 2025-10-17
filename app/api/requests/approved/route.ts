import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDatabase } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session || session.role !== "PAYROLL") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month")
    const year = searchParams.get("year")

    const db = getDatabase()

    let query = `
      SELECT 
        ar.*,
        u.name as employee_name,
        u.department as employee_department
      FROM absence_requests ar
      JOIN users u ON ar.employee_id = u.id
      WHERE ar.status = 'APPROVED'
    `

    const params: any[] = []

    if (month !== null && year !== null) {
      query += ` AND (
        strftime('%m', ar.start_date) = ? AND strftime('%Y', ar.start_date) = ?
        OR strftime('%m', ar.end_date) = ? AND strftime('%Y', ar.end_date) = ?
      )`
      const monthStr = String(Number(month) + 1).padStart(2, "0")
      params.push(monthStr, year, monthStr, year)
    }

    query += ` ORDER BY ar.start_date DESC`

    const requests = db.prepare(query).all(...params)

    return NextResponse.json({ requests }, { status: 200 })
  } catch (error) {
    console.error("[v0] Get approved requests error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
