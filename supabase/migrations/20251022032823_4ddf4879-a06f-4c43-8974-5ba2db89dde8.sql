-- Add index to improve query performance on employees table
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees(user_id);

-- Add index for attendance logs queries
CREATE INDEX IF NOT EXISTS idx_attendance_logs_employee_date ON public.attendance_logs(employee_id, date);

-- Add index for user roles lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);