import { createClient } from "@supabase/supabase-js";

// Use the public anonymous key for all frontend requests.
// This key is safe to be exposed in a browser environment.
const SUPABASE_URL = "https://djvrvcgwmfzgszkcenbo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqdnJ2Y2d3bWZ6Z3N6a2NlbmJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNDU4NTMsImV4cCI6MjA3ODcyMTg1M30.XXeMDgjkUEZQkHb97mxcQ_e8S0E7HVRzIKn057ruPTI";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;