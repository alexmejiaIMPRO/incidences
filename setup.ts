// setup.ts (CÓDIGO CORREGIDO Y COMPLETO)

import { getDatabase, closeDatabase, UserRole } from './lib/db'; 
import { hashPassword } from './lib/auth'; 

// Cuentas de demostración (ID 1-5, asumiendo auto-incremento)
const demoUsers = [
    // Asegúrate de que los IDs referenciados existan al final.
    // Ordenamos por dependencia: primero los que no dependen de nadie (Manager)
    // Nota: El supervisor_id es el ID que el usuario tendrá después de la inserción.
    { email: 'manager@company.com', name: 'Mark Manager', role: 'MANAGER' as UserRole, department: 'Executive', supervisor_id: null, insert_order: 1 }, // ID 1
    { email: 'supervisor@company.com', name: 'Sam Supervisor', role: 'SUPERVISOR' as UserRole, department: 'Sales', supervisor_id: 1, insert_order: 2 }, // ID 2. Supervisado por ID 1 (Manager)
    { email: 'hr@company.com', name: 'Holly HR', role: 'HR' as UserRole, department: 'HR', supervisor_id: 1, insert_order: 3 }, // ID 3. Supervisado por ID 1 (Manager)
    { email: 'payroll@company.com', name: 'Peter Payroll', role: 'PAYROLL' as UserRole, department: 'Finance', supervisor_id: 1, insert_order: 4 }, // ID 4. Supervisado por ID 1 (Manager)
    { email: 'employee@company.com', name: 'Emma Employee', role: 'EMPLOYEE' as UserRole, department: 'Sales', supervisor_id: 2, insert_order: 5 }, // ID 5. Supervisado por ID 2 (Supervisor)
];

// Ordenar por la lógica de inserción para mejor claridad, aunque PRAGMA lo soluciona
demoUsers.sort((a, b) => a.insert_order - b.insert_order);


async function seedDatabase() {
    console.log("🟡 Starting database seeding...");
    
    const db = getDatabase();
    
    try {
        // 1. DESACTIVAR LA RESTRICCIÓN DE LLAVE FORÁNEA
        db.exec('PRAGMA foreign_keys = OFF;');
        console.log("⚠️ Foreign key checks temporarily disabled for seeding.");
        
        // 2. Generar el hash de la contraseña
        const rawPassword = "password123";
        const hashedPassword = await hashPassword(rawPassword);
        
        // 3. Preparar la inserción
        const insert = db.prepare(`
            INSERT OR REPLACE INTO users 
            (email, password, name, role, department, supervisor_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        // Ejecutar la transacción
        const insertMany = db.transaction((users) => {
            for (const user of users) {
                insert.run(
                    user.email,
                    hashedPassword,
                    user.name,
                    user.role,
                    user.department,
                    user.supervisor_id
                );
            }
        });

        insertMany(demoUsers);
        
        console.log(`✅ Successfully seeded ${demoUsers.length} users.`);
        console.log(`🔑 Login Password for all: ${rawPassword}`);
        
    } catch (e) {
        console.error("❌ Seeding failed:", e);
    } finally {
        // 4. REACTIVAR LA RESTRICCIÓN DE LLAVE FORÁNEA
        db.exec('PRAGMA foreign_keys = ON;');
        console.log("✅ Foreign key checks re-enabled.");
        
        closeDatabase();
        console.log("Database connection closed.");
    }
}

seedDatabase().catch(console.error);