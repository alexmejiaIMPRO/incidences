// /app/api/requests/[id]/route.ts
import { NextResponse } from 'next/server';
import { 
    updateRequestStatus, 
    getAbsenceRequestById,
    RequestStatus 
} from '@/lib/db'; 
import { getSession } from '@/lib/auth'; 

// Cambiamos el handler de DELETE a PATCH para realizar una actualización de estado (soft delete)
export async function PATCH(
  request: Request,
  // params ahora necesita ser await antes de acceder a sus propiedades
  { params }: { params: Promise<{ id: string }> } 
) {
  // ⭐ SOLUCIÓN: Await params antes de desestructurar
  const { id } = await params; 
  const requestId = Number(id); 
  
  // 1. Verificación de ID
  if (isNaN(requestId)) {
    return NextResponse.json({ error: "Invalid Request ID" }, { status: 400 });
  }

  // 2. Verificación de Sesión y Autorización
  const session = await getSession(); 

  if (!session || !session.user) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized: Session is invalid." }), { status: 401 }); 
  }
  const currentUserId = session.user.id;
  
  // Definimos el nuevo estado para "ocultar/archivar" la solicitud.
  const NEW_STATUS: RequestStatus = 'ARCHIVED' as RequestStatus; 

  try {
    const requestToUpdate = await getAbsenceRequestById(requestId);

    if (!requestToUpdate) {
        return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // 3. Reglas de negocio y seguridad
    
    // 3.1. Solo el empleado que la creó puede archivarla (Regla de propiedad)
    if (requestToUpdate.employee_id !== currentUserId) {
        return NextResponse.json({ error: "Forbidden: You can only archive your own requests." }, { status: 403 });
    }

    // 3.2. Restricción por estado: Evitar archivar si ya está archivada.
    if (requestToUpdate.status === NEW_STATUS) {
        return NextResponse.json({ 
            error: `Request is already archived.` 
        }, { status: 400 });
    }

    // 4. Archivar (Soft Delete) en la Base de Datos
    updateRequestStatus(requestId, NEW_STATUS, requestToUpdate.current_approval_stage); 

    // Éxito: 200 OK
    return NextResponse.json({ message: "Request archived successfully." }, { status: 200 });
    

  } catch (error) {
    console.error(`[PATCH API] Error processing request ${requestId}:`, error);
    return NextResponse.json({ error: "Internal Server Error." }, { status: 500 });
  }
}
