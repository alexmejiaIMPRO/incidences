// lib/auth.ts
import { compare, hash } from "bcryptjs"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import type { UserRole, User } from "./db" 

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-in-production")
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://misitio.com' // Sustituir por su dominio en producción
  : 'http://localhost:3000'; // Asegúrese de que este es el puerto correcto

export interface SessionUser {
  id: number
  email: string
  name: string
  role: UserRole
  department: string | null
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword)
}

export async function createSession(user: User): Promise<string> {
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    department: user.department,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET)
    
  return token
}

/**
 * Verifica y decodifica el token de sesión JWT.
 * @param token El token JWT.
 * @returns El objeto de usuario de la sesión o null si el token es inválido.
 */
export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    });

    // 🔧 CORRECCIÓN: El payload ya contiene directamente los datos del usuario
    // No hay estructura anidada "user"
    return {
      id: payload.id as number,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as UserRole,
      department: (payload.department as string) || null,
    };
  } catch (error) {
    console.error("Error al verificar el JWT:", error); 
    return null;
  }
}

/**
 * Obtiene la sesión actual leyendo la cookie 'session'.
 * @returns El objeto SessionUser o null si no hay sesión válida.
 */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies() 
  const token = cookieStore.get("session")?.value 

  if (!token) {
    console.log("❌ No se encontró token de sesión en las cookies");
    return null
  }

  const session = await verifySession(token);
  
  if (!session) {
    console.log("❌ Token de sesión inválido o expirado");
  } else {
    console.log("✅ Sesión válida para usuario:", session.email);
  }

  return session;
}

/**
 * Establece la cookie de sesión con el token JWT.
 * @param token El token JWT a almacenar.
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })
}

/**
 * Elimina la cookie de sesión.
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete("session")
}
