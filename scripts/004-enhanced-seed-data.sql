-- Adding comprehensive seed data for all roles with realistic scenarios

-- Clear existing data
DELETE FROM approval_history;
DELETE FROM notifications;
DELETE FROM absence_requests;
DELETE FROM users;

-- Insert users for each role
INSERT INTO users (email, password, name, role, department) VALUES
  -- Employees
  ('maria.garcia@iristalent.com', '$2a$10$rKZvVxZ5xKZvVxZ5xKZvVe', 'Maria Garcia', 'EMPLOYEE', 'Engineering'),
  ('carlos.rodriguez@iristalent.com', '$2a$10$rKZvVxZ5xKZvVxZ5xKZvVe', 'Carlos Rodriguez', 'EMPLOYEE', 'Engineering'),
  ('ana.martinez@iristalent.com', '$2a$10$rKZvVxZ5xKZvVxZ5xKZvVe', 'Ana Martinez', 'EMPLOYEE', 'Sales'),
  ('luis.hernandez@iristalent.com', '$2a$10$rKZvVxZ5xKZvVxZ5xKZvVe', 'Luis Hernandez', 'EMPLOYEE', 'Marketing'),
  
  -- Supervisors
  ('sofia.lopez@iristalent.com', '$2a$10$rKZvVxZ5xKZvVxZ5xKZvVe', 'Sofia Lopez', 'SUPERVISOR', 'Engineering'),
  ('diego.gonzalez@iristalent.com', '$2a$10$rKZvVxZ5xKZvVxZ5xKZvVe', 'Diego Gonzalez', 'SUPERVISOR', 'Sales'),
  
  -- Managers
  ('roberto.sanchez@iristalent.com', '$2a$10$rKZvVxZ5xKZvVxZ5xKZvVe', 'Roberto Sanchez', 'MANAGER', 'Operations'),
  ('patricia.ramirez@iristalent.com', '$2a$10$rKZvVxZ5xKZvVxZ5xKZvVe', 'Patricia Ramirez', 'MANAGER', 'Operations'),
  
  -- HR
  ('laura.torres@iristalent.com', '$2a$10$rKZvVxZ5xKZvVxZ5xKZvVe', 'Laura Torres', 'HR', 'Human Resources'),
  ('miguel.flores@iristalent.com', '$2a$10$rKZvVxZ5xKZvVxZ5xKZvVe', 'Miguel Flores', 'HR', 'Human Resources'),
  
  -- Payroll
  ('carmen.rivera@iristalent.com', '$2a$10$rKZvVxZ5xKZvVxZ5xKZvVe', 'Carmen Rivera', 'PAYROLL', 'Finance'),
  ('fernando.cruz@iristalent.com', '$2a$10$rKZvVxZ5xKZvVxZ5xKZvVe', 'Fernando Cruz', 'PAYROLL', 'Finance');

-- Assign supervisors to employees
UPDATE users SET supervisor_id = 5 WHERE id IN (1, 2); -- Engineering employees -> Sofia
UPDATE users SET supervisor_id = 6 WHERE id = 3; -- Sales employee -> Diego
UPDATE users SET supervisor_id = 5 WHERE id = 4; -- Marketing employee -> Sofia

-- Insert various absence requests at different stages

-- 1. Pending requests at Supervisor level
INSERT INTO absence_requests (
  employee_id, request_type, start_date, end_date, total_days, 
  hours_per_day, paid_days, unpaid_days, reason, status, current_approval_stage
) VALUES
  (1, 'VACATION', '2025-03-15', '2025-03-19', 5, 8, 5, 0, 
   'Spring vacation with family', 'PENDING', 'SUPERVISOR'),
  (2, 'SICK_LEAVE', '2025-02-20', '2025-02-21', 2, 8, 2, 0,
   'Medical appointment and recovery', 'PENDING', 'SUPERVISOR'),
  (3, 'PERSONAL_DAY', '2025-02-25', '2025-02-25', 1, 8, 1, 0,
   'Personal matters to attend', 'PENDING', 'SUPERVISOR');

-- 2. Approved by Supervisor, pending Manager approval
INSERT INTO absence_requests (
  employee_id, request_type, start_date, end_date, total_days,
  hours_per_day, paid_days, unpaid_days, reason, status, current_approval_stage
) VALUES
  (1, 'VACATION', '2025-04-10', '2025-04-14', 5, 8, 5, 0,
   'Easter holiday trip', 'PENDING', 'MANAGER'),
  (4, 'TRAINING', '2025-03-05', '2025-03-07', 3, 8, 3, 0,
   'Professional development conference', 'PENDING', 'MANAGER');

-- Add approval history for Manager-pending requests
INSERT INTO approval_history (request_id, approver_id, approval_stage, action, comments) VALUES
  (4, 5, 'SUPERVISOR', 'APPROVED', 'Approved - team coverage arranged'),
  (5, 5, 'SUPERVISOR', 'APPROVED', 'Approved - good for professional development');

-- 3. Approved by Manager, pending HR approval
INSERT INTO absence_requests (
  employee_id, request_type, start_date, end_date, total_days,
  hours_per_day, paid_days, unpaid_days, reason, status, current_approval_stage
) VALUES
  (2, 'VACATION', '2025-05-01', '2025-05-10', 10, 8, 10, 0,
   'Extended summer vacation', 'PENDING', 'HR'),
  (3, 'MATERNITY_LEAVE', '2025-06-01', '2025-08-31', 90, 8, 90, 0,
   'Maternity leave', 'PENDING', 'HR');

-- Add approval history for HR-pending requests
INSERT INTO approval_history (request_id, approver_id, approval_stage, action, comments) VALUES
  (6, 5, 'SUPERVISOR', 'APPROVED', 'Approved by supervisor'),
  (6, 7, 'MANAGER', 'APPROVED', 'Approved - adequate notice given'),
  (7, 6, 'SUPERVISOR', 'APPROVED', 'Approved - congratulations!'),
  (7, 7, 'MANAGER', 'APPROVED', 'Approved - HR to process paperwork');

-- 4. Fully approved requests (visible to Payroll)
INSERT INTO absence_requests (
  employee_id, request_type, start_date, end_date, total_days,
  hours_per_day, paid_days, unpaid_days, reason, status, current_approval_stage
) VALUES
  (1, 'SICK_LEAVE', '2025-01-15', '2025-01-17', 3, 8, 3, 0,
   'Flu recovery', 'APPROVED', 'COMPLETED'),
  (2, 'PERSONAL_DAY', '2025-01-22', '2025-01-22', 1, 8, 1, 0,
   'Family emergency', 'APPROVED', 'COMPLETED'),
  (3, 'VACATION', '2025-02-01', '2025-02-05', 5, 8, 5, 0,
   'Winter break', 'APPROVED', 'COMPLETED'),
  (4, 'UNPAID_LEAVE', '2025-01-10', '2025-01-12', 3, 8, 0, 3,
   'Personal matters - unpaid leave requested', 'APPROVED', 'COMPLETED');

-- Add complete approval history for approved requests
INSERT INTO approval_history (request_id, approver_id, approval_stage, action, comments) VALUES
  -- Request 8 (Sick leave)
  (8, 5, 'SUPERVISOR', 'APPROVED', 'Get well soon'),
  (8, 7, 'MANAGER', 'APPROVED', 'Approved'),
  (8, 9, 'HR', 'APPROVED', 'Processed'),
  -- Request 9 (Personal day)
  (9, 5, 'SUPERVISOR', 'APPROVED', 'Hope everything is okay'),
  (9, 7, 'MANAGER', 'APPROVED', 'Approved'),
  (9, 9, 'HR', 'APPROVED', 'Processed'),
  -- Request 10 (Vacation)
  (10, 6, 'SUPERVISOR', 'APPROVED', 'Enjoy your vacation'),
  (10, 7, 'MANAGER', 'APPROVED', 'Approved'),
  (10, 9, 'HR', 'APPROVED', 'Processed'),
  -- Request 11 (Unpaid leave)
  (11, 5, 'SUPERVISOR', 'APPROVED', 'Approved as unpaid leave'),
  (11, 7, 'MANAGER', 'APPROVED', 'Approved - unpaid'),
  (11, 9, 'HR', 'APPROVED', 'Processed as unpaid leave');

-- 5. Declined request example
INSERT INTO absence_requests (
  employee_id, request_type, start_date, end_date, total_days,
  hours_per_day, paid_days, unpaid_days, reason, status, current_approval_stage
) VALUES
  (4, 'VACATION', '2025-02-10', '2025-02-14', 5, 8, 5, 0,
   'Last minute vacation request', 'DECLINED', 'SUPERVISOR');

INSERT INTO approval_history (request_id, approver_id, approval_stage, action, comments) VALUES
  (12, 5, 'SUPERVISOR', 'DECLINED', 'Insufficient notice - please request at least 2 weeks in advance');

-- 6. Shift change requests
INSERT INTO absence_requests (
  employee_id, request_type, start_date, end_date, total_days,
  hours_per_day, shift_change_from, shift_change_to, reason, status, current_approval_stage
) VALUES
  (1, 'SHIFT_CHANGE', '2025-03-01', '2025-03-01', 1, 8,
   'Primer turno: 07:00 a 15:00', 'Segundo turno: 15:00 a 22:30',
   'Need to attend morning appointment', 'PENDING', 'SUPERVISOR'),
  (2, 'SHIFT_CHANGE', '2025-02-28', '2025-02-28', 1, 8,
   'Segundo turno: 15:00 a 22:30', 'Tercer turno: 22:30 a 07:00',
   'Covering for colleague', 'APPROVED', 'COMPLETED');

INSERT INTO approval_history (request_id, approver_id, approval_stage, action, comments) VALUES
  (14, 5, 'SUPERVISOR', 'APPROVED', 'Shift swap approved'),
  (14, 7, 'MANAGER', 'APPROVED', 'Approved'),
  (14, 9, 'HR', 'APPROVED', 'Processed');

-- Create notifications for pending requests
INSERT INTO notifications (user_id, request_id, message, is_read) VALUES
  -- Supervisor notifications
  (5, 1, 'New absence request from Maria Garcia', 0),
  (5, 2, 'New absence request from Carlos Rodriguez', 0),
  (6, 3, 'New absence request from Ana Martinez', 0),
  (5, 13, 'New shift change request from Maria Garcia', 0),
  -- Manager notifications
  (7, 4, 'Absence request approved by supervisor - awaiting your approval', 0),
  (7, 5, 'Absence request approved by supervisor - awaiting your approval', 0),
  -- HR notifications
  (9, 6, 'Absence request approved by manager - awaiting your approval', 0),
  (9, 7, 'Maternity leave request approved by manager - awaiting your approval', 0);
