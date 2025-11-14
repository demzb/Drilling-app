import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://djvrvcgwmfzgszkcenbo.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqdnJ2Y2d3bWZ6Z3N6a2NlbmJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNDU4NTMsImV4cCI6MjA3ODcyMTg1M30.XXeMDgjkUEZQkHb97mxcQ_e8S0E7HVRzIKn057ruPTI";

export const supabase = createClient(supabaseUrl, supabaseKey);
