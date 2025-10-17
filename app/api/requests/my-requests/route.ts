import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getAbsenceRequestsByEmployee } from "@/lib/db"

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const requests = getAbsenceRequestsByEmployee(session.id)

    return NextResponse.json({ requests }, { status: 200 })
  } catch (error) {
    console.error("[v0] Get requests error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
