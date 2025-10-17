-- Insert sample users for testing
INSERT INTO users (email, password, name, role, department) VALUES
  ('employee@company.com', '$2a$10$rKZvVxZ5xKZvVxZ5xKZvVe', 'John Employee', 'EMPLOYEE', 'Engineering'),
  ('supervisor@company.com', '$2a$10$rKZvVxZ5xKZvVxZ5xKZvVe', 'Jane Supervisor', 'SUPERVISOR', 'Engineering'),
  ('manager@company.com', '$2a$10$rKZvVxZ5xKZvVxZ5xKZvVe', 'Bob Manager', 'MANAGER', 'Operations'),
  ('hr@company.com', '$2a$10$rKZvVxZ5xKZvVxZ5xKZvVe', 'Alice HR', 'HR', 'Human Resources'),
  ('payroll@company.com', '$2a$10$rKZvVxZ5xKZvVxZ5xKZvVe', 'Charlie Payroll', 'PAYROLL', 'Finance');

-- Update employee to have supervisor
UPDATE users SET supervisor_id = 2 WHERE id = 1;

-- Insert sample absence requests
INSERT INTO absence_requests (employee_id, request_type, start_date, end_date, total_days, reason, status, current_approval_stage) VALUES
  (1, 'VACATION', '2025-02-01', '2025-02-05', 5, 'Family vacation', 'PENDING', 'SUPERVISOR'),
  (1, 'SICK_LEAVE', '2025-01-15', '2025-01-16', 2, 'Medical appointment', 'APPROVED', 'COMPLETED');

-- Insert sample approval history
INSERT INTO approval_history (request_id, approver_id, approval_stage, action, comments) VALUES
  (2, 2, 'SUPERVISOR', 'APPROVED', 'Approved by supervisor'),
  (2, 3, 'MANAGER', 'APPROVED', 'Approved by manager'),
  (2, 4, 'HR', 'APPROVED', 'Approved by HR');
