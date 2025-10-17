import Database from "better-sqlite3"
import path from "path"

let db: Database.Database | null = null
let isInitialized = false // Bandera para asegurar que el setup solo se ejecuta una vez

// 🛑 SQL para inicialización: Crea todas las tablas si no existen.
const SETUP_SQL = `
    -- Crear tabla users
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('EMPLOYEE', 'SUPERVISOR', 'MANAGER', 'HR', 'PAYROLL')),
        department TEXT,
        supervisor_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (supervisor_id) REFERENCES users(id)
    );

    -- Crear tabla de solicitudes de ausencia
    CREATE TABLE IF NOT EXISTS absence_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        request_type TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        total_days REAL NOT NULL,
        reason TEXT NOT NULL,
        -- NOTA: El campo 'status' ahora puede contener 'ARCHIVED'
        status TEXT NOT NULL DEFAULT 'PENDING',
        current_approval_stage TEXT NOT NULL DEFAULT 'SUPERVISOR',
        hours_per_day REAL DEFAULT 8.0,
        paid_days REAL DEFAULT 0,
        unpaid_days REAL DEFAULT 0,
        unpaid_comments TEXT,
        shift_change TEXT,
        shift_details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES users(id)
    );

    -- Crear tabla de historial de aprobación
    CREATE TABLE IF NOT EXISTS approval_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id INTEGER NOT NULL,
        approver_id INTEGER NOT NULL,
        approval_stage TEXT NOT NULL,
        action TEXT NOT NULL,
        comments TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (request_id) REFERENCES absence_requests(id),
        FOREIGN KEY (approver_id) REFERENCES users(id)
    );
    
    -- Crear tabla de notificaciones
    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        request_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (request_id) REFERENCES absence_requests(id)
    );
`;

export function getDatabase() {
  if (!db) {
    const dbPath = path.join(process.cwd(), "absence-requests.db")
    db = new Database(dbPath)
    db.pragma("journal_mode = WAL")
  }

  // 1. Ejecutar el setup solo una vez por proceso (Node.js)
  if (!isInitialized) {
    try {
        db.exec(SETUP_SQL);
        isInitialized = true;
        console.log("✅ Database schema initialized/verified.");
    } catch (error) {
        console.error("❌ Error during database schema initialization:", error);
        throw error;
    }
  }

  return db
}

export function closeDatabase() {
  if (db) {
    db.close()
    db = null
    isInitialized = false;
  }
}

// User types
export type UserRole = "EMPLOYEE" | "SUPERVISOR" | "MANAGER" | "HR" | "PAYROLL"

export interface User {
  id: number
  email: string
  password: string
  name: string
  role: UserRole
  department: string | null
  supervisor_id: number | null
  created_at: string
  updated_at: string
}

// lib/db.ts
// ...
// Absence request types
export type RequestType = 
    | "permisoConGoce" 
    | "permisoSinGoce" 
    | "vacaciones" 
    | "paseEntrada" 
    | "paseSalida" 
    | "cambioTurno" 
    | "tiempoPorTiempo"
    | "VACATION" | "SICK_LEAVE" | "PERSONAL" | "UNPAID" | "OTHER" // Keep old ones for safety
    
// MODIFICACIÓN CLAVE: Añadimos 'ARCHIVED'
export type RequestStatus = "PENDING" | "APPROVED" | "DECLINED" | "CANCELLED" | "ARCHIVED"
// ...
export type ApprovalStage = "SUPERVISOR" | "MANAGER" | "HR" | "PAYROLL" | "COMPLETED"

export interface AbsenceRequest {
  id: number
  employee_id: number
  request_type: RequestType
  start_date: string
  end_date: string
  total_days: number
  reason: string
  status: RequestStatus
  current_approval_stage: ApprovalStage
  hours_per_day?: number
  paid_days?: number
  unpaid_days?: number
  unpaid_comments?: string | null
  shift_change?: string | null
  shift_details?: string | null
  created_at: string
  updated_at: string
}

export interface ApprovalHistory {
  id: number
  request_id: number
  approver_id: number
  approval_stage: ApprovalStage
  action: "APPROVED" | "DECLINED"
  comments: string | null
  created_at: string
}

export interface Notification {
  id: number
  user_id: number
  request_id: number
  message: string
  is_read: number
  created_at: string
}

// Database query functions
export function getUserByEmail(email: string): User | undefined {
  const db = getDatabase()
  // Ya que el esquema ahora se inicializa, esta consulta funcionará.
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email) as User | undefined
}

export function getUserById(id: number): User | undefined {
  const db = getDatabase()
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined
}

export function createAbsenceRequest(data: {
  employee_id: number
  request_type: RequestType
  start_date: string
  end_date: string
  total_days: number
  reason: string
  hours_per_day?: number
  paid_days?: number
  unpaid_days?: number
  unpaid_comments?: string
  shift_details?: string
}): number {
  const db = getDatabase()
  const result = db
    .prepare(`
    INSERT INTO absence_requests (
      employee_id, request_type, start_date, end_date, total_days, reason,
      hours_per_day, paid_days, unpaid_days, unpaid_days_comments, shift_details
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .run(
      data.employee_id,
      data.request_type,
      data.start_date,
      data.end_date,
      data.total_days,
      data.reason,
      data.hours_per_day || 8.0,
      data.paid_days || 0,
      data.unpaid_days || 0,
      data.unpaid_comments || null,
      data.shift_details || null,
    )

  return result.lastInsertRowid as number
}

export function getAbsenceRequestsByEmployee(employeeId: number): AbsenceRequest[] {
  const db = getDatabase()
  // MODIFICACIÓN CLAVE: Filtramos solicitudes que NO están en estado 'ARCHIVED'
  return db
    .prepare("SELECT * FROM absence_requests WHERE employee_id = ? AND status != 'ARCHIVED' ORDER BY created_at DESC")
    .all(employeeId) as AbsenceRequest[]
}

export function getAbsenceRequestById(id: number): AbsenceRequest | undefined {
  const db = getDatabase()
  return db.prepare("SELECT * FROM absence_requests WHERE id = ?").get(id) as AbsenceRequest | undefined
}

export function getPendingRequestsByStage(stage: ApprovalStage): AbsenceRequest[] {
  const db = getDatabase()
  // También aseguramos que las solicitudes PENDIENTES NO sean ARCHIVED
  return db
    .prepare(`
    SELECT * FROM absence_requests 
    WHERE status = 'PENDING' 
      AND current_approval_stage = ?
      AND status != 'ARCHIVED' 
    ORDER BY created_at ASC
  `)
    .all(stage) as AbsenceRequest[]
}

export function updateRequestStatus(requestId: number, status: RequestStatus, currentStage: ApprovalStage): void {
  const db = getDatabase()
  db.prepare(`
    UPDATE absence_requests 
    SET status = ?, current_approval_stage = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, currentStage, requestId)
}

export function addApprovalHistory(data: {
  request_id: number
  approver_id: number
  approval_stage: ApprovalStage
  action: "APPROVED" | "DECLINED"
  comments?: string
}): void {
  const db = getDatabase()
  db.prepare(`
    INSERT INTO approval_history (request_id, approver_id, approval_stage, action, comments)
    VALUES (?, ?, ?, ?, ?)
  `).run(data.request_id, data.approver_id, data.approval_stage, data.action, data.comments || null)
}

export function getApprovalHistory(requestId: number): ApprovalHistory[] {
  const db = getDatabase()
  return db
    .prepare("SELECT * FROM approval_history WHERE request_id = ? ORDER BY created_at ASC")
    .all(requestId) as ApprovalHistory[]
}

export function createNotification(data: {
  user_id: number
  request_id: number
  message: string
}): void {
  const db = getDatabase()
  db.prepare(`
    INSERT INTO notifications (user_id, request_id, message)
    VALUES (?, ?, ?)
  `).run(data.user_id, data.request_id, data.message)
}

export function getUnreadNotifications(userId: number): Notification[] {
  const db = getDatabase()
  // Se asume que las notificaciones de solicitudes archivadas deben seguir visibles
  return db
    .prepare("SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC")
    .all(userId) as Notification[]
}

export function markNotificationAsRead(notificationId: number): void {
  const db = getDatabase()
  db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").run(notificationId)
}

// NOTA: Esta función de eliminación REAL ya no se usará en el dashboard, 
// pero la mantenemos por si la necesitas para tareas de administración.
export function deleteAbsenceRequest(id: number): boolean {
  const db = getDatabase();
  
  // Usamos una transacción para asegurar que la eliminación sea atómica.
  const runDeletion = db.transaction(() => {
    // 1. Eliminar notificaciones asociadas
    db.prepare('DELETE FROM notifications WHERE request_id = ?').run(id);

    // 2. Eliminar historial de aprobación asociado
    db.prepare('DELETE FROM approval_history WHERE request_id = ?').run(id);

    // 3. Eliminar la solicitud de ausencia principal
    const info = db.prepare('DELETE FROM absence_requests WHERE id = ?').run(id);

    // Retorna true si se eliminó una fila de absence_requests
    return info.changes > 0;
  });

  return runDeletion();
}

export function getCalendarRequests(filters: {
  startDate?: string
  endDate?: string
  employeeId?: string
  status?: string
  userRole: UserRole
  userId: number
}): Array<AbsenceRequest & { employee_name: string; employee_email: string }> {
  const db = getDatabase()
  let query = `
    SELECT 
      ar.*,
      u.name as employee_name,
      u.email as employee_email
    FROM absence_requests ar
    JOIN users u ON ar.employee_id = u.id
    WHERE ar.status != 'ARCHIVED' -- FILTRO CLAVE: Excluir archivadas
  `
  const params: any[] = []

  // Role-based filtering
  if (filters.userRole === "EMPLOYEE") {
    query += " AND ar.employee_id = ?"
    params.push(filters.userId)
  } else if (filters.userRole === "SUPERVISOR") {
    query += " AND u.supervisor_id = ?"
    params.push(filters.userId)
  }
  // MANAGER, HR, and PAYROLL can see all requests

  // Date range filtering
  if (filters.startDate) {
    query += " AND ar.end_date >= ?"
    params.push(filters.startDate)
  }
  if (filters.endDate) {
    query += " AND ar.start_date <= ?"
    params.push(filters.endDate)
  }

  // Employee filtering
  if (filters.employeeId) {
    query += " AND ar.employee_id = ?"
    params.push(Number.parseInt(filters.employeeId))
  }

  // Status filtering
  if (filters.status && filters.status !== "all") {
    query += " AND ar.status = ?"
    params.push(filters.status)
  }

  query += " ORDER BY ar.start_date ASC"

  return db.prepare(query).all(...params) as Array<AbsenceRequest & { employee_name: string; employee_email: string }>
}

export function getApprovedRequests(): Array<AbsenceRequest & { employee_name: string; employee_email: string }> {
  const db = getDatabase()
  return db
    .prepare(`
    SELECT 
      ar.*,
      u.name as employee_name,
      u.email as employee_email
    FROM absence_requests ar
    JOIN users u ON ar.employee_id = u.id
    WHERE ar.status = 'APPROVED'
    ORDER BY ar.start_date DESC
  `)
    .all() as Array<AbsenceRequest & { employee_name: string; employee_email: string }>
}