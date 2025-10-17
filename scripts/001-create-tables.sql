-- Users table with role-based access
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('EMPLOYEE', 'SUPERVISOR', 'MANAGER', 'HR', 'PAYROLL')),
  department TEXT,
  supervisor_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supervisor_id) REFERENCES users(id)
);

-- Absence requests table
CREATE TABLE IF NOT EXISTS absence_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  request_type TEXT NOT NULL CHECK(request_type IN ('VACATION', 'SICK_LEAVE', 'PERSONAL', 'UNPAID', 'OTHER')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'APPROVED', 'DECLINED', 'CANCELLED')),
  current_approval_stage TEXT NOT NULL DEFAULT 'SUPERVISOR' CHECK(current_approval_stage IN ('SUPERVISOR', 'MANAGER', 'HR', 'PAYROLL', 'COMPLETED')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES users(id)
);

-- Approval history table to track the workflow
CREATE TABLE IF NOT EXISTS approval_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL,
  approver_id INTEGER NOT NULL,
  approval_stage TEXT NOT NULL CHECK(approval_stage IN ('SUPERVISOR', 'MANAGER', 'HR')),
  action TEXT NOT NULL CHECK(action IN ('APPROVED', 'DECLINED')),
  comments TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES absence_requests(id),
  FOREIGN KEY (approver_id) REFERENCES users(id)
);

-- Notifications table for tracking pending approvals
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  request_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (request_id) REFERENCES absence_requests(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_absence_requests_employee ON absence_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_absence_requests_status ON absence_requests(status);
CREATE INDEX IF NOT EXISTS idx_absence_requests_stage ON absence_requests(current_approval_stage);
CREATE INDEX IF NOT EXISTS idx_approval_history_request ON approval_history(request_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
