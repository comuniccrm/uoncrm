const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Credenciais (Recomendado usar variáveis de ambiente na Vercel)
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || '794114199826478';
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || 'c2e7e8cf0bde72175353cec41aec7255';

app.use(cors());
app.use(bodyParser.json());

// --- MOCK DATABASE (IN-MEMORY FOR SERVERLESS) ---
// Nota: Em serverless, isso reseta a cada nova instância da função.
let db = {
    connections: {},
    chats: {
        instagram: [
            {
                id: 1, name: 'Amanda Silveira', time: '14:20', lastMsg: 'Pode me enviar o catálogo?', avatar: 'https://i.pravatar.cc/150?u=amanda', online: true, messages: [
                    { type: 'received', text: 'Olá, vi o post da promoção de verão!' },
                    { type: 'sent', text: 'Olá Amanda! Claro, tudo bem? Vou te enviar agora.' }
                ]
            }
        ],
        facebook: [
            {
                id: 3, name: 'Roberto Costa', time: 'Ontem', lastMsg: 'Qual o horário?', avatar: 'https://i.pravatar.cc/150?u=roberto', online: false, messages: [
                    { type: 'received', text: 'Olá, qual o horário de funcionamento?' }
                ]
            }
        ]
    }
};

// --- ROUTES ---

app.get('/api/connections', (req, res) => {
    res.json(db.connections);
});

app.post('/api/connections', async (req, res) => {
    const { platform, username, avatar, accessToken } = req.body;

    if (accessToken) {
        console.log(`[FB Auth] Autenticacao recebida para ${platform} com token.`);
    }

    db.connections[platform] = {
        connected: true,
        username,
        avatar: avatar || `https://i.pravatar.cc/150?u=${username}`,
        connectedAt: new Date().toISOString(),
        verified: !!accessToken,
        accessToken: accessToken || null
    };
    res.json({ success: true, connection: db.connections[platform] });
});

app.delete('/api/connections/:platform', (req, res) => {
    const { platform } = req.params;
    if (db.connections[platform]) {
        delete db.connections[platform];
    }
    res.json({ success: true });
});

app.get('/api/messages/:platform', (req, res) => {
    const { platform } = req.params;
    res.json(db.chats[platform] || []);
});

app.post('/api/messages/send', (req, res) => {
    const { platform, chatId, text } = req.body;
    const chats = db.chats[platform];
    const chat = chats ? chats.find(c => c.id === chatId) : null;

    if (chat) {
        chat.messages.push({ type: 'sent', text });
        chat.lastMsg = text;
        chat.time = 'Agora';
        res.json({ success: true, chat });
    } else {
        res.status(404).json({ error: 'Chat not found' });
    }
});

app.post('/api/ia-responder', async (req, res) => {
    const { prompt, context } = req.body;
    console.log(`[IA] Solicitando resposta (Simulada para Serverless sem Ollama Local)...`);

    // Nota: Como o Ollama é local (127.0.0.1:11434), ele NÃO funcionará na Vercel Cloud.
    // Aqui deveríamos usar uma API externa (OpenAI, Anthropic, etc).
    // Vou retornar uma resposta simulada amigável.

    const simulatedReply = "Olá! Sou o assistente de IA do CRM. No momento estou em modo de demonstração na nuvem. Como posso ajudar?";
    res.json({ success: true, reply: simulatedReply });
});

module.exports = app;
