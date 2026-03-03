/**
 * Authentication management for CRM
 */

// Helper to prevent hanging calls
const withTimeout = (promise, ms = 10000) => {
    const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Tempo de resposta excedido (Timeout)')), ms)
    );
    return Promise.race([promise, timeout]);
};

function checkInit() {
    if (!supabase && typeof initSupabase === 'function') {
        initSupabase();
    }
    return supabase;
}

async function checkSession() {
    const client = checkInit();
    if (!client) return null;

    try {
        const { data: { session }, error } = await withTimeout(client.auth.getSession());

        if (error) {
            console.error('Erro ao verificar sessão:', error.message);
            return null;
        }

        return session;
    } catch (err) {
        console.error('Erro/Timeout ao verificar sessão:', err.message);
        return null;
    }
}

async function signUp(email, password, metadata = {}) {
    const client = checkInit();
    if (!client) throw new Error('Supabase não inicializado');

    return await client.auth.signUp({
        email,
        password,
        options: {
            data: metadata
        }
    });
}

async function signIn(email, password) {
    const client = checkInit();
    if (!client) throw new Error('Supabase não inicializado');

    return await client.auth.signInWithPassword({
        email,
        password
    });
}

async function signOut() {
    const client = checkInit();
    if (!client) return { error: new Error('Supabase não inicializado') };

    const { error } = await client.auth.signOut();
    if (!error) {
        window.location.href = 'login.html';
    }
    return { error };
}

// Redirect if not authenticated (should be called on protected pages)
async function requireAuth() {
    const session = await checkSession();
    if (!session) {
        window.location.href = 'login.html';
        return null;
    }
    return session;
}

// Redirect to dashboard if already authenticated (should be called on login page)
async function redirectIfAuth() {
    try {
        const session = await checkSession();
        if (session) {
            window.location.href = 'index.html';
        }
    } catch (err) {
        console.error('Falha no redirecionamento preventivo:', err);
    }
}
