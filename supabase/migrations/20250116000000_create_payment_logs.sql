-- Create payment_logs table to track all payment attempts
CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  funnel_type TEXT NOT NULL, -- 'checkout', 'render-upsell', 'full-upsell', 'books-upsell', 'books-downsell'
  status TEXT NOT NULL, -- 'success', 'failed', 'pending'
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_intent_id TEXT,
  payment_method_id TEXT,
  customer_id TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payment_logs_email ON payment_logs(email);
CREATE INDEX IF NOT EXISTS idx_payment_logs_funnel_type ON payment_logs(funnel_type);
CREATE INDEX IF NOT EXISTS idx_payment_logs_status ON payment_logs(status);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON payment_logs(created_at DESC);

-- Create table to track tier completion status per user
CREATE TABLE IF NOT EXISTS user_tier_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  checkout_completed BOOLEAN DEFAULT FALSE,
  render_upsell_completed BOOLEAN DEFAULT FALSE,
  full_upsell_completed BOOLEAN DEFAULT FALSE,
  books_upsell_completed BOOLEAN DEFAULT FALSE,
  books_downsell_completed BOOLEAN DEFAULT FALSE,
  total_amount_paid DECIMAL(10, 2) DEFAULT 0,
  last_payment_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for email lookup
CREATE INDEX IF NOT EXISTS idx_user_tier_status_email ON user_tier_status(email);

-- Enable RLS (Row Level Security)
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tier_status ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to access payment logs
DROP POLICY IF EXISTS "Service role can access payment_logs" ON payment_logs;
CREATE POLICY "Service role can access payment_logs" 
ON payment_logs FOR ALL 
USING (auth.role() = 'service_role');

-- Create policy to allow anon role to insert payment logs (for frontend logging)
DROP POLICY IF EXISTS "Allow anon insert payment_logs" ON payment_logs;
CREATE POLICY "Allow anon insert payment_logs" 
ON payment_logs FOR INSERT 
WITH CHECK (true);

-- Create policy to allow service role to access user tier status
DROP POLICY IF EXISTS "Service role can access user_tier_status" ON user_tier_status;
CREATE POLICY "Service role can access user_tier_status" 
ON user_tier_status FOR ALL 
USING (auth.role() = 'service_role');

-- Function to update user tier status when payment succeeds
CREATE OR REPLACE FUNCTION update_user_tier_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'success' THEN
    INSERT INTO user_tier_status (email, total_amount_paid, last_payment_at)
    VALUES (NEW.email, NEW.amount, NEW.created_at)
    ON CONFLICT (email) 
    DO UPDATE SET
      checkout_completed = CASE WHEN NEW.funnel_type = 'checkout' THEN TRUE ELSE user_tier_status.checkout_completed END,
      render_upsell_completed = CASE WHEN NEW.funnel_type = 'render-upsell' THEN TRUE ELSE user_tier_status.render_upsell_completed END,
      full_upsell_completed = CASE WHEN NEW.funnel_type = 'full-upsell' THEN TRUE ELSE user_tier_status.full_upsell_completed END,
      books_upsell_completed = CASE WHEN NEW.funnel_type = 'books-upsell' THEN TRUE ELSE user_tier_status.books_upsell_completed END,
      books_downsell_completed = CASE WHEN NEW.funnel_type = 'books-downsell' THEN TRUE ELSE user_tier_status.books_downsell_completed END,
      total_amount_paid = user_tier_status.total_amount_paid + NEW.amount,
      last_payment_at = NEW.created_at,
      updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update tier status
DROP TRIGGER IF EXISTS trigger_update_user_tier_status ON payment_logs;
CREATE TRIGGER trigger_update_user_tier_status
AFTER INSERT ON payment_logs
FOR EACH ROW
EXECUTE FUNCTION update_user_tier_status();

-- Function to get payment logs with tier status (for admin)
CREATE OR REPLACE FUNCTION get_payment_logs_admin(p_auth_pass TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  funnel_type TEXT,
  status TEXT,
  amount NUMERIC,
  currency TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  checkout_completed BOOLEAN,
  render_upsell_completed BOOLEAN,
  full_upsell_completed BOOLEAN,
  books_upsell_completed BOOLEAN,
  books_downsell_completed BOOLEAN,
  total_amount_paid NUMERIC
) AS $$
BEGIN
  IF p_auth_pass != 'Robbin#15' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  RETURN QUERY
  SELECT 
    pl.id,
    pl.email,
    pl.funnel_type,
    pl.status,
    pl.amount,
    pl.currency,
    pl.error_message,
    pl.created_at,
    COALESCE(uts.checkout_completed, FALSE),
    COALESCE(uts.render_upsell_completed, FALSE),
    COALESCE(uts.full_upsell_completed, FALSE),
    COALESCE(uts.books_upsell_completed, FALSE),
    COALESCE(uts.books_downsell_completed, FALSE),
    COALESCE(uts.total_amount_paid, 0)
  FROM payment_logs pl
  LEFT JOIN user_tier_status uts ON pl.email = uts.email
  ORDER BY pl.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
