// app/api/login/route.ts
import { type NextRequest, NextResponse } from "next/server"
// 🛑 IMPORTAR: funciones de autenticación y de base de datos
import { verifyPassword, createSession, setSessionCookie } from "@/lib/auth" 
import { getUserByEmail } from "@/lib/db" // <-- Ahora solo se importa aquí (Node.js)

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // 1. Acceso a la base de datos (OK porque estamos en Node.js)
    const user = getUserByEmail(email)

    if (!user || !(await verifyPassword(password, user.password))) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }
    
    // 2. Creación y asignación de la sesión
    const token = await createSession(user)
    await setSessionCookie(token) // Esta función modifica las cookies directamente

    // 3. Respuesta (Ya no necesitas un objeto 'result' intermedio)
    return NextResponse.json({ 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
      }
    }, { status: 200 })

  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}