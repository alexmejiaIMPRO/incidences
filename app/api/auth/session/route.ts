import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    return NextResponse.json({ user: session }, { status: 200 })
  } catch (error) {
    console.error("[v0] Session error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
