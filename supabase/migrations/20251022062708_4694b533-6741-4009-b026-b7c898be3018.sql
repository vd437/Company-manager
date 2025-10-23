-- Add discount and tax fields to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS discount numeric DEFAULT 0 CHECK (discount >= 0 AND discount <= 100),
ADD COLUMN IF NOT EXISTS tax numeric DEFAULT 0 CHECK (tax >= 0 AND tax <= 100),
ADD COLUMN IF NOT EXISTS product_number text;

-- Create unique product numbers for existing products
UPDATE public.products 
SET product_number = 'PRD-' || LPAD(id::text, 6, '0')
WHERE product_number IS NULL;

-- Add unique transaction number to sales table
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS transaction_number text;

-- Create unique transaction numbers for existing sales
UPDATE public.sales 
SET transaction_number = 'TXN-' || TO_CHAR(date, 'YYYYMMDD') || '-' || LPAD(SUBSTR(id::text, 1, 6), 6, '0')
WHERE transaction_number IS NULL;

-- Create a function to auto-generate product numbers
CREATE OR REPLACE FUNCTION public.generate_product_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.product_number IS NULL THEN
    NEW.product_number := 'PRD-' || LPAD(NEW.id::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Create a function to auto-generate transaction numbers
CREATE OR REPLACE FUNCTION public.generate_transaction_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transaction_number IS NULL THEN
    NEW.transaction_number := 'TXN-' || TO_CHAR(NEW.date, 'YYYYMMDD') || '-' || LPAD(SUBSTR(NEW.id::text, 1, 6), 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Create triggers
DROP TRIGGER IF EXISTS set_product_number ON public.products;
CREATE TRIGGER set_product_number
  BEFORE INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_product_number();

DROP TRIGGER IF EXISTS set_transaction_number ON public.sales;
CREATE TRIGGER set_transaction_number
  BEFORE INSERT ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_transaction_number();

-- Create company_settings table for storing company info
CREATE TABLE IF NOT EXISTS public.company_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name text NOT NULL DEFAULT 'شركتي',
  logo_url text,
  address text,
  phone text,
  email text,
  tax_number text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on company_settings
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Policies for company_settings
CREATE POLICY "Anyone can view company settings"
  ON public.company_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage company settings"
  ON public.company_settings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default company settings if none exist
INSERT INTO public.company_settings (company_name)
SELECT 'شركتي'
WHERE NOT EXISTS (SELECT 1 FROM public.company_settings);