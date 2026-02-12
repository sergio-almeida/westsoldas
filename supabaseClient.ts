import { createClient } from '@supabase/supabase-js';

/**
 * CONFIGURAÇÃO DO SUPABASE - WestSoldas Pro
 * 
 * IMPORTANTE: Use apenas a chave "anon" "public" aqui.
 */

const supabaseUrl = 'https://rikyekcueqwkxtnfojwx.supabase.co'; 

// Chave Anon Public fornecida para acesso via navegador
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpa3lla2N1ZXF3a3h0bmZvand4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4Njk2MDMsImV4cCI6MjA4NjQ0NTYwM30.QkCmagog8WTidsCIva4ywp8Ol-rk9bP3svT3VbTDE_w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);