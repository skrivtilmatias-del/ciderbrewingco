-- Add enhanced supplier tracking fields
ALTER TABLE suppliers
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS primary_contact_name text,
ADD COLUMN IF NOT EXISTS tax_id text,
ADD COLUMN IF NOT EXISTS payment_net_days integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS rating integer,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS is_preferred boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS quality_score numeric(3,1),
ADD COLUMN IF NOT EXISTS defect_rate numeric(5,2),
ADD COLUMN IF NOT EXISTS reliability_rating numeric(3,1),
ADD COLUMN IF NOT EXISTS total_spend_ytd numeric(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS on_time_delivery_rate numeric(5,2),
ADD COLUMN IF NOT EXISTS avg_lead_time_days integer,
ADD COLUMN IF NOT EXISTS organic_certified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS food_safety_certified boolean DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN suppliers.email IS 'Supplier email address';
COMMENT ON COLUMN suppliers.phone IS 'Supplier phone number';
COMMENT ON COLUMN suppliers.address IS 'Supplier physical address';
COMMENT ON COLUMN suppliers.website IS 'Supplier website URL';
COMMENT ON COLUMN suppliers.primary_contact_name IS 'Main contact person name';
COMMENT ON COLUMN suppliers.tax_id IS 'Tax ID or VAT number';
COMMENT ON COLUMN suppliers.payment_net_days IS 'Payment terms in days (e.g., Net 30)';
COMMENT ON COLUMN suppliers.category IS 'Supplier category (e.g., Apples, Bottles, etc.)';
COMMENT ON COLUMN suppliers.rating IS 'Overall supplier rating (1-5)';
COMMENT ON COLUMN suppliers.status IS 'Supplier status: active, inactive, etc.';
COMMENT ON COLUMN suppliers.is_preferred IS 'Whether this is a preferred supplier';
COMMENT ON COLUMN suppliers.quality_score IS 'Average quality score (0-10)';
COMMENT ON COLUMN suppliers.defect_rate IS 'Defect rate percentage';
COMMENT ON COLUMN suppliers.reliability_rating IS 'Reliability rating (0-10)';
COMMENT ON COLUMN suppliers.total_spend_ytd IS 'Total spend year-to-date';
COMMENT ON COLUMN suppliers.on_time_delivery_rate IS 'On-time delivery rate percentage';
COMMENT ON COLUMN suppliers.avg_lead_time_days IS 'Average lead time in days';
COMMENT ON COLUMN suppliers.organic_certified IS 'Organic certification status';
COMMENT ON COLUMN suppliers.food_safety_certified IS 'Food safety certification status';