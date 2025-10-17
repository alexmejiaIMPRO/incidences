import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDatabase } from "@/lib/db"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only allow non-employees to fetch employee list
    if (session.role === "EMPLOYEE") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const db = getDatabase()
    const employees = db.prepare("SELECT id, name, email FROM users WHERE role = 'EMPLOYEE' ORDER BY name ASC").all()

    return NextResponse.json({ employees })
  } catch (error) {
    console.error("[v0] Error fetching employees:", error)
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 })
  }
}
