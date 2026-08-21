/**
 * Supabase Database Connection for "ADVRetail"
 * 
 * Instructions to connect your Supabase account:
 * 1. Log in to your Supabase Dashboard: https://supabase.com
 * 2. Select or create your project: "ADVRetail"
 * 3. Go to Project Settings -> API (under Infrastructure)
 * 4. Copy the "Project URL" and paste it in `SUPABASE_URL` below.
 * 5. Copy the "anon" / "public" API Key and paste it in `SUPABASE_ANON_KEY` below.
 */

const SUPABASE_URL = 'https://mphowsnsdjdcefcsggva.supabase.co'; // Replace with your Supabase Project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1waG93c25zZGpkY2VmY3NnZ3ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NDEwNzksImV4cCI6MjA5NjQxNzA3OX0.wXBLFkLVZc8Xa0R8h3ypxURhUjjhv_3w1kTF3bjXbFs'; // Replace with your Supabase Anon API Key

// Initialize the Supabase Client
let supabaseClient = null;

if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('%c[Supabase]%c Client initialized for "ADVRetail". Ready to connect!', 'color: #3ecf8e; font-weight: bold;', 'color: inherit;');
} else {
    console.error('Supabase library has not loaded yet. Please ensure the CDN script is included in index.html before this script.');
}

// Expose supabaseClient globally for easy usage across pages/modules
window.supabaseClient = supabaseClient;
