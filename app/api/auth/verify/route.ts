// app/api/auth/verify/route.ts (¡Este SÍ corre en Node.js!)

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, getUserByEmail } from '@/lib/db'; 
import { jwtVerify } from 'jose';
// Importa tus funciones reales de verificación y JWT

// Asegúrate de que esta clave sea la misma que usas para firmar el token
const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'mi_secreto_seguro'); 

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ session: null }, { status: 400 });
    }

    // 1. Verifica el token JWT
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'urn:example:issuer',
      audience: 'urn:example:audience',
    });

    // 2. Opcional: Busca el usuario en la DB para validación extra (usa lib/db.ts aquí)
    const user = getUserByEmail(payload.email as string);

    if (!user) {
      return NextResponse.json({ session: null }, { status: 401 });
    }

    // 3. Devuelve los datos de la sesión (sin incluir el hash de la contraseña)
    const session = {
      id: user.id,
      email: user.email,
      role: user.role,
      // ... otros datos necesarios para el middleware
    };
    
    return NextResponse.json({ session });

  } catch (e) {
    // Si la verificación falla (token expirado o inválido)
    return NextResponse.json({ session: null }, { status: 200 }); 
  }
}

// Opcional: Asegura que se ejecute como Node.js (aunque es el default)
export const runtime = 'nodejs';
