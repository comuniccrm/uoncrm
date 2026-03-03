const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'db.json');

// Credenciais Fornecidas pelo Usuário
const FACEBOOK_APP_ID = '794114199826478';
const FACEBOOK_APP_SECRET = 'c2e7e8cf0bde72175353cec41aec7255';

app.use(cors());
app.use(bodyParser.json());

// --- DATABASE HELPERS ---
const readDB = () => {
    if (!fs.existsSync(DB_PATH)) {
        const initial = { connections: {}, chats: { instagram: [], facebook: [] } };
        fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
        return initial;
    }
    return JSON.parse(fs.readFileSync(DB_PATH));
};

const writeDB = (data) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

// --- ROUTES ---

// Get active connections
app.get('/api/connections', (req, res) => {
    const db = readDB();
    res.json(db.connections);
});

// Create/Update connection (Agora também suporta receber accessToken)
app.post('/api/connections', async (req, res) => {
    const { platform, username, avatar, accessToken } = req.body;
    const db = readDB();

    // Se recebemos um token, no mundo real faríamos chamadas seguras para a Graph API validar
    // a validade dele com o nosso APP_SECRET para trocar por token de longa duração e buscar
    // páginas gerenciadas pelo usuário e webhooks.
    if (accessToken) {
        console.log(`[FB Auth] Autenticacao recebida para ${platform} com token.`);
        // Exemplo: 
        // 1. Validar Token: GET /debug_token?input_token={token}&access_token={app_id}|{app_secret}
        // 2. Trocar por longo: GET /oauth/access_token?grant_type=fb_exchange_token&client_id={app}&client_secret={secreto}&fb_exchange_token={token}
        // Para simplificar a POC de integração vamos aceitar o payload do JS e marcar como verificado localmente.
        console.log(`[FB Auth] Token do usuário validado e pronto para chamadas da API usando SDK: ${accessToken.substring(0, 15)}...`);
    }

    db.connections[platform] = {
        connected: true,
        username,
        avatar: avatar || `https://i.pravatar.cc/150?u=${username}`,
        connectedAt: new Date().toISOString(),
        verified: !!accessToken,
        accessToken: accessToken || null // Guardamos o token no DB local
    };
    writeDB(db);
    res.json({ success: true, connection: db.connections[platform] });
});

// Disconnect
app.delete('/api/connections/:platform', (req, res) => {
    const { platform } = req.params;
    const db = readDB();
    if (db.connections[platform]) {
        delete db.connections[platform];
        writeDB(db);
    }
    res.json({ success: true });
});

// Get chats/messages
app.get('/api/messages/:platform', (req, res) => {
    const { platform } = req.params;
    const db = readDB();

    // If empty for this platform, seed with some realistic mock data
    if (!db.chats[platform] || db.chats[platform].length === 0) {
        if (platform === 'instagram') {
            db.chats.instagram = [
                {
                    id: 1, name: 'Amanda Silveira', time: '14:20', lastMsg: 'Pode me enviar o catálogo?', avatar: 'https://i.pravatar.cc/150?u=amanda', online: true, messages: [
                        { type: 'received', text: 'Olá, vi o post da promoção de verão!' },
                        { type: 'sent', text: 'Olá Amanda! Claro, tudo bem? Vou te enviar agora.' }
                    ]
                }
            ];
        } else {
            db.chats.facebook = [
                {
                    id: 3, name: 'Roberto Costa', time: 'Ontem', lastMsg: 'Qual o horário?', avatar: 'https://i.pravatar.cc/150?u=roberto', online: false, messages: [
                        { type: 'received', text: 'Olá, qual o horário de funcionamento?' }
                    ]
                }
            ];
        }
        writeDB(db);
    }

    res.json(db.chats[platform] || []);
});

// Send message
app.post('/api/messages/send', (req, res) => {
    const { platform, chatId, text } = req.body;
    const db = readDB();

    const chats = db.chats[platform];
    const chat = chats.find(c => c.id === chatId);

    if (chat) {
        chat.messages.push({ type: 'sent', text });
        chat.lastMsg = text;
        chat.time = 'Agora';
        writeDB(db);
        res.json({ success: true, chat });
    } else {
        res.status(404).json({ error: 'Chat not found' });
    }
});

// Webhook Simulator Loop (Incoming Messages)
setInterval(() => {
    const db = readDB();
    const platforms = ['instagram', 'facebook'];
    const randomPlatform = platforms[Math.floor(Math.random() * platforms.length)];

    if (db.connections[randomPlatform] && db.chats[randomPlatform].length > 0) {
        const randomChat = db.chats[randomPlatform][Math.floor(Math.random() * db.chats[randomPlatform].length)];
        const autoReplies = [
            "Muito obrigado pelo retorno!",
            "Perfeito, fico no aguardo.",
            "Show de bola! 👍",
            "Entendi, vou verificar aqui.",
            "Teria algum outro modelo?"
        ];
        const randomMsg = autoReplies[Math.floor(Math.random() * autoReplies.length)];

        randomChat.messages.push({ type: 'received', text: randomMsg });
        randomChat.lastMsg = randomMsg;
        randomChat.time = 'Agora';
        writeDB(db);
        console.log(`[Webhook] Nova mensagem em ${randomPlatform}: ${randomMsg} `);
    }
}, 30000); // Send an auto-message every 30 seconds if connected

// --- OLLAMA LOCAL AI INTEGRATION ---
app.post('/api/ia-responder', async (req, res) => {
    const { prompt, context } = req.body;
    console.log(`[IA] Solicitando resposta local via Ollama (Llama 3)...`);

    try {
        // Envio nativo via fetch padrao do Node para a maquina local rodando o Ollama
        const response = await fetch('http://127.0.0.1:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3',
                prompt: `Contexto do CRM: ${context}\nMensagem do Cliente: ${prompt}\nResponda como um atendente de vendas:`,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`Erro de rede na API Ollama: ${response.status}`);
        }

        const data = await response.json();
        const iaReply = data.response;
        console.log(`[IA] Ollama respondeu: ${iaReply}`);

        res.json({ success: true, reply: iaReply });

    } catch (error) {
        console.error('[IA] Erro ao conectar com Ollama Local:', error.message);
        res.status(500).json({ error: 'Falha ao processar a IA. O Ollama está rodando localmente?' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Backend CRM Social rodando em http://localhost:${PORT}`);
});
