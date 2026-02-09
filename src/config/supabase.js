import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://xorwukhufqdzoqaygzgd.supabase.co';
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhvcnd1a2h1ZnFkem9xYXlnemdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5OTE2NDAsImV4cCI6MjA4MzU2NzY0MH0.BUjQwopzRkWwfbyRqP-uA4uurD4NByS6yU4zQc7pxuo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
