// Configuration Supabase
const SUPABASE_URL = 'https://aryrnwxbxngplxaprema.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyeXJud3hieG5ncGx4YXByZW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MDgwNzAsImV4cCI6MjA2NjE4NDA3MH0.YY9D2AdzWSqpVbYofTy_uEBfa0zzF4zZtlKtrupruq8';

// Initialisation du client Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); 