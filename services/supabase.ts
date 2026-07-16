import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hsxwsqfrjfbqlbjlrnpz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzeHdzcWZyamZicWxiamxybnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMDI5NTAsImV4cCI6MjA5OTc3ODk1MH0.iEgGWAMeT9zh5c0_kZkjmI9fQdTJjTucJX5uX047kEE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
