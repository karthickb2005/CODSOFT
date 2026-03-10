const { createClient } = require('@supabase/supabase-js');

// These will be loaded from process.env (Vercel Environment Variables)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('✖ MISSING SUPABASE CREDENTIALS. Please set SUPABASE_URL and SUPABASE_ANON_KEY in environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = supabase;
