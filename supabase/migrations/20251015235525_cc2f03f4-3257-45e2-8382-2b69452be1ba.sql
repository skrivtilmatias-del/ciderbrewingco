-- Add more detailed supplier information columns
ALTER TABLE public.suppliers
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS tax_id text,
ADD COLUMN IF NOT EXISTS primary_contact_name text,
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS payment_net_days integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS rating integer CHECK (rating >= 1 AND rating <= 5);

-- Add comment for documentation
COMMENT ON COLUMN public.suppliers.email IS 'Supplier primary email address';
COMMENT ON COLUMN public.suppliers.phone IS 'Supplier primary phone number';
COMMENT ON COLUMN public.suppliers.address IS 'Physical or mailing address';
COMMENT ON COLUMN public.suppliers.website IS 'Company website URL';
COMMENT ON COLUMN public.suppliers.tax_id IS 'Tax ID or business registration number';
COMMENT ON COLUMN public.suppliers.primary_contact_name IS 'Name of primary contact person';
COMMENT ON COLUMN public.suppliers.category IS 'Supplier category (e.g., Apple Grower, Equipment, Packaging)';
COMMENT ON COLUMN public.suppliers.payment_net_days IS 'Payment terms in days (e.g., Net 30)';
COMMENT ON COLUMN public.suppliers.rating IS 'Supplier performance rating (1-5 stars)';