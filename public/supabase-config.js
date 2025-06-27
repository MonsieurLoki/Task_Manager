// Configuration Supabase
const SUPABASE_URL = 'https://woviwpzknpefsafzzurk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvdml3cHprbnBlZnNhZnp6dXJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTU4MDAsImV4cCI6MjA2NjQzMTgwMH0.cPcUH5DqMHpYau3pREzc4Gt2ElQSH-Q88jbkJPx6d5M';

// Initialisation du client Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); 