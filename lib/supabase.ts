import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client ini AMAN digunakan di browser (Client Components).
// Akses data akan dibatasi oleh Row Level Security (RLS) di Supabase.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client ini KHUSUS SERVER (API Routes, Server Actions, Auth).
// Kunci ini mengabaikan (bypass) RLS. JANGAN PERNAH gunakan di sisi Client!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
