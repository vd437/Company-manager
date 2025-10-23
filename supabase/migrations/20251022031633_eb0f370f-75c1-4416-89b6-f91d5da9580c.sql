-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'cashier', 'manager');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create employees table
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  notes TEXT,
  shift_start TIME,
  shift_end TIME,
  base_salary DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on employees
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- RLS policies for employees
CREATE POLICY "Admins can manage all employees"
ON public.employees
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Employees can view their own profile"
ON public.employees
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Employees can update their own profile"
ON public.employees
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create attendance_logs table
CREATE TABLE public.attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  clock_in TIMESTAMPTZ NOT NULL DEFAULT now(),
  clock_out TIMESTAMPTZ,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on attendance_logs
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for attendance_logs
CREATE POLICY "Admins can manage all attendance logs"
ON public.attendance_logs
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Employees can view their own attendance"
ON public.attendance_logs
FOR SELECT
TO authenticated
USING (
  employee_id IN (
    SELECT id FROM public.employees WHERE user_id = auth.uid()
  )
);

-- Create salary_adjustments table
CREATE TABLE public.salary_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  adjustment_amount DECIMAL(10, 2) NOT NULL,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('bonus', 'deduction', 'salary_change')),
  reason TEXT,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on salary_adjustments
ALTER TABLE public.salary_adjustments ENABLE ROW LEVEL SECURITY;

-- RLS policies for salary_adjustments
CREATE POLICY "Admins can manage all salary adjustments"
ON public.salary_adjustments
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Employees can view their own adjustments"
ON public.salary_adjustments
FOR SELECT
TO authenticated
USING (
  employee_id IN (
    SELECT id FROM public.employees WHERE user_id = auth.uid()
  )
);

-- Create storage bucket for employee avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-avatars', 'employee-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for employee avatars
CREATE POLICY "Public can view employee avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'employee-avatars');

CREATE POLICY "Admins can upload employee avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'employee-avatars' 
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update employee avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'employee-avatars' 
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete employee avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'employee-avatars' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Create function to update employees updated_at
CREATE OR REPLACE FUNCTION public.update_employee_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for employees updated_at
CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.update_employee_updated_at();

-- Function to automatically log clock-in when user logs in
CREATE OR REPLACE FUNCTION public.auto_clock_in()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  emp_id UUID;
  existing_log UUID;
BEGIN
  -- Get employee id
  SELECT id INTO emp_id FROM public.employees WHERE user_id = NEW.id;
  
  IF emp_id IS NOT NULL THEN
    -- Check if there's already a clock-in for today without clock-out
    SELECT id INTO existing_log 
    FROM public.attendance_logs 
    WHERE employee_id = emp_id 
      AND date = CURRENT_DATE 
      AND clock_out IS NULL;
    
    -- Only create new log if none exists for today
    IF existing_log IS NULL THEN
      INSERT INTO public.attendance_logs (employee_id, date)
      VALUES (emp_id, CURRENT_DATE);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;