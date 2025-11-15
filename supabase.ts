import { createClient } from "@supabase/supabase-js";

// IMPORTANT: Replace with your actual Supabase Project URL and Anon Key
const SUPABASE_URL = "https://xpptkbuqkajtewlwmdsh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwcHRrYnVxa2FqdGV3bHdtZHNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTUxOTAsImV4cCI6MjA3ODc3MTE5MH0.9x8btfBy3J-Tz6m1R_1HAKBfV2tei-c6AZpaOfZCiRU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;