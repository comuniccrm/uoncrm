// Supabase Configuration
const SUPABASE_URL = 'https://rhkozfiwojmvygktrmej.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_qc_i_9B-QyBskuafgL6ndA_y9BRnFlN';

// Global supabase client placeholder
var supabase;

function validateSupabaseConfig() {
    if (!SUPABASE_URL || SUPABASE_URL.includes('your-project-url')) {
        console.error('SUPABASE_URL está faltando ou é inválida.');
        return false;
    }
    if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.startsWith('sb_publishable_qc_i_')) {
        console.warn('AVISO: A sua SUPABASE_ANON_KEY parece ser uma chave provisória ou incorreta. Verifique no painel do Supabase.');
    }
    return true;
}

function initSupabase() {
    if (!validateSupabaseConfig()) return;

    if (window.supabase && typeof window.supabase.createClient === 'function') {
        try {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('Supabase Client Initialized Successfully');
        } catch (err) {
            console.error('Erro ao criar cliente Supabase:', err.message);
        }
    } else {
        console.warn('Supabase SDK não encontrado. Verifique se o script foi carregado.');
    }
}

// Initialize immediately
initSupabase();
