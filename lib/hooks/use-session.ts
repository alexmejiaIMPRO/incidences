"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { SessionUser } from "@/lib/auth"

export function useSession() {
  const [session, setSession] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch("/api/auth/session")
        if (response.ok) {
          const data = await response.json()
          setSession(data.user)
        } else {
          router.push("/login")
        }
      } catch (error) {
        console.error("[v0] Session fetch error:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    fetchSession()
  }, [router])

  return { session, loading }
}
