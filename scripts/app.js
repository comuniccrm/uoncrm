// State and Initialization
const App = {
    views: {
        'inicio': renderInicioView,
        'relatorios': renderRelatoriosView,
        'conversas': renderConversasView,
        'ds-agente': renderDsAgenteView,
        'ds-voice': renderDsVoiceView,
        'negocios': renderNegociosView,
        'contatos': renderContatosView,
        'dstrack-dashboard': renderDsTrackDashboard,
        'whatsapp-web': renderWhatsAppWeb,
        'dstrack-postagens': renderDsTrackPostagens,
        'dstrack-comentarios': renderDsTrackComentarios,
        'dstrack-conexao': renderDsTrackConexao,
        'automacoes-fluxo': renderAutomacoesFluxo,
        'automacoes-conhecimento': renderAutomacoesConhecimento,
        'automacoes-config': renderAutomacoesConfig,
        'admin-saas': renderConfigAdminSaaS,
    },

    whatsappStatus: localStorage.getItem('whatsapp_connected') === 'true' ? 'connected' : 'disconnected',
    activeVoiceSection: 'mensagens',

    getPipelineColumns() {
        const defaults = [
            { id: 'entrada', name: 'Entrada / Qualificação' },
            { id: 'agendamento', name: 'Em agendamento' },
            { id: 'follow_up', name: 'Follow Up' },
            { id: 'reuniao', name: 'Reunião Agendada' },
            { id: 'no_show', name: 'No-Show' },
            { id: 'ganhou', name: 'Ganhou / Fechado' },
            { id: 'perdido', name: 'Perdido' }
        ];
        const saved = localStorage.getItem('crm_pipeline_columns');
        return saved ? JSON.parse(saved) : defaults;
    },

    savePipelineColumns(cols) { localStorage.setItem('crm_pipeline_columns', JSON.stringify(cols)); },
    getVoiceFolders() { return JSON.parse(localStorage.getItem('crm_voice_folders') || '[]'); },
    saveVoiceFolders(folders) { localStorage.setItem('crm_voice_folders', JSON.stringify(folders)); },

    init() {
        this.bindEvents();
        this.navigateTo('inicio');
        this.applyBranding();
        this.applyTheme();

        // Inicialização do SDK do Facebook
        window.fbAsyncInit = function () {
            FB.init({
                appId: '794114199826478', // ID do aplicativo fornecido
                cookie: true,
                xfbml: true,
                version: 'v19.0' // Versão atual da API Graph
            });
            console.log('Facebook SDK Inicializado com sucesso!');
        };
    },


    setWhatsAppStatus(status) {
        this.whatsappStatus = status;
        localStorage.setItem('whatsapp_connected', status === 'connected');
        if (this.views['conversas'] && document.getElementById('main-content').querySelector('.conversas-layout')) {
            this.navigateTo('conversas');
        }
    },

    bindEvents() {
        // Handle Sidebar Navigation
        const navItems = document.querySelectorAll('.nav-item, .sub-nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.getAttribute('data-view');
                if (view) {
                    this.navigateTo(view);

                    // Update Active State
                    navItems.forEach(n => n.classList.remove('active'));
                    item.classList.add('active');
                }
            });
        });

        // Group Toggles
        const groups = document.querySelectorAll('.nav-group-header');
        groups.forEach(header => {
            header.addEventListener('click', () => {
                const icon = header.querySelector('.group-toggle');
                const items = header.nextElementSibling;

                if (items.classList.contains('expanded')) {
                    items.classList.remove('expanded');
                    icon.classList.remove('ph-caret-down');
                    icon.classList.add('ph-caret-right');
                } else {
                    items.classList.add('expanded');
                    icon.classList.remove('ph-caret-right');
                    icon.classList.add('ph-caret-down');
                }
            });
        });
    },

    async navigateTo(viewId) {
        console.log('Navigating to:', viewId);
        const renderer = this.views[viewId];
        if (!renderer) return;

        const mainContent = document.getElementById('main-content');

        // Premium transition: Fade out and slide
        mainContent.style.opacity = '0';
        mainContent.style.transform = 'translateY(10px) scale(0.99)';
        mainContent.style.transition = 'opacity 0.2s ease, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

        setTimeout(async () => {
            mainContent.innerHTML = '';

            try {
                const result = renderer();
                const viewElement = result instanceof Promise ? await result : result;

                // If it's a DOM element, make sure it has the right classes
                if (viewElement instanceof HTMLElement) {
                    viewElement.classList.add('view-section', 'active');
                    mainContent.appendChild(viewElement);
                } else {
                    // Fallback for string/html content if any renderer still returns that
                    mainContent.innerHTML = result;
                }

                // Update active state in sidebar
                document.querySelectorAll('.nav-item, .sub-nav-item').forEach(item => {
                    item.classList.remove('active');
                    if (item.getAttribute('data-view') === viewId || item.href?.endsWith(viewId)) {
                        item.classList.add('active');

                        // Expand group if sub-item
                        const groupItems = item.closest('.nav-group-items');
                        if (groupItems) {
                            groupItems.classList.add('expanded');
                            const icon = groupItems.previousElementSibling?.querySelector('.group-toggle');
                            if (icon) {
                                icon.classList.replace('ph-caret-right', 'ph-caret-down');
                            }
                        }
                    }
                });

                // Smooth fade in
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        mainContent.style.opacity = '1';
                        mainContent.style.transform = 'translateY(0) scale(1)';
                    }, 50);
                });

            } catch (error) {
                mainContent.innerHTML = `<div style="padding:40px; color:red; text-align:center;">Erro ao carregar a tela: ${error.message}</div>`;
                console.error(error);
                mainContent.style.opacity = '1';
                mainContent.style.transform = 'translateY(0)';
            }
        }, 200);

        window.location.hash = viewId;
    },
};

window.setBrandColor = function (color, btnEl) {
    document.documentElement.style.setProperty('--brand-color', color);
    localStorage.setItem('crm_brand_color', color);
    if (btnEl) {
        document.querySelectorAll('.color-dot').forEach(el => el.classList.remove('active'));
        btnEl.classList.add('active');
    }
};

App.applyBranding = function () {
    const savedColor = localStorage.getItem('crm_brand_color');
    const savedLogo = localStorage.getItem('crm_brand_logo');
    const savedBrandName = localStorage.getItem('crm_brand_name') || 'SUA MARCA';

    if (savedColor) {
        document.documentElement.style.setProperty('--brand-color', savedColor);
        // Update active dot in topbar if present
        const dots = document.querySelectorAll('.color-dot');
        dots.forEach(dot => {
            const btnColor = dot.style.getPropertyValue('--btn-color').trim();
            if (btnColor.toLowerCase() === savedColor.toLowerCase()) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    if (savedLogo) {
        const logoContainer = document.getElementById('main-brand-logo');
        if (logoContainer) {
            logoContainer.innerHTML = `<img src="${savedLogo}" style="max-width: 100%; max-height: 40px; object-fit: contain;">`;
        }
    } else if (savedBrandName) {
        const logoContainer = document.getElementById('main-brand-logo');
        if (logoContainer) {
            const parts = savedBrandName.split(' ');
            const first = parts[0] || '';
            const rest = parts.slice(1).join(' ');
            logoContainer.innerHTML = `${first} <span class="brand-highlight">${rest}</span>`;
        }
    }
};

App.applyTheme = function () {
    const savedTheme = localStorage.getItem('crm_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeBtn = document.querySelector('.theme-toggle i');
    if (themeBtn) {
        themeBtn.className = savedTheme === 'dark' ? 'ph-light ph-sun' : 'ph-light ph-moon';
    }
};

window.toggleTheme = function () {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('crm_theme', newTheme);
    App.applyTheme();
};

window.showWhatsAppQrModal = function () {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'whatsapp-qr-modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <div class="modal-header">
                <h2>Conectar WhatsApp</h2>
                <button class="close-btn" onclick="document.getElementById('whatsapp-qr-modal').remove()"><i class="ph-light ph-x"></i></button>
            </div>
            <div class="modal-body" style="text-align: center; padding: 24px;">
                <p style="margin-bottom: 20px; font-size: 14px; color: var(--text-secondary);">Abra o WhatsApp no seu celular e escaneie o código abaixo.</p>
                <div id="qr-container" style="background: #f8fafc; padding: 20px; border-radius: 12px; display: inline-block; margin-bottom: 16px; border: 1px solid var(--border-color);">
                    <div class="qr-placeholder">
                        <i class="ph-light ph-qr-code" style="font-size: 48px; color: var(--text-tertiary);"></i>
                        <p style="font-size: 12px; margin-top: 8px;">Gerando QR Code...</p>
                    </div>
                </div>
                <div id="qr-status-msg" style="font-weight: 500; color: var(--brand-color);">Aguardando...</div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    setTimeout(() => {
        const qrContainer = document.getElementById('qr-container');
        if (qrContainer) {
            qrContainer.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=CRM-SIM-${Date.now()}" style="display: block;">`;
            document.getElementById('qr-status-msg').innerText = 'QR Code pronto! Escaneie agora.';
        }
    }, 1000);

    setTimeout(() => {
        const msg = document.getElementById('qr-status-msg');
        if (msg) {
            msg.innerHTML = '<i class="ph-light ph-check-circle"></i> Conectado com sucesso!';
            msg.style.color = '#10b981';
            setTimeout(() => {
                App.setWhatsAppStatus('connected');
                const modal = document.getElementById('whatsapp-qr-modal');
                if (modal) modal.remove();
            }, 1500);
        }
    }, 5000);
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// View Renderers
function renderInicioView() {
    const allContacts = window.getContacts ? window.getContacts() : [];
    const openDeals = allContacts.filter(c => c.status !== 'ganhou' && c.status !== 'perdido').length;
    const newCount = allContacts.filter(c => c.status === 'entrada').length;
    const salesTotal = allContacts.filter(c => c.status === 'ganhou').reduce((acc, c) => acc + (parseFloat(c.value) || 0), 0);
    const activeConversations = allContacts.length; // Considera todas as conversas contadas na base

    const pipelineColumns = App.getPipelineColumns();
    let pipelineHtml = '';
    pipelineColumns.forEach(c => {
        const count = allContacts.filter(contact => contact.status === c.id).length;
        const total = allContacts.length || 1;
        const percentage = Math.round((count / total) * 100);
        pipelineHtml += `
            <div class="pipeline-item">
                <div class="pipeline-info">
                    <span class="pipeline-name">${c.name}</span>
                    <span class="pipeline-count">${count} negócio${count !== 1 ? 's' : ''}</span>
                </div>
                <div class="progress-bg"><div class="progress-fill" style="width: ${percentage}%;"></div></div>
            </div>
        `;
    });

    const div = document.createElement('div');
    div.innerHTML = `
        <div class="page-header">
            <div>
                <div class="greeting">Bem-vindo de volta,</div>
                <div class="company-name">Minha Empresa</div>
            </div>
            <div class="balance-area">
                <div class="balance-text">Saldo <span class="balance-amount">R$ ${salesTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                <button class="btn-primary" onclick="window.goToAddContact()">Adicionar</button>
            </div>
        </div>
        
        <div class="dashboard-grid">
            <!-- Stats -->
            <div class="stats-row">
                <div class="stat-card" style="cursor: pointer;" onclick="App.navigateTo('conversas')">
                    <div class="stat-header">
                        <div class="stat-icon-wrapper"><i class="ph-light ph-chat-circle"></i></div>
                        <span class="stat-badge positive" style="display: none;">+0%</span>
                    </div>
                    <div class="stat-value">${activeConversations}</div>
                    <div class="stat-label">Conversas abertas</div>
                    <div class="sparkline">
                        <div class="sparkbar" style="height: 20%"></div><div class="sparkbar" style="height: 30%"></div>
                        <div class="sparkbar" style="height: 40%"></div><div class="sparkbar" style="height: 20%"></div>
                        <div class="sparkbar" style="height: 50%"></div><div class="sparkbar" style="height: 60%"></div>
                        <div class="sparkbar" style="height: 40%"></div><div class="sparkbar" style="height: 70%"></div>
                        <div class="sparkbar" style="height: 80%"></div><div class="sparkbar" style="height: 100%"></div>
                    </div>
                </div>
                <div class="stat-card" style="cursor: pointer;" onclick="App.navigateTo('negocios')">
                    <div class="stat-header">
                        <div class="stat-icon-wrapper"><i class="ph-light ph-briefcase"></i></div>
                        <span class="stat-badge positive" style="display: none;">+0%</span>
                    </div>
                    <div class="stat-value">${openDeals}</div>
                    <div class="stat-label">Negócios em aberto</div>
                    <div class="sparkline">
                        <div class="sparkbar" style="height: 30%"></div><div class="sparkbar" style="height: 40%"></div>
                        <div class="sparkbar" style="height: 20%"></div><div class="sparkbar" style="height: 50%"></div>
                        <div class="sparkbar" style="height: 40%"></div><div class="sparkbar" style="height: 60%"></div>
                        <div class="sparkbar" style="height: 50%"></div><div class="sparkbar" style="height: 70%"></div>
                        <div class="sparkbar" style="height: 60%"></div><div class="sparkbar" style="height: 80%"></div>
                    </div>
                </div>
                <div class="stat-card" style="cursor: pointer;" onclick="App.navigateTo('contatos')">
                    <div class="stat-header">
                        <div class="stat-icon-wrapper"><i class="ph-light ph-users"></i></div>
                        <span class="stat-badge positive" style="display: none;">+0%</span>
                    </div>
                    <div class="stat-value">${newCount}</div>
                    <div class="stat-label">Contatos novos</div>
                    <div class="sparkline">
                        <div class="sparkbar" style="height: 40%"></div><div class="sparkbar" style="height: 50%"></div>
                        <div class="sparkbar" style="height: 60%"></div><div class="sparkbar" style="height: 40%"></div>
                        <div class="sparkbar" style="height: 70%"></div><div class="sparkbar" style="height: 80%"></div>
                        <div class="sparkbar" style="height: 50%"></div><div class="sparkbar" style="height: 90%"></div>
                        <div class="sparkbar" style="height: 100%"></div><div class="sparkbar" style="height: 80%"></div>
                    </div>
                </div>
                <div class="stat-card" style="cursor: pointer;" onclick="App.navigateTo('relatorios')">
                    <div class="stat-header">
                        <div class="stat-icon-wrapper"><i class="ph-light ph-trend-up"></i></div>
                        <span class="stat-badge positive" style="display: none;">+0%</span>
                    </div>
                    <div class="stat-value">R$ ${salesTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    <div class="stat-label">Vendas no mês</div>
                    <div class="sparkline">
                        <div class="sparkbar" style="height: 90%"></div><div class="sparkbar" style="height: 80%"></div>
                        <div class="sparkbar" style="height: 100%"></div><div class="sparkbar" style="height: 70%"></div>
                        <div class="sparkbar" style="height: 60%"></div><div class="sparkbar" style="height: 50%"></div>
                        <div class="sparkbar" style="height: 60%"></div><div class="sparkbar" style="height: 40%"></div>
                        <div class="sparkbar" style="height: 50%"></div><div class="sparkbar" style="height: 30%"></div>
                    </div>
                </div>
            </div>
            
            <!-- Middle Row -->
            <div class="middle-row">
                <div class="card">
                    <div class="card-title">
                        Canais de atendimento
                        <div class="filter-pills" id="dashboard-channels-filter">
                            <div class="pill active" onclick="window.filterInicioChannels('todos', this)">Todos</div>
                            <div class="pill" onclick="window.filterInicioChannels('online', this)">Online</div>
                            <div class="pill" onclick="window.filterInicioChannels('offline', this)">Offline</div>
                        </div>
                    </div>
                    <div class="channel-list" id="dashboard-channels-list">
                        <div class="channel-item">
                            <div class="channel-icon"><i class="ph-light ph-whatsapp-logo"></i></div>
                            <div class="channel-name">WhatsApp Comercial</div>
                            <div class="channel-status"><span class="status-dot ${App.whatsappStatus === 'connected' ? 'online' : 'offline'}"></span> ${App.whatsappStatus === 'connected' ? 'Conectado' : 'Desconectado'}</div>
                        </div>
                        <div class="channel-item">
                            <div class="channel-icon"><i class="ph-light ph-instagram-logo"></i></div>
                            <div class="channel-name">Instagram Direct</div>
                            <div class="channel-status"><span class="status-dot online"></span> Conectado</div>
                        </div>
                        <div class="channel-item">
                            <div class="channel-icon"><i class="ph-light ph-chat-teardrop-dots"></i></div>
                            <div class="channel-name">Chat do Site</div>
                            <div class="channel-status"><span class="status-dot offline"></span> Desconectado</div>
                        </div>
                        <div class="channel-item">
                            <div class="channel-icon"><i class="ph-light ph-envelope-simple"></i></div>
                            <div class="channel-name">E-mail Suporte</div>
                            <div class="channel-status"><span class="status-dot online"></span> Conectado</div>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-title">Pipeline — Resumo</div>
                    <div class="pipeline-list">
                        ${pipelineHtml}
                    </div>
                </div>
            </div>
            
            <!-- Bottom Row -->
            <div class="bottom-row">
                <div class="card activity-card" style="cursor: pointer;" onclick="App.navigateTo('central-atividades')">
                    <div class="card-left"><i class="ph-light ph-chart-line-up" style="font-size:20px;"></i> Atividades</div>
                    <div class="card-right">${allContacts.filter(c => c.status === 'follow_up').length} pendentes</div>
                </div>
                <div class="card events-card" style="cursor: pointer;" onclick="App.navigateTo('ligacoes')">
                    <div class="card-left"><i class="ph-light ph-calendar-blank" style="font-size:20px;"></i> Eventos do Dia</div>
                    <div class="card-right">${allContacts.filter(c => c.status === 'reuniao').length} hoje</div>
                </div>
            </div>
        </div>
    `;

    // Attaching dynamic functions if not present
    if (!window.goToAddContact) {
        window.goToAddContact = function () {
            App.navigateTo('negocios').then(() => {
                setTimeout(() => {
                    const plusIcon = document.querySelector('.k-col-actions .ph-plus');
                    if (plusIcon) plusIcon.click();
                }, 100);
            });
        };
    }

    if (!window.filterInicioChannels) {
        window.filterInicioChannels = function (type, el) {
            const container = document.getElementById('dashboard-channels-filter');
            if (container) {
                container.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
                el.classList.add('active');
            }

            const list = document.getElementById('dashboard-channels-list');
            if (list) {
                list.querySelectorAll('.channel-item').forEach(item => {
                    const isOnline = item.querySelector('.status-dot.online') !== null;
                    if (type === 'todos') {
                        item.style.display = 'flex';
                    } else if (type === 'online') {
                        item.style.display = isOnline ? 'flex' : 'none';
                    } else if (type === 'offline') {
                        item.style.display = !isOnline ? 'flex' : 'none';
                    }
                });
            }
        };
    }

    return div;
}

function renderRelatoriosView() {
    const allContacts = window.getContacts ? window.getContacts() : [];
    const wonDeals = allContacts.filter(c => c.status === 'reuniao');
    const lostDeals = allContacts.filter(c => c.status === 'no_show');

    const salesTotal = wonDeals.reduce((acc, c) => acc + (parseFloat(c.value) || 0), 0);
    const numSales = wonDeals.length;
    const totalFinished = wonDeals.length + lostDeals.length;
    const conversionRate = totalFinished > 0 ? ((wonDeals.length / totalFinished) * 100).toFixed(2) : '0.00';
    const averageTicket = numSales > 0 ? (salesTotal / numSales) : 0;

    const div = document.createElement('div');
    div.innerHTML = `
        <div class="relatorios-header">
            <div class="relatorios-icon"><i class="ph-light ph-chart-bar"></i></div>
            <div class="relatorios-title">
                <h2>Relatórios</h2>
                <p>01/01/2026 - 17/02/2026</p>
            </div>
        </div>

        <div class="filters-bar">
            <div class="filters-left">
                <div class="filter-dropdown">
                    Período: 01/01/2026 - 17/02/2026
                </div>
                <div class="filter-dropdown">
                    Usuário <i class="ph-light ph-caret-down"></i>
                </div>
                <div class="filter-link">Restaurar filtros</div>
            </div>
            <div class="filters-right">
                <button class="btn-primary" style="padding: 8px 16px;"><i class="ph-light ph-plus"></i> Métricas</button>
                <div class="filter-dropdown">
                    Vendas <i class="ph-light ph-caret-down"></i>
                </div>
            </div>
        </div>

        <div class="rel-stats-row">
            <div class="rel-stat-card">
                <div class="rel-stat-info">
                    <span class="rel-stat-label">Vendas</span>
                    <span class="rel-stat-value">${numSales}</span>
                </div>
                <div class="rel-stat-icon"><i class="ph-light ph-shopping-cart"></i></div>
            </div>
            <div class="rel-stat-card">
                <div class="rel-stat-info">
                    <span class="rel-stat-label">Conversão de negócios</span>
                    <span class="rel-stat-value">${conversionRate}%</span>
                </div>
                <div class="rel-stat-icon"><i class="ph-light ph-target"></i></div>
            </div>
            <div class="rel-stat-card">
                <div class="rel-stat-info">
                    <span class="rel-stat-label">Ticket médio</span>
                    <span class="rel-stat-value">R$ ${averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div class="rel-stat-icon"><i class="ph-light ph-currency-dollar"></i></div>
            </div>
            <div class="rel-stat-card">
                <div class="rel-stat-info">
                    <span class="rel-stat-label">Valor de Vendas</span>
                    <span class="rel-stat-value">R$ ${salesTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div class="rel-stat-icon"><i class="ph-light ph-trend-up"></i></div>
            </div>
        </div>

        <div class="chart-card">
            <div class="chart-header">Visão geral</div>
            <div class="chart-container">
                <canvas id="relatoriosChart"></canvas>
            </div>
        </div>
    `;

    setTimeout(() => {
        initRelatoriosChart();
    }, 100);

    return div;
}

function initRelatoriosChart() {
    const ctx = document.getElementById('relatoriosChart');
    if (!ctx) return;

    // Destroy previous instance if exists to avoid hover errors
    if (window.relChartInstance) {
        window.relChartInstance.destroy();
    }

    const brandColor = getComputedStyle(document.documentElement).getPropertyValue('--brand-color').trim() || '#3b82f6';
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Create gradient
    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 350);
    gradient.addColorStop(0, isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

    const data = [10, 15, 12, 60, 45, 40, 20, 15, 10, 8, 20, 15, 12, 10, 50, 40, 25, 20, 30, 20, 35, 20, 15, 25, 15, 20, 10];
    const labels = data.map((_, i) => 'Dia ' + (i + 1));

    window.relChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Acessos',
                data: data,
                borderColor: brandColor,
                backgroundColor: gradient,
                borderWidth: 2,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: brandColor,
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { display: false, beginAtZero: true },
                x: { display: false }
            }
        }
    });
}

function renderConversasView() {
    const div = document.createElement('div');
    const contacts = window.getContacts ? window.getContacts() : [];
    const activeContact = window.getActiveContact ? window.getActiveContact() : null;

    if (!activeContact) {
        div.innerHTML = `<div>Carregando contatos... (Dê refresh se necessário)</div>`;
        return div;
    }

    let contactsHtml = '';
    contacts.forEach(c => {
        const isActive = activeContact.id === c.id ? 'active' : '';
        const initial = c.name.charAt(0).toUpperCase();
        contactsHtml += `
            <div class="conv-item ${isActive}" onclick="window.selectContact(${c.id})">
                <div class="conv-avatar">
                    ${initial}
                    <div class="conv-status-dot ${c.status}"></div>
                </div>
                <div class="conv-info">
                    <div class="conv-name-row">
                        <span class="conv-name">${c.name}</span>
                        <span class="conv-time">${c.time}</span>
                    </div>
                    <div class="conv-snippet">${c.lastMsg}</div>
                </div>
            </div>
        `;
    });

    let tagsHtml = '';
    if (activeContact.tags && activeContact.tags.length > 0) {
        activeContact.tags.forEach((t, i) => {
            const cssClass = ['mql', 'icp', 'other'][i % 3] || 'other';
            tagsHtml += `<span class="chat-tag ${cssClass}">${t}</span>`;
        });
    } else {
        tagsHtml = `<span class="chat-tag other">Sem Tags</span>`;
    }

    let statusLabel = activeContact.status === 'reuniao' ? 'Reunião Agendada' : (activeContact.status === 'no_show' ? 'No-Show' : 'Em andamento');

    const isConnected = App.whatsappStatus === 'connected';

    div.innerHTML = `
        <div class="conversas-layout">
            <div class="conv-sidebar">
                <div class="conv-sidebar-header">
                    <div class="conv-search">
                        <i class="ph-light ph-magnifying-glass"></i>
                        <input type="text" placeholder="Buscar conversas...">
                    </div>
                    <div class="conv-tabs">
                        <div class="conv-tab active">Todos</div>
                        <div class="conv-tab">Meus</div>
                        <div class="conv-tab">Grupos</div>
                    </div>
                </div>
                <div class="conv-list">
                    ${isConnected ? contactsHtml : `
                        <div style="padding: 24px; text-align: center; color: var(--text-secondary);">
                            <i class="ph-light ph-whatsapp-logo" style="font-size: 48px; margin-bottom: 12px; opacity: 0.2;"></i>
                            <p style="font-size: 14px; margin-bottom: 16px;">Conecte seu WhatsApp para visualizar as conversas.</p>
                            <button class="btn-primary" onclick="window.showWhatsAppQrModal()" style="width: 100%;">Conectar Agora</button>
                        </div>
                    `}
                </div>
            </div>
            
            <div class="conv-chat">
                ${isConnected ? `
                <div class="chat-header">
                    <div class="chat-contact-info">
                        <div class="conv-avatar">${activeContact.name.charAt(0).toUpperCase()}</div>
                        <span class="chat-contact-name">${activeContact.name}</span>
                    </div>
                    <div class="chat-actions">
                        <div class="whatsapp-status-badge">
                            <i class="ph-light ph-circle-wavy-check" style="color:#25D366"></i> API Conectada
                        </div>
                        <i class="ph-light ph-magnifying-glass" style="cursor:pointer"></i>
                        <i class="ph-light ph-phone" style="cursor:pointer"></i>
                        <i class="ph-light ph-video-camera" style="cursor:pointer"></i>
                        <button class="btn-end" onclick="App.setWhatsAppStatus('disconnected')">Desconectar</button>
                    </div>
                </div>
                
                <div class="chat-tags-bar">
                    ${tagsHtml}
                </div>
                
                <div class="chat-messages">
                    <div class="msg-bubble received">
                        Bom dia
                        <div class="msg-time">09:32</div>
                    </div>
                    <div class="msg-bubble received">
                        ${activeContact.lastMsg}
                        <div class="msg-time">${activeContact.time}</div>
                    </div>
                </div>
                
                <div class="chat-input-area">
                    <div class="chat-quick-replies">
                        <button class="quick-reply-btn" onclick="window.sendWhatsAppDirect('${activeContact.whatsapp}', 'Tentei te ligar agora mas não consegui entrar em contato...')"><i class="ph-light ph-lightning"></i> Funil Rechamar 01</button>
                        <button class="quick-reply-btn" onclick="window.sendWhatsAppDirect('${activeContact.whatsapp}', 'Olá ${activeContact.name.split(' ')[0]}, tudo certo por aí?')"><i class="ph-light ph-lightning"></i> Funil saudação</button>
                        <button class="quick-reply-btn"><i class="ph-light ph-lightning"></i> Mensagem agendada</button>
                    </div>
                    <div class="chat-input-box">
                        <input type="text" id="chat-input-main" placeholder="Digite uma mensagem ou use os atalhos rápidos para enviar!">
                        <button class="btn-send" onclick="window.sendWhatsAppMessage()"><i class="ph-light ph-arrow-right"></i></button>
                    </div>
                </div>
                ` : `
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #fff;">
                    <i class="ph-light ph-chat-circle-dots" style="font-size: 64px; color: var(--border-color); margin-bottom: 16px;"></i>
                    <h3 style="color: var(--text-primary); margin-bottom: 8px;">Aguardando Conexão</h3>
                    <p style="color: var(--text-secondary); max-width: 300px; text-align: center; font-size: 14px;">
                        Para começar a atender seus clientes, é necessário parear seu aparelho com o nosso sistema.
                    </p>
                </div>
                `}
            </div>

            <div class="conv-details">
                <div class="details-header">Detalhes do Contato</div>
                <div class="details-content">
                    <div class="details-section">
                        <div class="details-label">STATUS DA NEGOCIAÇÃO</div>
                        <div class="status-value-row">
                            <span class="status-badge ${activeContact.status}">${statusLabel}</span>
                        </div>
                    </div>
                    
                    <div class="details-section validation-section">
                        <div class="details-label">DIRECIONAR LEAD</div>
                        <div class="status-chips-container">
                            ${App.getPipelineColumns().map(col => `
                                <button class="status-chip ${col.id} ${activeContact.status === col.id ? 'active' : ''}" 
                                        onclick="window.validateAndRedirect(${activeContact.id}, '${col.id}')">
                                    ${col.name}
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <div class="details-section">
                        <div class="details-label">INFORMAÇÕES</div>
                        <div class="details-info-box">
                            <p class="details-value">
                                <b>WhatsApp:</b> ${activeContact.whatsapp || 'Não informado'}
                            </p>
                            <p class="details-value" style="margin-top: 4px;">
                                <b>Tags:</b> ${activeContact.tags && activeContact.tags.length ? activeContact.tags.join(', ') : 'Sem tags'}
                            </p>
                            <p class="details-value" style="margin-top: 8px; font-size: 11px; color: #94a3b8;">
                                Acompanhamento feito em tempo real via DS Voice Integration.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    setTimeout(() => {
        // Add handler for Enter key
        const input = div.querySelector('#chat-input-main');
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') window.sendWhatsAppMessage();
            });
        }
    }, 150);

    window.validateAndRedirect = function (contactId, forceStatus) {
        const select = div.querySelector('#validation-status');
        const newStatus = forceStatus || (select ? select.value : 'entrada');

        if (window.updateContactStatus) {
            window.updateContactStatus(contactId, newStatus);

            // Re-render the view to update the active chip and badge
            App.navigateTo('conversas');

            if (confirm('Lead direcionado com sucesso! Deseja visualizar na Pipeline agora?')) {
                App.navigateTo('negocios');
            }
        }
    };

    window.sendWhatsAppMessage = function () {
        const msg = div.querySelector('#chat-input-main').value;
        if (!msg) return;
        window.sendWhatsAppDirect(activeContact.whatsapp, msg);
        div.querySelector('#chat-input-main').value = '';
    };

    window.sendWhatsAppDirect = function (number, text) {
        if (!number) {
            alert('Este contato não possui número de WhatsApp cadastrado!');
            return;
        }
        const encoded = encodeURIComponent(text);
        const url = `https://api.whatsapp.com/send?phone=${number}&text=${encoded}`;
        window.open(url, '_blank');
    };

    return div;
}

window.selectContact = function (id) {
    if (window.setActiveContact) {
        window.setActiveContact(id);
        App.navigateTo('conversas');
    }
};

function renderDsAgenteView() {
    const div = document.createElement('div');
    div.innerHTML = `
        <div class="ds-agente-header">
            <h2 class="ds-title">DS Agente</h2>
            <div class="ds-actions">
                <div class="search-box">
                    <i class="ph-light ph-magnifying-glass"></i>
                    <input type="text" placeholder="Buscar item">
                </div>
                <button class="btn-secondary"><i class="ph-light ph-folder-simple-plus"></i> Nova Pasta</button>
                <button class="btn-primary large"><i class="ph-light ph-plus"></i> Adicionar Agente</button>
            </div>
        </div>

        <div class="info-banner" id="banner-agente">
            <div class="info-banner-icon"><i class="ph-light ph-cpu"></i></div>
            <div class="info-banner-text">
                <h3>Clique em uma pasta para ver os agentes de IA!</h3>
                <p>Abra uma pasta, selecione um agente e veja o editor completo com treinamento, teste e mais.</p>
            </div>
            <div class="banner-close" onclick="document.getElementById('banner-agente').style.display='none'">
                <i class="ph-light ph-x"></i>
            </div>
        </div>

        <div class="folders-grid">
            <div class="folder-card">
                <i class="ph-light ph-folder folder-icon"></i>
                <span class="folder-name">IA - Pós Venda (CS)</span>
                <div class="folder-badge">2</div>
            </div>
            <div class="folder-card">
                <i class="ph-light ph-folder folder-icon"></i>
                <span class="folder-name">IA - Nichos Diversos</span>
                <div class="folder-badge">3</div>
            </div>
            <div class="folder-card">
                <i class="ph-light ph-folder folder-icon"></i>
                <span class="folder-name">IA - Venda Direta (Comercial)</span>
                <div class="folder-badge">2</div>
            </div>
            <div class="folder-card">
                <i class="ph-light ph-folder folder-icon"></i>
                <span class="folder-name">Comercial - 2025</span>
                <div class="folder-badge">5</div>
            </div>
            <div class="folder-card">
                <i class="ph-light ph-folder folder-icon"></i>
                <span class="folder-name">Atendimento Geral</span>
                <div class="folder-badge">1</div>
            </div>
            <div class="folder-card">
                <i class="ph-light ph-folder folder-icon"></i>
                <span class="folder-name">Agentes - Martins</span>
                <div class="folder-badge">2</div>
            </div>
            <div class="folder-card">
                <i class="ph-light ph-folder folder-icon"></i>
                <span class="folder-name">BRAGA (TESTES)</span>
                <div class="folder-badge">0</div>
            </div>
            <div class="folder-card">
                <i class="ph-light ph-folder folder-icon"></i>
                <span class="folder-name">Outros</span>
                <div class="folder-badge">1</div>
            </div>
            <div class="folder-card" style="margin-right: auto;">
                <i class="ph-light ph-folder folder-icon"></i>
                <span class="folder-name">Comercial - 2026</span>
                <div class="folder-badge">1</div>
            </div>
        </div>
    `;
    return div;
}

function renderDsVoiceView() {
    const div = document.createElement('div');
    const activeSection = App.activeVoiceSection || 'mensagens';

    // Initial data if empty
    if (!localStorage.getItem('crm_voice_messages')) {
        const initialMsgs = [
            { id: 1, title: 'Funil Rechamar 01', text: 'Tentei te ligar agora mas não consegui entrar em contato... consigo 5min pra gente bater nas tuas dúvidas sobre o...' },
            { id: 2, title: 'Saudação demonstração', text: '{{saudacao}} {{primeiroNome}}, tudo certo por aí?' },
            { id: 3, title: 'Texto Fecha Mês', text: 'Opa, tudo bem? Ouve esse áudio acredito que essa oportunidade é a mais importante que já fiz desde os últimos 4...' },
            { id: 4, title: 'APÓS RESPOSTA DO "Faz...', text: 'Posso verificar aqui com o gestor se ainda consigo manter essa condição pra você, e aí te explico certinho como funcionaria...' },
            { id: 5, title: 'APÓS RESPOSTA DO "Faz... 2', text: 'Te explico isso porque, por estarmos no final do ano, conseguimos liberar uma condição especial que não costuma ficar...' },
            { id: 6, title: 'APÓS RESPOSTA DO "Faz... 3', text: 'E tem outro ponto importante que quase ninguém percebe de primeira... Além de ajudar seus clientes, esse tipo de estrutur...' }
        ];
        localStorage.setItem('crm_voice_messages', JSON.stringify(initialMsgs));
    }

    const messages = JSON.parse(localStorage.getItem('crm_voice_messages') || '[]');
    const triggers = JSON.parse(localStorage.getItem('crm_voice_triggers') || '[]');
    const mockMedia = JSON.parse(localStorage.getItem('crm_voice_media') || '{"audios": [], "midias": [], "documentos": []}');

    const renderSidebarItem = (id, label, icon) => {
        const isActive = activeSection === id ? 'active' : '';
        return `<a class="inner-nav-item ${isActive}" onclick="App.activeVoiceSection='${id}'; App.activeVoiceFolderId=null; App.navigateTo('ds-voice')"><i class="ph ${icon}"></i> ${label}</a>`;
    };

    let mainContentHtml = '';

    if (activeSection === 'mensagens') {
        const folders = App.getVoiceFolders().filter(f => f.section === activeSection);
        const activeFolderId = App.activeVoiceFolderId;
        const filteredMessages = activeFolderId
            ? messages.filter(m => m.folderId === activeFolderId)
            : messages.filter(m => !m.folderId);

        mainContentHtml = `
            ${activeFolderId ? `
                <div class="folder-navigation">
                    <button class="btn-back" onclick="App.activeVoiceFolderId = null; App.navigateTo('ds-voice')">
                        <i class="ph-light ph-arrow-left"></i> Voltar para Mensagens
                    </button>
                    <div class="current-folder-info">
                        <h3><i class="ph-light ph-folder-open"></i> ${folders.find(f => f.id === activeFolderId)?.name || 'Pasta'}</h3>
                        <div style="display:flex; gap:8px;">
                            <button class="btn-icon" onclick="window.editVoiceFolder('${activeFolderId}')"><i class="ph-light ph-pencil"></i></button>
                        </div>
                    </div>
                </div>
            ` : `
                <div class="folders-grid" style="margin-bottom: 24px;">
                    ${folders.map(f => `
                        <div class="folder-card" onclick="App.activeVoiceFolderId = '${f.id}'; App.navigateTo('ds-voice')">
                            <i class="ph-light ph-folder folder-icon"></i>
                            <span class="folder-name">${f.name}</span>
                            <div class="folder-actions-dots" onclick="event.stopPropagation()">
                                <button class="btn-dots" onclick="window.editVoiceFolder('${f.id}')"><i class="ph-light ph-pencil"></i></button>
                                <button class="btn-dots btn-delete" onclick="window.deleteVoiceFolder('${f.id}')"><i class="ph-light ph-trash"></i></button>
                            </div>
                            <div class="folder-badge">${messages.filter(m => m.folderId === f.id).length}</div>
                        </div>
                    `).join('')}
                </div>
            `}

            <div class="info-banner-blue">
                <div class="info-banner-icon-bg"><i class="ph-light ph-eye"></i></div>
                <div class="info-banner-content">
                    <h4>Clique em uma mensagem para ver detalhes!</h4>
                    <p>Veja o conteúdo completo e opções de envio, edição e duplicação.</p>
                </div>
                <button class="banner-close-btn"><i class="ph-light ph-x"></i></button>
            </div>

            <div class="messages-grid">
                ${filteredMessages.length === 0 ? `
                    <div class="empty-gallery">
                        <i class="ph-light ph-chat-text" style="font-size: 48px; opacity: 0.2; margin-bottom: 12px;"></i>
                        <p>Nenhuma mensagem encontrada ${activeFolderId ? 'nesta pasta' : 'na raiz'}.</p>
                    </div>
                ` : filteredMessages.map(m => `
                    <div class="message-card">
                        <div class="card-top">
                            <h5>${m.title}</h5>
                            <div class="card-actions">
                                <button onclick="event.stopPropagation(); window.editVoiceMessage('${m.id}')"><i class="ph-light ph-pencil"></i></button>
                                <button onclick="event.stopPropagation(); window.deleteVoiceMessage('${m.id}')" class="btn-delete"><i class="ph-light ph-trash"></i></button>
                            </div>
                        </div>
                        <div class="card-text">${m.text}</div>
                    </div>
                `).join('')}
            </div>
        `;
    } else if (activeSection === 'gatilhos') {
        const followUpCount = (window.getContacts ? window.getContacts() : []).filter(c => c.status === 'follow_up').length;
        mainContentHtml = `
            <div class="triggers-container">
                <div style="margin-bottom: 24px; display:flex; justify-content: space-between; align-items:center;">
                    <div>
                        <h3 style="margin:0;">Gatilhos Automatizados</h3>
                        <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">
                            <i class="ph-light ph-users" style="color: var(--brand-color)"></i> 
                            <b>${followUpCount}</b> contatos aguardando na etapa de <b>Follow Up</b>
                        </p>
                    </div>
                    <button class="btn-primary" onclick="window.showNewTriggerModal()"><i class="ph-light ph-plus"></i> Novo Gatilho</button>
                </div>
                ${triggers.length === 0 ? `
                    <div class="empty-gallery">
                        <i class="ph-light ph-lightning" style="font-size: 48px; opacity: 0.2; margin-bottom: 12px;"></i>
                        <p>Nenhum gatilho configurado. Crie um para automatizar seu follow-up!</p>
                    </div>
                ` : `
                    <div class="triggers-list">
                        ${triggers.map(t => {
            let msgName = 'Item não encontrado';
            let icon = 'ph-chat-text';

            if (t.type === 'audio' || t.mediaType === 'audio') {
                const audios = JSON.parse(localStorage.getItem('crm_voice_media') || '{}').audios || [];
                const item = audios.find(a => a.id == t.messageId || a.name == t.messageId);
                msgName = item ? item.name : t.messageId;
                icon = 'ph-microphone-stage';
            } else if (t.type === 'midia' || t.mediaType === 'midias') {
                const midias = JSON.parse(localStorage.getItem('crm_voice_media') || '{}').midias || [];
                const item = midias.find(m => m.id == t.messageId || m.name == t.messageId);
                msgName = item ? item.name : t.messageId;
            } else {
                const msgs = JSON.parse(localStorage.getItem('crm_voice_messages') || '[]');
                const item = msgs.find(m => m.id == t.messageId);
                msgName = item ? item.title : 'Mensagem de Texto';
            }
            const statusContactCount = (window.getContacts ? window.getContacts() : []).filter(c => c.status === t.event).length;

            return `
                                <div class="trigger-card">
                                    <div class="trigger-info">
                                        <div style="display:flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                                            <span style="font-size: 10px; color: var(--brand-color); font-weight: 700; text-transform: uppercase;">
                                                 <i class="ph ${icon}"></i> ${(t.mediaType || 'texto').toUpperCase()}
                                            </span>
                                            <span style="font-size: 11px; color: #64748b; background: #f1f5f9; padding: 2px 8px; border-radius: 12px; font-weight: 600;">
                                                <i class="ph-light ph-users" style="color: var(--brand-color)"></i> ${statusContactCount} contatos
                                            </span>
                                        </div>
                                        <h4>Ao mudar status para: <b>${t.event.replace('_', ' ')}</b></h4>
                                        <p>Enviar: <b>${msgName}</b></p>
                                        ${(t.delayDays > 0 || t.exactTime) ? `
                                            <p style="font-size:11px; margin-top:4px; color:#3b82f6;"><i class="ph-light ph-clock"></i> Enviar após ${t.delayDays}d às ${t.exactTime || '09:00'}</p>
                                        ` : ''}
                                    </div>
                                    <div style="display:flex; gap:12px; align-items:center;">
                                        <span style="font-size:12px; color:${t.active ? '#10b981' : '#94a3b8'}; font-weight:600;">${t.active ? 'ATIVO' : 'INATIVO'}</span>
                                        <button class="btn-icon" onclick="window.deleteTrigger(${t.id})"><i class="ph-light ph-trash"></i></button>
                                    </div>
                                </div>
                            `;
        }).join('')}
                    </div>
                `}
            </div>
        `;
    } else {
        // Media sections (Áudios, Mídias, Documentos)
        const allItems = mockMedia[activeSection] || [];
        const folders = App.getVoiceFolders().filter(f => f.section === activeSection);
        const activeFolderId = App.activeVoiceFolderId;
        const typeLabel = activeSection === 'audios' ? 'Áudios' : (activeSection === 'midias' ? 'Mídias' : 'Documentos');
        const icon = activeSection === 'audios' ? 'ph-microphone-stage' : (activeSection === 'midias' ? 'ph-image' : 'ph-file-text');

        const filteredItems = activeFolderId
            ? allItems.filter(i => i.folderId === activeFolderId)
            : allItems.filter(i => !i.folderId);

        mainContentHtml = `
            ${activeFolderId ? `
                <div class="folder-navigation">
                    <button class="btn-back" onclick="App.activeVoiceFolderId = null; App.navigateTo('ds-voice')">
                        <i class="ph-light ph-arrow-left"></i> Voltar para ${typeLabel}
                    </button>
            <div class="current-folder-info">
                        <h3><i class="ph-light ph-folder-open"></i> ${folders.find(f => f.id === activeFolderId)?.name || 'Pasta'}</h3>
                        <div class="folder-header-actions">
                            <button class="btn-icon-text btn-white" onclick="window.editVoiceFolder('${activeFolderId}')"><i class="ph-light ph-pencil"></i> Renomear</button>
                            <button class="btn-icon-text btn-white text-danger" onclick="window.deleteVoiceFolder('${activeFolderId}')"><i class="ph-light ph-trash"></i> Excluir Pasta</button>
                        </div>
                    </div>
                </div>
            ` : `
                <div class="folders-grid">
                    ${folders.map(f => `
                        <div class="folder-card" onclick="App.activeVoiceFolderId = '${f.id}'; App.navigateTo('ds-voice')">
                            <i class="ph-light ph-folder folder-icon"></i>
                            <span class="folder-name">${f.name}</span>
                            <div class="folder-actions-dots" onclick="event.stopPropagation()">
                                <button class="btn-dots" onclick="window.editVoiceFolder('${f.id}')"><i class="ph-light ph-pencil"></i></button>
                                <button class="btn-dots btn-delete" onclick="window.deleteVoiceFolder('${f.id}')"><i class="ph-light ph-trash"></i></button>
                            </div>
                            <div class="folder-badge">${allItems.filter(i => i.folderId === f.id).length}</div>
                        </div>
                    `).join('')}
                </div>
            `}

            <div class="voice-gallery">
                ${filteredItems.length === 0 ? `
                    <div class="empty-gallery">
                        <i class="ph ${icon}" style="font-size: 48px; opacity: 0.2; margin-bottom: 12px;"></i>
                        <p>Nenhum ${typeLabel.toLowerCase()} encontrado ${activeFolderId ? 'nesta pasta' : 'na raiz'}.</p>
                    </div>
                ` : `
                    <div class="gallery-grid">
                        ${filteredItems.map(item => `
                            <div class="gallery-item">
                                <div class="item-preview">
                                    <i class="ph ${icon}"></i>
                                    <div class="item-actions-overlay" onclick="event.stopPropagation()">
                                        <button onclick="window.editVoiceMedia('${item.id}')" title="Renomear"><i class="ph-light ph-pencil"></i></button>
                                        <button onclick="window.deleteVoiceMedia('${item.id}')" title="Excluir" class="btn-delete"><i class="ph-light ph-trash"></i></button>
                                    </div>
                                </div>
                                <div class="item-info">
                                    <span class="item-name">${item.name}</span>
                                    <span class="item-date">${item.date}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        `;
    }

    div.innerHTML = `
        <div class="dsvoice-layout">
            <div class="dsvoice-sidebar">
                ${renderSidebarItem('mensagens', 'Mensagens', 'ph-chat-text')}
                ${renderSidebarItem('audios', 'Áudios', 'ph-microphone-stage')}
                ${renderSidebarItem('midias', 'Mídias', 'ph-image')}
                ${renderSidebarItem('documentos', 'Documentos', 'ph-file-text')}
                <a class="inner-nav-item"><i class="ph-light ph-funnel"></i> Funis</a>
                ${renderSidebarItem('gatilhos', 'Gatilhos', 'ph-lightning')}
            </div>
            
            <div class="dsvoice-main">
                <div class="dsvoice-header">
                    <div class="search-box">
                        <i class="ph-light ph-magnifying-glass"></i>
                        <input type="text" placeholder="Buscar item">
                    </div>
                    <div class="header-actions">
                        <button class="btn-icon-text btn-white" onclick="window.addNewVoiceFolder()"><i class="ph-light ph-folder"></i> Nova Pasta</button>
                        <button class="btn-icon-text btn-blue" onclick="window.handleDsVoiceAdd()"><i class="ph-light ph-plus"></i> Novo Item</button>
                        <input type="file" id="voice-upload-input" style="display:none" onchange="window.handleVoiceUpload(this)">
                    </div>
                </div>

                ${mainContentHtml}
            </div>
        </div>
    `;

    window.addNewVoiceFolder = function () {
        const name = prompt("Nome da nova pasta:");
        if (name && name.trim() !== "") {
            const folders = App.getVoiceFolders();
            const id = 'folder_' + Date.now();
            folders.push({ id, name: name.trim(), section: activeSection });
            App.saveVoiceFolders(folders);
            App.navigateTo('ds-voice');
        }
    };

    const showToast = (msg) => {
        const toast = document.createElement('div');
        toast.style.cssText = 'position:fixed; bottom:20px; right:20px; background:#10b981; color:#fff; padding:12px 20px; border-radius:8px; z-index:9999; box-shadow:0 4px 12px rgba(0,0,0,0.1); font-size:13px; transform:translateY(100px); transition:transform 0.3s ease;';
        toast.innerHTML = `<i class="ph-light ph-check-circle" style="vertical-align:middle; margin-right:8px;"></i> ${msg}`;
        document.body.appendChild(toast);
        setTimeout(() => toast.style.transform = 'translateY(0)', 10);
        setTimeout(() => {
            toast.style.transform = 'translateY(100px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    window.editVoiceFolder = function (id) {
        const folders = App.getVoiceFolders();
        const folder = folders.find(f => String(f.id) === String(id));
        if (folder) {
            const newName = prompt(`Novo nome para a pasta "${folder.name}":`, folder.name);
            if (newName && newName.trim() !== "") {
                folder.name = newName.trim();
                App.saveVoiceFolders(folders);
                showToast("Pasta renomeada!");
                App.navigateTo('ds-voice');
            }
        }
    };

    window.deleteVoiceFolder = function (id) {
        const folders = App.getVoiceFolders();
        const folder = folders.find(f => String(f.id) === String(id));
        if (folder && confirm(`Deseja excluir a pasta "${folder.name}"? Todos os itens dentro dela perderão a associação com esta pasta.`)) {
            const newFolders = folders.filter(f => String(f.id) !== String(id));
            App.saveVoiceFolders(newFolders);

            const msgs = JSON.parse(localStorage.getItem('crm_voice_messages') || '[]');
            msgs.forEach(m => { if (String(m.folderId) === String(id)) delete m.folderId; });
            localStorage.setItem('crm_voice_messages', JSON.stringify(msgs));

            const media = JSON.parse(localStorage.getItem('crm_voice_media') || '{"audios": [], "midias": [], "documentos": []}');
            ['audios', 'midias', 'documentos'].forEach(sec => {
                if (media[sec]) {
                    media[sec].forEach(item => { if (String(item.folderId) === String(id)) delete item.folderId; });
                }
            });
            localStorage.setItem('crm_voice_media', JSON.stringify(media));

            if (String(App.activeVoiceFolderId) === String(id)) App.activeVoiceFolderId = null;
            showToast("Pasta excluída!");
            App.navigateTo('ds-voice');
        }
    };

    window.editVoiceMedia = function (id) {
        const media = JSON.parse(localStorage.getItem('crm_voice_media') || '{"audios": [], "midias": [], "documentos": []}');
        const sec = App.activeVoiceSection;
        const item = (media[sec] || []).find(i => String(i.id) === String(id));
        if (item) {
            const newName = prompt(`Novo nome:`, item.name);
            if (newName && newName.trim()) {
                item.name = newName.trim();
                localStorage.setItem('crm_voice_media', JSON.stringify(media));
                showToast("Item renomeado!");
                App.navigateTo('ds-voice');
            }
        }
    };

    window.deleteVoiceMedia = function (id) {
        if (confirm("Deseja realmente excluir este item?")) {
            const media = JSON.parse(localStorage.getItem('crm_voice_media') || '{"audios": [], "midias": [], "documentos": []}');
            const sec = App.activeVoiceSection;
            if (media[sec]) {
                media[sec] = media[sec].filter(i => String(i.id) !== String(id));
                localStorage.setItem('crm_voice_media', JSON.stringify(media));
                showToast("Item excluído!");
                App.navigateTo('ds-voice');
            }
        }
    };

    window.editVoiceMessage = function (id) {
        const msgs = JSON.parse(localStorage.getItem('crm_voice_messages') || '[]');
        const msg = msgs.find(m => String(m.id) === String(id));
        if (msg) {
            const newTitle = prompt("Novo título:", msg.title);
            if (newTitle && newTitle.trim()) {
                msg.title = newTitle.trim();
                localStorage.setItem('crm_voice_messages', JSON.stringify(msgs));
                showToast("Mensagem renomeada!");
                App.navigateTo('ds-voice');
            }
        }
    };

    window.deleteVoiceMessage = function (id) {
        if (confirm("Deseja realmente excluir esta mensagem?")) {
            const msgs = JSON.parse(localStorage.getItem('crm_voice_messages') || '[]');
            const newMsgs = msgs.filter(m => String(m.id) !== String(id));
            localStorage.setItem('crm_voice_messages', JSON.stringify(newMsgs));
            showToast("Mensagem excluída!");
            App.navigateTo('ds-voice');
        }
    };

    window.handleDsVoiceAdd = function () {
        if (activeSection === 'mensagens') {
            window.showNewMessageModal();
        } else if (activeSection === 'gatilhos') {
            window.showNewTriggerModal();
        } else {
            document.getElementById('voice-upload-input').click();
        }
    };

    window.showNewMessageModal = function () {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'voice-new-item-modal';
        modal.innerHTML = `
            <div class="modal-content voice-modal">
                <div class="modal-header">
                    <h2>Nova Mensagem Pronta</h2>
                    <button class="close-btn" onclick="document.getElementById('voice-new-item-modal').remove()"><i class="ph-light ph-x"></i></button>
                </div>
                <form id="form-new-message">
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Título da Mensagem</label>
                            <input type="text" id="msg-title" placeholder="Ex: Saudação Inicial" required>
                        </div>
                        <div class="form-group">
                            <label>Conteúdo da Mensagem</label>
                            <textarea id="msg-text" rows="5" placeholder="Olá {{primeiroNome}}, tudo bem?..." required></textarea>
                            <span style="font-size:11px; color:#64748b;">Dica: Use {{primeiroNome}} para personalizar.</span>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" onclick="document.getElementById('voice-new-item-modal').remove()">Cancelar</button>
                        <button type="submit" class="btn-primary">Salvar Mensagem</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        window.saveNewVoiceMessage = function () {
            const title = document.getElementById('msg-title').value;
            const text = document.getElementById('msg-text').value;
            const msgs = JSON.parse(localStorage.getItem('crm_voice_messages') || '[]');
            msgs.push({
                id: Date.now(),
                title,
                text,
                folderId: App.activeVoiceFolderId // Associate with active folder
            });
            localStorage.setItem('crm_voice_messages', JSON.stringify(msgs));
            modal.remove();
            App.navigateTo('ds-voice');
        };

        modal.querySelector('#form-new-message').onsubmit = (e) => {
            e.preventDefault();
            window.saveNewVoiceMessage();
        };
    };

    window.showNewTriggerModal = function () {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'voice-new-trigger-modal';

        const voiceMedia = JSON.parse(localStorage.getItem('crm_voice_media') || '{"audios": [], "midias": [], "documentos": []}');
        const voiceMessages = JSON.parse(localStorage.getItem('crm_voice_messages') || '[]');

        modal.innerHTML = `
            <div class="modal-content voice-modal">
                <div class="modal-header">
                    <h2>Configurar Gatilho Automático</h2>
                    <button class="close-btn" onclick="document.getElementById('voice-new-trigger-modal').remove()"><i class="ph-light ph-x"></i></button>
                </div>
                <form id="form-new-trigger">
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Evento Ativador (Status alterado para...)</label>
                            <select id="trigger-event" required>
                                ${App.getPipelineColumns().map(col => `
                                    <option value="${col.id}">${col.name}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-row">
                            <div class="form-group" style="flex:1">
                                <label>Tipo de Mídia</label>
                                <select id="trigger-media-type">
                                    <option value="texto">Texto (Mensagem Pronta)</option>
                                    <option value="audio">Áudio (Upload)</option>
                                    <option value="midias">Imagem / Vídeo</option>
                                </select>
                            </div>
                            <div class="form-group" style="flex:2">
                                <label>Item a ser enviado</label>
                                <select id="trigger-message" required>
                                    <!-- Populated dynamically -->
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Quando disparar?</label>
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                                <div>
                                    <label style="font-size:11px; font-weight:normal; margin-bottom:4px;">Aguardar Dias</label>
                                    <input type="number" id="trigger-delay-days" value="0" min="0">
                                </div>
                                <div>
                                    <label style="font-size:11px; font-weight:normal; margin-bottom:4px;">Hora Exata do Envio</label>
                                    <input type="time" id="trigger-exact-time" value="09:00">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" onclick="document.getElementById('voice-new-trigger-modal').remove()">Cancelar</button>
                        <button type="submit" class="btn-primary">Criar Gatilho</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        const mediaTypeSelect = modal.querySelector('#trigger-media-type');
        const itemSelect = modal.querySelector('#trigger-message');

        const updateItems = () => {
            const type = mediaTypeSelect.value;
            let options = '';
            if (type === 'texto') {
                options = voiceMessages.map(m => `<option value="${m.id}">${m.title}</option>`).join('');
            } else if (type === 'audio') {
                options = voiceMedia.audios.map(a => `<option value="${a.name}">${a.name}</option>`).join('');
            } else if (type === 'midias') {
                options = voiceMedia.midias.map(m => `<option value="${m.name}">${m.name}</option>`).join('');
            }
            itemSelect.innerHTML = options || '<option value="">Nenhum item encontrado</option>';
        };

        mediaTypeSelect.onchange = updateItems;
        updateItems();

        modal.querySelector('#form-new-trigger').onsubmit = (e) => {
            e.preventDefault();
            const event = document.getElementById('trigger-event').value;
            const mediaType = document.getElementById('trigger-media-type').value;
            const messageId = document.getElementById('trigger-message').value;
            const delayDays = document.getElementById('trigger-delay-days').value || 0;
            const exactTime = document.getElementById('trigger-exact-time').value || "09:00";

            const triggers_list = JSON.parse(localStorage.getItem('crm_voice_triggers') || '[]');
            triggers_list.push({ id: Date.now(), event, mediaType, messageId, delayDays, exactTime, active: true });
            localStorage.setItem('crm_voice_triggers', JSON.stringify(triggers_list));
            modal.remove();
            App.navigateTo('ds-voice');
        };
    };

    window.checkVoiceTriggers = function (contactId, status) {
        // This is called from updateContactStatus in contacts.js
        // If it was already handled by the QuickModal, we might skip it or just show a fallback.
        // For simplicity, if a manual move happened, the QuickModal is preferred.
    };

    window.showQuickScheduleModal = function (contactId, status, messageId, defDays, defHours, mediaType = 'texto') {
        const voiceMessages = JSON.parse(localStorage.getItem('crm_voice_messages') || '[]');
        const voiceMedia = JSON.parse(localStorage.getItem('crm_voice_media') || '{"audios": [], "midias": []}');

        let itemTitle = messageId;
        let icon = 'ph-chat-text';

        if (mediaType === 'audio') {
            const item = (voiceMedia.audios || []).find(a => a.name == messageId || a.id == messageId);
            itemTitle = item ? item.name : messageId;
            icon = 'ph-microphone-stage';
        } else if (mediaType === 'midias') {
            const item = (voiceMedia.midias || []).find(m => m.name == messageId || m.id == messageId);
            itemTitle = item ? item.name : messageId;
            icon = 'ph-image';
        } else {
            const item = voiceMessages.find(m => m.id == messageId);
            itemTitle = item ? item.title : 'Mensagem de Texto';
        }

        const contact = (window.getContacts ? window.getContacts() : []).find(c => c.id === contactId);

        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'quick-schedule-modal';
        modal.innerHTML = `
            <div class="modal-content voice-modal" style="max-width:400px;">
                <div class="modal-header">
                    <h2>Agendar Automação</h2>
                    <button class="close-btn" onclick="document.getElementById('quick-schedule-modal').remove()"><i class="ph-light ph-x"></i></button>
                </div>
                <div class="modal-body">
                    <p style="font-size:14px; margin-bottom:16px;">
                        O gatilho para <b>${status.replace('_', ' ')}</b> foi ativado para <b>${contact.name}</b>.
                        <br><br>
                        Enviar <i class="ph ${icon}"></i> <b>${itemTitle}</b>
                    </p>
                    <div class="form-group">
                        <label>Confirmar Agendamento</label>
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                            <div>
                                <label style="font-size:11px;">Dias de Atraso</label>
                                <input type="number" id="q-days" value="${defDays}" min="0">
                            </div>
                            <div>
                                <label style="font-size:11px;">Hora Exata</label>
                                <input type="time" id="q-time" value="09:00">
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="window.updateContactStatus(${contactId}, '${status}'); document.getElementById('quick-schedule-modal').remove()">Disparar Agora</button>
                    <button type="button" class="btn-primary" id="btn-confirm-schedule">Agendar Disparo</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('#btn-confirm-schedule').onclick = () => {
            const days = document.getElementById('q-days').value;
            const time = document.getElementById('q-time').value;

            // Execute status update
            window.updateContactStatus(contactId, status);

            // Show feedback
            const scheduledDate = new Date();
            scheduledDate.setDate(scheduledDate.getDate() + parseInt(days));
            const [hours, mins] = time.split(':');
            scheduledDate.setHours(hours, mins, 0, 0);

            const toast = document.createElement('div');
            toast.style.cssText = 'position:fixed; bottom:20px; right:20px; background:#10b981; color:#fff; padding:16px 24px; border-radius:12px; z-index:9999; box-shadow:0 10px 15px rgba(0,0,0,0.1); display:flex; align-items:center; gap:12px; font-size:14px;';
            toast.innerHTML = `<i class="ph-light ph-calendar-check" style="color:#fff"></i> Agendado com sucesso para ${scheduledDate.toLocaleString('pt-BR')}!`;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 4000);

            modal.remove();
        };
    };

    window.deleteTrigger = function (id) {
        let triggers_list = JSON.parse(localStorage.getItem('crm_voice_triggers') || '[]');
        triggers_list = triggers_list.filter(t => t.id != id);
        localStorage.setItem('crm_voice_triggers', JSON.stringify(triggers_list));
        App.navigateTo('ds-voice');
    };

    window.handleVoiceUpload = function (input) {
        if (input.files && input.files[0]) {
            const file = input.files[0];
            const media = JSON.parse(localStorage.getItem('crm_voice_media') || '{"audios": [], "midias": [], "documentos": []}');
            const activeSection = App.activeVoiceSection;

            if (!media[activeSection]) {
                media[activeSection] = [];
            }

            const newItem = {
                id: Date.now(),
                name: file.name,
                date: new Date().toLocaleDateString('pt-BR'),
                size: (file.size / 1024).toFixed(1) + ' KB',
                folderId: App.activeVoiceFolderId // Associate with active folder
            };

            media[activeSection].push(newItem);
            localStorage.setItem('crm_voice_media', JSON.stringify(media));
            App.navigateTo('ds-voice');
        }
    };

    return div;
}

function renderNegociosView() {
    const div = document.createElement('div');
    div.className = 'pipeline-container';

    const columns = App.getPipelineColumns();

    const currentContacts = window.getContacts ? window.getContacts() : [];

    function generateCardsHtml(statusId) {
        const filtered = currentContacts.filter(c => c.status === statusId);
        return filtered.map(c => `
            <div class="kanban-card" draggable="true" data-id="${c.id}" data-status="${statusId}" onclick="if(window.editContact) window.editContact(${c.id})">
                <div class="k-card-top">
                    <div class="k-card-avatar">${c.name.charAt(0).toUpperCase()}</div>
                    <span class="k-card-name">${c.name}</span>
                </div>
                <div class="k-card-tags">
                    ${(c.tags || []).map(t => `<span class="k-tag tag-${t.toLowerCase().replace(/[^a-z0-9]/g, '-')}">${t}</span>`).join('')}
                    ${c.status === 'reuniao' ? `<span class="k-tag tag-reuniao">Reunião Agendada</span>` : ''}
                    ${c.status === 'no_show' ? `<span class="k-tag tag-noshow">No show</span>` : ''}
                </div>
                <div class="k-card-footer">
                    <div class="k-card-actions-left">
                        <i class="ph-light ph-chat-teardrop-dots"></i>
                        <i class="ph-light ph-phone"></i>
                        <i class="ph-light ph-envelope-simple"></i>
                    </div>
                    <div class="k-card-actions-right">
                        <span>2d</span>
                        <i class="ph-light ph-eye" style="margin-left: 4px; margin-right: 2px;"></i>
                        <span>0/2</span>
                    </div>
                </div>
                <div class="k-card-hover-actions">
                    <button class="k-card-move" onclick="event.stopPropagation(); window.showMoveToMenu(event, ${c.id})"><i class="ph-light ph-list-plus"></i></button>
                    <button class="k-card-edit" onclick="event.stopPropagation(); window.editContact(${c.id})"><i class="ph-light ph-pencil-simple"></i></button>
                    <button class="k-card-delete" onclick="event.stopPropagation(); window.confirmDeleteContact(${c.id})"><i class="ph-light ph-trash"></i></button>
                </div>
            </div>
        `).join('');
    }

    let columnsHtml = '';
    columns.forEach(col => {
        columnsHtml += `
            <div class="kanban-column" data-status="${col.id}">
                <div class="kanban-column-header">
                    <div class="k-col-title-row">
                        <span class="k-col-title">${col.name}</span>
                        <div class="k-col-actions">
                            <i class="ph-light ph-pencil-simple" style="cursor:pointer; margin-right: 8px; font-size: 14px; opacity: 0.6;" onclick="window.editColumnName('${col.id}')"></i>
                            <i class="ph-light ph-plus" style="cursor:pointer;" onclick="document.getElementById('btn-novo-contato').click()"></i>
                            <i class="ph-light ph-dots-three-vertical" style="cursor:pointer;"></i>
                        </div>
                    </div>
                    <div class="k-col-subtitle">
                        Total: R$ ${currentContacts.filter(c => c.status === col.id).reduce((acc, c) => acc + (parseFloat(c.value) || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - ${currentContacts.filter(c => c.status === col.id).length} negócios
                    </div>
                </div>
                <div class="kanban-cards">
                    ${generateCardsHtml(col.id)}
                </div>
            </div>
        `;
    });

    div.innerHTML = `
        <div class="pipeline-header">
            <h1>Pipeline de Contatos</h1>
            <div class="pipeline-header-actions">
                <button class="btn-secondary" onclick="window.addNewColumn()"><i class="ph-light ph-layout"></i> Nova Coluna</button>
            </div>
        </div>
        <div class="pipeline-content">
            <div class="kanban-board">
                ${columnsHtml}
            </div>
        </div>

        <!-- Modal do Novo Contato -->
        <div class="modal-overlay" id="modal-novo-contato">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Cadastrar Novo Contato</h2>
                    <button class="close-btn" id="fechar-modal"><i class="ph-light ph-x"></i></button>
                </div>
                <form id="form-novo-contato">
                    <div class="modal-body">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Nome Completo*</label>
                                <input type="text" id="c-nome" required>
                            </div>
                            <div class="form-group">
                                <label>WhatsApp</label>
                                <input type="text" id="c-whatsapp" placeholder="(00) 00000-0000">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group" style="flex: 2;">
                                <label>Endereço</label>
                                <input type="text" id="c-endereco">
                            </div>
                            <div class="form-group" style="flex: 1;">
                                <label>Número</label>
                                <input type="text" id="c-numero">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Bairro</label>
                                <input type="text" id="c-bairro">
                            </div>
                            <div class="form-group">
                                <label>Cidade</label>
                                <input type="text" id="c-cidade">
                            </div>
                            <div class="form-group">
                                <label>Estado</label>
                                <input type="text" id="c-estado" placeholder="UF" maxlength="2">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Gênero</label>
                                <select id="c-genero">
                                    <option value="">Selecione...</option>
                                    <option value="Masculino">Masculino</option>
                                    <option value="Feminino">Feminino</option>
                                    <option value="Outro">Outro</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Valor do Negócio (R$)</label>
                                <input type="number" id="c-valor" placeholder="0.00" step="0.01">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Status Inicial / Tag</label>
                                <select id="c-status">
                                    ${App.getPipelineColumns().map(col => `
                                        <option value="${col.id}">${col.name}</option>
                                    `).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Tags (separadas por vírgula)</label>
                                <input type="text" id="c-tags" placeholder="Ex: Lead, VIP, Ganhou">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Observação</label>
                            <textarea id="c-obs"></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" id="btn-cancelar">Cancelar</button>
                        <button type="submit" class="btn-primary" id="btn-salvar-contato">Salvar Contato</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    window.editColumnName = function (statusId) {
        const cols = App.getPipelineColumns();
        const col = cols.find(c => c.id === statusId);
        if (col) {
            const newName = prompt(`Novo nome para a coluna "${col.name}":`, col.name);
            if (newName && newName.trim() !== "") {
                col.name = newName.trim();
                App.savePipelineColumns(cols);
                App.navigateTo('negocios');
            }
        }
    };

    window.addNewColumn = function () {
        const name = prompt("Nome da nova coluna:");
        if (name && name.trim() !== "") {
            const cols = App.getPipelineColumns();
            const id = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();
            cols.push({ id, name: name.trim() });
            App.savePipelineColumns(cols);
            App.navigateTo('negocios');
        }
    };

    window.showMoveToMenu = function (event, contactId) {
        // Remove existing menu if any
        const existing = document.querySelector('.move-to-menu');
        if (existing) existing.remove();

        const menu = document.createElement('div');
        menu.className = 'move-to-menu';

        const cols = App.getPipelineColumns();
        const contact = window.getContacts().find(c => c.id === contactId);

        menu.innerHTML = `
            <div class="move-to-header">Mover para...</div>
            ${cols.map(col => `
                <div class="move-to-item ${contact && contact.status === col.id ? 'active' : ''}" onclick="window.executeMoveContact(${contactId}, '${col.id}')">
                    <i class="ph-light ph-caret-right"></i>
                    ${col.name}
                </div>
            `).join('')}
        `;

        document.body.appendChild(menu);

        // Position the menu
        const rect = event.currentTarget.getBoundingClientRect();
        menu.style.top = (rect.bottom + window.scrollY + 5) + 'px';
        menu.style.left = (rect.left + window.scrollX - 100) + 'px';

        // Close when clicking outside
        const closeMenu = (e) => {
            if (!menu.contains(e.target) && e.target !== event.currentTarget) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        setTimeout(() => document.addEventListener('click', closeMenu), 0);
    };

    window.executeMoveContact = function (contactId, newStatus) {
        if (window.updateContactStatus) {
            window.updateContactStatus(contactId, newStatus);
            App.navigateTo('negocios'); // Refresh view

            // Remove menu
            const menu = document.querySelector('.move-to-menu');
            if (menu) menu.remove();
        }
    };

    return div;
}

function setupKanbanAndModal(container) {
    // Modal Logic
    const modal = container.querySelector('#modal-novo-contato');
    const btnNovo = container.querySelector('#btn-novo-contato');
    const btnFechar = container.querySelector('#fechar-modal');
    const btnCancelar = container.querySelector('#btn-cancelar');
    const form = container.querySelector('#form-novo-contato');
    const modalTitle = container.querySelector('.modal-header h2');
    let editingId = null;

    const closeModal = () => {
        modal.classList.remove('active');
        editingId = null;
    };
    const openModal = () => {
        form.reset();
        modalTitle.innerText = 'Cadastrar Novo Contato';
        editingId = null;
        modal.classList.add('active');
    };

    window.editContact = function (id) {
        const contact = window.getContacts ? window.getContacts().find(c => c.id === id) : null;
        if (contact) {
            editingId = id;
            modalTitle.innerText = 'Editar Contato';
            container.querySelector('#c-nome').value = contact.name || '';
            container.querySelector('#c-whatsapp').value = contact.whatsapp || '';
            container.querySelector('#c-endereco').value = contact.address || '';
            container.querySelector('#c-numero').value = contact.number || '';
            container.querySelector('#c-bairro').value = contact.neighborhood || '';
            container.querySelector('#c-cidade').value = contact.city || '';
            container.querySelector('#c-estado').value = contact.state || '';
            container.querySelector('#c-genero').value = contact.gender || '';
            container.querySelector('#c-status').value = contact.status || 'entrada';
            container.querySelector('#c-valor').value = contact.value || '';
            container.querySelector('#c-tags').value = (contact.tags || []).join(', ');
            container.querySelector('#c-obs').value = contact.observation || '';
            modal.classList.add('active');
        }
    };

    btnNovo.addEventListener('click', openModal);
    btnFechar.addEventListener('click', closeModal);
    btnCancelar.addEventListener('click', closeModal);

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const data = {
            name: container.querySelector('#c-nome').value,
            whatsapp: container.querySelector('#c-whatsapp').value,
            address: container.querySelector('#c-endereco').value,
            number: container.querySelector('#c-numero').value,
            neighborhood: container.querySelector('#c-bairro').value,
            city: container.querySelector('#c-cidade').value,
            state: container.querySelector('#c-estado').value,
            gender: container.querySelector('#c-genero').value,
            status: container.querySelector('#c-status').value,
            value: container.querySelector('#c-valor').value,
            observation: container.querySelector('#c-obs').value,
            tags: container.querySelector('#c-tags').value.split(',').map(t => t.trim()).filter(t => t.length > 0)
        };

        if (editingId && window.updateContact) {
            window.updateContact(editingId, data);
            closeModal();
            App.navigateTo(editingId ? 'contatos' : document.querySelector('.pipeline-container') ? 'negocios' : 'contatos'); // Handle fallback safely
        } else if (!editingId && window.addContact) {
            window.addContact(data);
            closeModal();
            App.navigateTo(document.querySelector('.pipeline-container') ? 'negocios' : 'contatos');
        }
    });

    // Drag and Drop Logic
    const cards = container.querySelectorAll('.kanban-card');
    const columns = container.querySelectorAll('.kanban-column');

    cards.forEach(card => {
        card.addEventListener('dragstart', () => {
            card.classList.add('dragging');
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
        });
    });

    columns.forEach(column => {
        column.addEventListener('dragover', e => {
            e.preventDefault();
            const draggingCard = container.querySelector('.dragging');
            const cardsContainer = column.querySelector('.kanban-cards');
            const afterElement = getDragAfterElement(cardsContainer, e.clientY);

            column.classList.add('drag-over');

            if (afterElement == null) {
                cardsContainer.appendChild(draggingCard);
            } else {
                cardsContainer.insertBefore(draggingCard, afterElement);
            }
        });

        column.addEventListener('dragleave', () => {
            column.classList.remove('drag-over');
        });

        column.addEventListener('drop', e => {
            column.classList.remove('drag-over');
            const draggingCard = container.querySelector('.dragging');
            if (draggingCard) {
                const newStatus = column.getAttribute('data-status');
                const contactId = parseInt(draggingCard.getAttribute('data-id'));

                draggingCard.setAttribute('data-status', newStatus);

                if (window.updateContactStatus) {
                    const triggers = JSON.parse(localStorage.getItem('crm_voice_triggers') || '[]');
                    const trigger = triggers.find(t => t.event === newStatus && t.active);

                    if (trigger) {
                        window.showQuickScheduleModal(contactId, newStatus, trigger.messageId, trigger.delayDays, trigger.delayHours, trigger.mediaType || 'texto');
                    } else {
                        window.updateContactStatus(contactId, newStatus);
                    }

                    // Update Map
                    if (window.renderAllContactsOnMap && window.getContacts) {
                        window.renderAllContactsOnMap(window.getContacts());
                    }
                    updateColumnCounters(container);
                }
            }
        });
    });

    function getDragAfterElement(cardsContainer, y) {
        const draggableElements = [...cardsContainer.querySelectorAll('.kanban-card:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
}

function updateColumnCounters(container) {
    const columns = container.querySelectorAll('.kanban-column');
    columns.forEach(col => {
        const countSpan = col.querySelector('.kanban-column-header span:nth-child(2)');
        const cardCount = col.querySelectorAll('.kanban-card').length;
        if (countSpan) countSpan.textContent = cardCount;
    });
}

window.confirmDeleteContact = function (id) {
    if (confirm("Tem certeza que deseja excluir esse contato?")) {
        if (window.deleteContact) {
            window.deleteContact(id);
            // If viewing contatos, refresh pipeline or base
            const mainContent = document.getElementById('main-content');
            if (mainContent.querySelector('.pipeline-container')) {
                App.navigateTo('negocios');
            } else if (mainContent.querySelector('.contacts-list-container')) {
                App.navigateTo('contatos');
            }
        }
    }
};

function renderContatosView() {
    const div = document.createElement('div');
    div.className = 'contacts-list-container';

    const currentContacts = window.getContacts ? window.getContacts() : [];

    const statusLabels = {
        'entrada': 'Entrada / Qualificação',
        'agendamento': 'Em agendamento',
        'follow_up': 'Follow Up',
        'reuniao': 'Reunião Agendada',
        'no_show': 'No-Show',
        'ganhou': 'Ganhou / Fechado',
        'perdido': 'Perdido'
    };

    let rowsHtml = '';
    currentContacts.forEach(c => {
        rowsHtml += `
            <tr data-id="${c.id}" style="cursor: pointer;" onclick="if(window.editContact) window.editContact(${c.id})">
                <td>
                    <div class="contact-name-cell">
                        <div class="contact-avatar">${c.name.charAt(0).toUpperCase()}</div>
                        <div class="contact-name-info">
                            <span class="c-name">${c.name}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <div style="display:flex; align-items:center; gap:6px;">
                        <i class="ph-light ph-whatsapp-logo" style="color: #25D366; font-size: 16px;"></i>
                        <a href="https://wa.me/${c.whatsapp || ''}?text=Olá" target="_blank" style="text-decoration:none; color:inherit;">
                            ${c.whatsapp || '-'}
                        </a>
                    </div>
                </td>
                <td>
                    ${c.city || c.state ? `<i class="ph-light ph-map-pin"></i> ${c.city || ''} ${c.state || ''}` : '-'}
                </td>
                <td>
                    <span class="status-badge ${c.status}">${statusLabels[c.status] || c.status}</span>
                    <div style="margin-top:4px; display:flex; gap:4px; flex-wrap:wrap;">
                        ${(c.tags || []).map(t => `<span style="font-size:10px; background:#e2e8f0; color:#475569; padding:2px 6px; border-radius:8px;">${t}</span>`).join('')}
                    </div>
                </td>
                <td>
                    R$ ${parseFloat(c.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td class="actions-cell">
                    <button class="btn-icon" onclick="event.stopPropagation(); window.editContact(${c.id})" title="Editar"><i class="ph-light ph-pencil-simple"></i></button>
                    <button class="btn-icon delete" onclick="event.stopPropagation(); window.confirmDeleteContact(${c.id})" title="Excluir"><i class="ph-light ph-trash"></i></button>
                </td>
            </tr>
        `;
    });

    div.innerHTML = `
        <div class="contacts-list-header">
            <div class="cl-title-area">
                <h1>Base de Contatos</h1>
                <p>Gerencie todos os contatos registrados no sistema.</p>
            </div>
            <div class="cl-actions">
                <div class="search-box">
                    <i class="ph-light ph-magnifying-glass"></i>
                    <input type="text" placeholder="Buscar contato...">
                </div>
                <button class="btn-primary" id="btn-novo-contato-base"><i class="ph-light ph-plus"></i> Novo Contato</button>
            </div>
        </div>

        <div class="contacts-split-view">
            <div class="contacts-table-wrapper">
                <table class="contacts-table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>WhatsApp</th>
                            <th>Localização</th>
                            <th>Status Inicial</th>
                            <th>Valor</th>
                            <th style="width: 100px; text-align: center;">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml.length > 0 ? rowsHtml : '<tr><td colspan="6" style="text-align:center; padding: 2rem;">Nenhum contato encontrado.</td></tr>'}
                    </tbody>
                </table>
            </div>
            <div class="contacts-map-wrapper">
                <div id="contacts-map"></div>
            </div>
        </div>

        <!-- Reaproveitando Modal Localmente (poderia ser isolada futuramente) -->
        <div class="modal-overlay" id="modal-novo-contato">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Cadastrar Novo Contato</h2>
                    <button class="close-btn" id="fechar-modal"><i class="ph-light ph-x"></i></button>
                </div>
                <form id="form-novo-contato">
                    <div class="modal-body">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Nome Completo*</label>
                                <input type="text" id="c-nome" required>
                            </div>
                            <div class="form-group">
                                <label>WhatsApp</label>
                                <input type="text" id="c-whatsapp" placeholder="(00) 00000-0000">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group" style="flex: 2;">
                                <label>Endereço</label>
                                <input type="text" id="c-endereco">
                            </div>
                            <div class="form-group" style="flex: 1;">
                                <label>Número</label>
                                <input type="text" id="c-numero">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Bairro</label>
                                <input type="text" id="c-bairro">
                            </div>
                            <div class="form-group">
                                <label>Cidade</label>
                                <input type="text" id="c-cidade">
                            </div>
                            <div class="form-group">
                                <label>Estado</label>
                                <input type="text" id="c-estado" placeholder="UF" maxlength="2">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Gênero</label>
                                <select id="c-genero">
                                    <option value="">Selecione...</option>
                                    <option value="Masculino">Masculino</option>
                                    <option value="Feminino">Feminino</option>
                                    <option value="Outro">Outro</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Valor do Negócio (R$)</label>
                                <input type="number" id="c-valor" placeholder="0.00" step="0.01">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Status Inicial / Tag</label>
                                <select id="c-status">
                                    ${App.getPipelineColumns().map(col => `
                                        <option value="${col.id}">${col.name}</option>
                                    `).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Tags (separadas por vírgula)</label>
                                <input type="text" id="c-tags" placeholder="Ex: Lead, VIP, Ganhou">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Observação</label>
                            <textarea id="c-obs"></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" id="btn-cancelar">Cancelar</button>
                        <button type="submit" class="btn-primary" id="btn-salvar-contato">Salvar Contato</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    setTimeout(() => {
        if (window.initPipelineMap) {
            window.initPipelineMap('contacts-map', currentContacts);
        }
        setupContactsBaseModal(div);
    }, 150);

    return div;
}

function setupContactsBaseModal(container) {
    const modal = container.querySelector('#modal-novo-contato');
    const btnNovo = container.querySelector('#btn-novo-contato-base');
    const btnFechar = container.querySelector('#fechar-modal');
    const btnCancelar = container.querySelector('#btn-cancelar');
    const form = container.querySelector('#form-novo-contato');
    const modalTitle = container.querySelector('.modal-header h2');
    let editingId = null;

    const closeModal = () => {
        modal.classList.remove('active');
        editingId = null;
    };
    const openModal = () => {
        form.reset();
        modalTitle.innerText = 'Cadastrar Novo Contato';
        editingId = null;
        modal.classList.add('active');
    };

    window.editContactBase = function (id) {
        const contact = window.getContacts ? window.getContacts().find(c => c.id === id) : null;
        if (contact) {
            editingId = id;
            modalTitle.innerText = 'Editar Contato';
            container.querySelector('#c-nome').value = contact.name || '';
            container.querySelector('#c-whatsapp').value = contact.whatsapp || '';
            container.querySelector('#c-endereco').value = contact.address || '';
            container.querySelector('#c-numero').value = contact.number || '';
            container.querySelector('#c-bairro').value = contact.neighborhood || '';
            container.querySelector('#c-cidade').value = contact.city || '';
            container.querySelector('#c-estado').value = contact.state || '';
            container.querySelector('#c-genero').value = contact.gender || '';
            container.querySelector('#c-status').value = contact.status || 'entrada';
            container.querySelector('#c-valor').value = contact.value || '';
            container.querySelector('#c-tags').value = (contact.tags || []).join(', ');
            container.querySelector('#c-obs').value = contact.observation || '';
            modal.classList.add('active');
        }
    };

    // Override editContact to support the base directly if called from Base
    window.editContact = window.editContactBase;

    btnNovo.addEventListener('click', openModal);
    btnFechar.addEventListener('click', closeModal);
    btnCancelar.addEventListener('click', closeModal);

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const data = {
            name: container.querySelector('#c-nome').value,
            whatsapp: container.querySelector('#c-whatsapp').value,
            address: container.querySelector('#c-endereco').value,
            number: container.querySelector('#c-numero').value,
            neighborhood: container.querySelector('#c-bairro').value,
            city: container.querySelector('#c-cidade').value,
            state: container.querySelector('#c-estado').value,
            gender: container.querySelector('#c-genero').value,
            status: container.querySelector('#c-status').value,
            value: container.querySelector('#c-valor').value,
            observation: container.querySelector('#c-obs').value,
            tags: container.querySelector('#c-tags') ? container.querySelector('#c-tags').value.split(',').map(t => t.trim()).filter(t => t.length > 0) : []
        };

        if (editingId && window.updateContact) {
            window.updateContact(editingId, data);
            closeModal();
            App.navigateTo('contatos');
        } else if (!editingId && window.addContact) {
            window.addContact(data);
            closeModal();
            App.navigateTo('contatos');
        }
    });

    // Simple search filtering
    const searchInput = container.querySelector('.search-box input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const rows = container.querySelectorAll('.contacts-table tbody tr[data-id]');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(term) ? '' : 'none';
            });
        });
    }
}

// --- DS TRACK VIEWS ---

function renderDsTrackDashboard() {
    const div = document.createElement('div');
    div.className = 'dstrack-layout';
    div.innerHTML = `
        <div class="page-header">
            <div>
                <div class="greeting">Visão Geral</div>
                <h2 class="company-name">Dashboard Social</h2>
            </div>
            <button class="btn-primary" onclick="App.navigateTo('dstrack-postagens')"><i class="ph-light ph-calendar-plus"></i> Novo Agendamento</button>
        </div>

        <div class="stats-grid">
            <div class="stat-card-premium">
                <div class="stat-icon instagram"><i class="ph-light ph-instagram-logo"></i></div>
                <div class="stat-value">12.4k</div>
                <div class="stat-label">Seguidores Instagram</div>
            </div>
            <div class="stat-card-premium">
                <div class="stat-icon facebook"><i class="ph-light ph-facebook-logo"></i></div>
                <div class="stat-value">8.2k</div>
                <div class="stat-label">Seguidores Facebook</div>
            </div>
            <div class="stat-card-premium">
                <div class="stat-icon" style="background:#f0fdf4; color:#10b981;"><i class="ph-light ph-chat-circle"></i></div>
                <div class="stat-value">48</div>
                <div class="stat-label">Novas Mensagens</div>
            </div>
            <div class="stat-card-premium">
                <div class="stat-icon" style="background:#fff7ed; color:#f97316;"><i class="ph-light ph-chat-teardrop-dots"></i></div>
                <div class="stat-value">156</div>
                <div class="stat-label">Comentários Pendentes</div>
            </div>
        </div>

        <div style="margin-top: 24px; display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
            <div class="stat-card-premium" style="height: 300px;">
                <h4 style="margin-bottom: 20px;">Engajamento Semanal</h4>
                <div style="flex:1; display:flex; align-items:flex-end; gap:12px; padding: 20px 0;">
                    ${[40, 70, 45, 90, 65, 80, 55].map(h => `<div style="flex:1; height:${h}%; background:var(--brand-color); border-radius:4px; opacity:0.8;"></div>`).join('')}
                </div>
                <div style="display:flex; justify-content:space-between; font-size:10px; color:var(--text-tertiary);">
                    <span>SEG</span><span>TER</span><span>QUA</span><span>QUI</span><span>SEX</span><span>SÁB</span><span>DOM</span>
                </div>
            </div>
            <div class="stat-card-premium">
                <h4>Próximos Posts</h4>
                <div style="display:flex; flex-direction:column; gap:12px; margin-top:16px;">
                    <div style="display:flex; align-items:center; gap:12px; font-size:12px;">
                        <div style="width:40px; height:40px; background:#eee; border-radius:8px;"></div>
                        <div>
                            <div style="font-weight:600;">Promoção Verão</div>
                            <div style="color:var(--text-tertiary);">Hoje, 18:00 • Instagram</div>
                        </div>
                    </div>
                    <div style="display:flex; align-items:center; gap:12px; font-size:12px;">
                        <div style="width:40px; height:40px; background:#eee; border-radius:8px;"></div>
                        <div>
                            <div style="font-weight:600;">Dica de Uso #4</div>
                            <div style="color:var(--text-tertiary);">Amanhã, 09:00 • Facebook</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    return div;
}

// --- SOCIAL MESSAGING STATE ---
let socialState = {
    platform: 'instagram',
    activeChat: null,
    chats: {
        instagram: [],
        facebook: []
    }
};

async function renderDsTrackMessages() {
    const div = document.createElement('div');
    div.className = 'dstrack-layout';

    const scrollToBottom = () => {
        const history = div.querySelector('.chat-history');
        if (history) {
            history.scrollTop = history.scrollHeight;
        }
    };

    const updateUI = async (shouldScroll = true, isInitialSync = false) => {
        const connections = await window.getSocialConnections();
        const conn = connections[socialState.platform];

        // --- 1. HANDLE DISCONNECTED STATE ---
        if (!conn || !conn.connected) {
            div.innerHTML = `
                <div class="page-header">
                    <div>
                        <div class="greeting">Atendimento Omnichannel</div>
                        <h2 class="company-name">Mensagens Sociais</h2>
                    </div>
                </div>

                <div class="social-platforms-bar">
                    <div class="platform-pill ${socialState.platform === 'instagram' ? 'active instagram' : ''}" onclick="socialState.platform='instagram'; updateUI()"><i class="ph-light ph-instagram-logo"></i> Instagram</div>
                    <div class="platform-pill ${socialState.platform === 'facebook' ? 'active facebook' : ''}" onclick="socialState.platform='facebook'; updateUI()"><i class="ph-light ph-facebook-logo"></i> Facebook</div>
                </div>

                <div class="stat-card-premium" style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:60px; text-align:center;">
                    <div class="platform-icon-circle" style="width:80px; height:80px; font-size:40px; margin-bottom:24px; color:${socialState.platform === 'instagram' ? '#e1306c' : '#1877f2'};">
                        <i class="ph-light ph-${socialState.platform}-logo"></i>
                    </div>
                    <h3 style="margin-bottom:12px;">Conecte seu ${socialState.platform === 'instagram' ? 'Instagram' : 'Facebook'}</h3>
                    <p style="color:var(--text-secondary); max-width:400px; margin-bottom:32px;">Para gerenciar suas mensagens e automatizar seu atendimento, você precisa vincular sua conta oficial.</p>
                    <button class="btn-primary" onclick="App.navigateTo('dstrack-conexao')">
                        <i class="ph-light ph-link"></i> Vincular Agora
                    </button>
                </div>
            `;
            return;
        }

        // --- 2. FETCH MESSAGES FROM BACKEND ---
        if (isInitialSync) {
            div.innerHTML = `
                <div style="flex:1; display:flex; align-items:center; justify-content:center; flex-direction:column;">
                    <div class="loading-spinner" style="width:40px; height:40px; border:3px solid #f3f3f3; border-top:3px solid var(--brand-color); border-radius:50%; animation: spin 1s linear infinite; margin-bottom:16px;"></div>
                    <span style="font-weight:600; color:var(--text-secondary);">Sincronizando conversas do @${conn.username}...</span>
                </div>
            `;

            try {
                const res = await fetch(`/api/messages/${socialState.platform}`);
                if (res.ok) {
                    socialState.chats[socialState.platform] = await res.json();
                }
            } catch (e) {
                console.warn('Erro ao buscar mensagens', e);
            }

            updateUI(true, false);
            return;
        }

        const platformChats = socialState.chats[socialState.platform] || [];
        const activeChatData = platformChats.find(c => c.id === socialState.activeChat) || platformChats[0];
        if (activeChatData) socialState.activeChat = activeChatData.id;
        else socialState.activeChat = null;

        div.innerHTML = `
            <div class="page-header">
                <div>
                    <div class="greeting">Inbox de @${conn.username}</div>
                    <h2 class="company-name">Mensagens Sociais</h2>
                </div>
            </div>

            <div class="social-platforms-bar">
                <div class="platform-pill ${socialState.platform === 'instagram' ? 'active instagram' : ''}" data-platform="instagram"><i class="ph-light ph-instagram-logo"></i> Instagram</div>
                <div class="platform-pill ${socialState.platform === 'facebook' ? 'active facebook' : ''}" data-platform="facebook"><i class="ph-light ph-facebook-logo"></i> Facebook</div>
            </div>

            <div class="social-inbox-layout">
                <div class="inbox-sidebar">
                    <div style="padding: 16px; border-bottom: 1px solid var(--border-color); display:flex; align-items:center; gap:12px; background:#f8fafc;">
                        <div class="chat-avatar" style="width:32px; height:32px; background-image: url(${conn.avatar || 'https://i.pravatar.cc/150?u=' + conn.username}); background-size: cover;"></div>
                        <span style="font-size:12px; font-weight:700; color:var(--text-primary);">Sua Conta</span>
                    </div>
                    <div style="padding: 12px 16px;">
                        <div class="search-box">
                            <i class="ph-light ph-magnifying-glass"></i>
                            <input type="text" placeholder="Buscar conversa...">
                        </div>
                    </div>
                    <div class="inbox-list">
                        ${platformChats.map(chat => `
                            <div class="chat-item ${socialState.activeChat === chat.id ? 'active ' + socialState.platform : ''}" data-id="${chat.id}">
                                <div class="chat-avatar" style="background-image: url(${chat.avatar}); background-size: cover;">
                                    <div class="platform-badge ${socialState.platform}"><i class="ph-light ph-${socialState.platform}-logo"></i></div>
                                </div>
                                <div style="flex:1">
                                    <div style="display:flex; justify-content:space-between; align-items:center;">
                                        <span style="font-weight:600; font-size:14px;">${chat.name}</span>
                                        <span style="font-size:10px; color:var(--text-tertiary);">${chat.time}</span>
                                    </div>
                                    <div style="font-size:12px; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${chat.lastMsg}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="chat-main ${socialState.platform}">
                    ${activeChatData ? `
                    <div style="padding:16px; border-bottom:1px solid var(--border-color); display:flex; align-items:center; gap:12px;">
                        <div class="chat-avatar" style="background-image: url(${activeChatData.avatar}); background-size: cover;"></div>
                        <div>
                            <div style="font-weight:600;">${activeChatData.name}</div>
                            <div style="font-size:11px; color:${activeChatData.online ? '#10b981' : 'var(--text-tertiary)'};">
                                ${activeChatData.online ? 'Online agora' : 'Offline'}
                            </div>
                        </div>
                    </div>
                    <div class="chat-history">
                        ${activeChatData.messages.map(msg => `
                            <div class="msg-row ${msg.type}">
                                <div class="msg-bubble">${msg.text}</div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="chat-input-area">
                        <button class="btn-icon"><i class="ph-light ph-paperclip"></i></button>
                        <input type="text" id="social-msg-input" placeholder="Responder como @${conn.username}..." style="flex:1; border: 1px solid var(--border-color); padding: 8px 16px; border-radius: 20px; outline:none;">
                        <button class="btn-primary" id="btn-send-social"><i class="ph-light ph-paper-plane-right"></i></button>
                    </div>
                    ` : `
                    <div style="flex:1; display:flex; align-items:center; justify-content:center; flex-direction:column; color:var(--text-tertiary);">
                        <i class="ph-light ph-chat-circle-dots" style="font-size:48px; margin-bottom:16px; opacity:0.3;"></i>
                        <span>Selecione uma conversa para começar</span>
                    </div>
                    `}
                </div>
            </div>
        `;

        // Scroll after DOM update
        if (shouldScroll) {
            setTimeout(scrollToBottom, 0);
        }

        // Event Listeners
        div.querySelectorAll('.platform-pill').forEach(pill => {
            pill.onclick = () => {
                socialState.platform = pill.getAttribute('data-platform');
                const firstChat = socialState.chats[socialState.platform][0];
                socialState.activeChat = firstChat ? firstChat.id : null;
                updateUI(true, true); // Sync on platform switch
            };
        });

        div.querySelectorAll('.chat-item').forEach(item => {
            item.onclick = () => {
                socialState.activeChat = parseInt(item.getAttribute('data-id'));
                updateUI();
            };
        });

        const sendBtn = div.querySelector('#btn-send-social');
        const input = div.querySelector('#social-msg-input');
        if (sendBtn && input) {
            const sendMessage = async () => {
                const text = input.value.trim();
                if (!text || !socialState.activeChat) return;

                // Optimistic UI update
                const chat = socialState.chats[socialState.platform].find(c => c.id === socialState.activeChat);
                if (chat) {
                    chat.messages.push({ type: 'sent', text: text });
                    chat.lastMsg = text;
                    input.value = '';
                    updateUI(true);

                    try {
                        await fetch('/api/messages/send', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                platform: socialState.platform,
                                chatId: socialState.activeChat,
                                text: text
                            })
                        });
                    } catch (e) {
                        console.warn('Erro ao enviar mensagem', e);
                    }
                }
            };

            sendBtn.onclick = sendMessage;
            input.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };
        }
    };

    await updateUI(true, true); // Initial sync fetch
    return div;
}

// --- DS TRACK HELPERS ---

window.getScheduledPosts = function () {
    const posts = localStorage.getItem('crm_social_posts');
    if (posts) return JSON.parse(posts);

    // Initial mock data if empty
    const initial = [
        { id: 101, day: 1, platform: 'instagram', type: 'feed', caption: 'Post Promo de Verão! ☀️ Confira nossas ofertas.', time: '18:00', thumb: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=100&h=100&fit=crop' },
        { id: 102, day: 3, platform: 'facebook', type: 'feed', caption: 'Dica Semanal: Como usar o CRM da melhor forma.', time: '09:00', thumb: '' },
        { id: 103, day: 6, platform: 'instagram', type: 'reels', caption: 'Reels Novo: Bastidores da nossa equipe!', time: '20:00', thumb: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=100&h=100&fit=crop' }
    ];
    localStorage.setItem('crm_social_posts', JSON.stringify(initial));
    return initial;
};

window.saveScheduledPost = function (postData) {
    const posts = window.getScheduledPosts();
    if (postData.id) {
        const index = posts.findIndex(p => p.id === postData.id);
        if (index !== -1) posts[index] = postData;
        else posts.push(postData);
    } else {
        postData.id = Date.now();
        posts.push(postData);
    }
    localStorage.setItem('crm_social_posts', JSON.stringify(posts));
};

function renderDsTrackPostagens() {
    const div = document.createElement('div');
    div.className = 'dstrack-layout';

    const scheduledPosts = window.getScheduledPosts();

    const renderPostEntry = (post) => `
        <div class="post-entry ${post.platform}" onclick="window.showNewPostModal(${JSON.stringify(post).replace(/"/g, '&quot;')})">
            <div class="post-thumb" ${post.thumb ? `style="background-image:url(${post.thumb})"` : ''}>
                ${!post.thumb ? `<i class="ph-light ph-${post.platform === 'instagram' ? 'instagram-logo' : 'facebook-logo'}"></i>` : ''}
            </div>
            <div class="post-entry-info">
                <span class="post-entry-text">${post.caption}</span>
                <span class="post-entry-time">${post.time} • ${post.type}</span>
            </div>
        </div>
    `;

    div.innerHTML = `
        <div class="page-header">
            <div>
                <div class="greeting">Planejamento de Conteúdo</div>
                <h2 class="company-name">Agendador de Posts</h2>
            </div>
            <button class="btn-primary" onclick="window.showNewPostModal()"><i class="ph-light ph-plus"></i> Novo Post</button>
        </div>

        <div style="background:white; border-radius:16px; border: 1px solid var(--border-color); padding: 24px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h3 style="font-size:16px;">Março 2026</h3>
                <div style="display:flex; gap:8px;">
                    <button class="btn-icon"><i class="ph-light ph-caret-left"></i></button>
                    <button class="btn-icon"><i class="ph-light ph-caret-right"></i></button>
                </div>
            </div>
            
            <div class="scheduler-grid">
                ${['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map(d => `<div style="background:#f8fafc; padding:8px; font-size:11px; font-weight:700; text-align:center; color:var(--text-secondary); border-bottom: 1px solid var(--border-color);">${d}</div>`).join('')}
                ${Array.from({ length: 31 }, (_, i) => {
        const day = i + 1;
        const postsDay = scheduledPosts.filter(p => p.day === day);
        return `
                        <div class="calendar-day">
                            <span class="day-num">${day}</span>
                            ${postsDay.map(p => renderPostEntry(p)).join('')}
                        </div>
                    `;
    }).join('')}
            </div>
        </div>
    `;
    return div;
}

function renderDsTrackComentarios() {
    const div = document.createElement('div');
    div.className = 'dstrack-layout';
    div.innerHTML = `
        <div class="page-header">
            <div>
                <div class="greeting">Engajamento Social</div>
                <h2 class="company-name">Comentários e Menções</h2>
            </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:16px;">
            ${[
            { user: 'carla_pereira', text: 'Amei esse novo modelo! 😍', platform: 'instagram', post: 'Promoção Verão' },
            { user: 'Joao Victor', text: 'Qual o valor do frete para o nordeste?', platform: 'facebook', post: 'Dica de Uso #4' },
            { user: 'marcos_fit', text: 'Vocês têm loja física em SP?', platform: 'instagram', post: 'Promoção Verão' }
        ].map(c => `
                <div class="stat-card-premium" style="flex-direction:row; justify-content:space-between; align-items:center; padding:16px 24px;">
                    <div style="display:flex; align-items:center; gap:16px;">
                        <div class="chat-avatar">
                            <div class="platform-badge ${c.platform}"><i class="ph-light ph-${c.platform}-logo"></i></div>
                        </div>
                        <div>
                            <div style="font-size:14px;"><span style="font-weight:700;">@${c.user}</span> comentou em <span style="font-weight:600; color:var(--brand-color);">${c.post}</span></div>
                            <div style="font-size:13px; color:var(--text-secondary); margin-top:4px;">"${c.text}"</div>
                        </div>
                    </div>
                    <div style="display:flex; gap:8px;">
                        <button class="btn-icon" title="Curtir"><i class="ph-light ph-heart"></i></button>
                        <button class="btn-icon" title="Responder"><i class="ph-light ph-chat-text"></i></button>
                        <button class="btn-icon" title="Ocultar"><i class="ph-light ph-eye-slash"></i></button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    return div;
}

// --- SOCIAL CONNECTION HELPERS ---

window.getSocialConnections = async function () {
    const defaultConns = {
        instagram: { connected: false, username: 'Sua Empresa (Instagram)', api: 'Graph v18.0', lastSync: '--' },
        facebook: { connected: false, username: 'Sua Empresa (Facebook)', api: 'Pages API', lastSync: '--' }
    };

    try {
        const response = await fetch('/api/connections');
        if (response.ok) {
            const data = await response.json();
            return {
                instagram: { ...defaultConns.instagram, ...(data.instagram || {}) },
                facebook: { ...defaultConns.facebook, ...(data.facebook || {}) }
            };
        }
    } catch (e) {
        console.warn('Erro ao buscar conexões do backend, usando defaults', e);
    }

    // Fallback default
    const saved = localStorage.getItem('crm_social_connections');
    if (saved) {
        const parsed = JSON.parse(saved);
        return {
            instagram: { ...defaultConns.instagram, ...(parsed.instagram || {}) },
            facebook: { ...defaultConns.facebook, ...(parsed.facebook || {}) }
        };
    }

    return defaultConns;
};

window.updateSocialConnection = async function (platform, data) {
    try {
        await fetch('/api/connections', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ platform, ...data })
        });
    } catch (e) {
        console.warn('Erro ao salvar conexão no backend', e);
    }

    // Mantém fallback caso o servidor local esteja offline no teste
    const conns = await window.getSocialConnections();
    conns[platform] = { ...conns[platform], ...data };
    localStorage.setItem('crm_social_connections', JSON.stringify(conns));
};

window.showSocialLoginModal = function (platform) {
    if (typeof FB === 'undefined') {
        alert("O SDK do Facebook ainda não foi carregado. Aguarde um momento.");
        return;
    }

    const isIG = platform === 'instagram';

    // Scopes needed for Pages and Instagram Graph API
    // Scopes recomendados (Perfil e E-mail não costumam dar erro de permissão)
    const scopes = 'public_profile,email';

    FB.login(function (response) {
        if (response.authResponse) {
            console.log('Bem vindo! Buscando informações da conta.... ', response);

            // Show a generic connecting state
            const loadingModal = document.createElement('div');
            loadingModal.className = 'modal-overlay active';
            loadingModal.innerHTML = `
                <div class="social-login-modal">
                    <div style="padding:40px; text-align:center;">
                        <div class="social-spinner"></div>
                        <div style="font-weight: 600; color: #262626; margin-top:16px;">Salvando conexão oficial...</div>
                    </div>
                </div>
            `;
            document.body.appendChild(loadingModal);

            const accessToken = response.authResponse.accessToken;

            // In a real scenario, we send this to the backend
            // The backend then uses the APP SECRET to verify and get a long-lived token
            FB.api('/me', function (userResponse) {
                // Update local storage / API
                window.updateSocialConnection(platform, {
                    connected: true,
                    lastSync: 'Agora mesmo',
                    username: userResponse.name || 'Conta Conectada',
                    avatar: `https://graph.facebook.com/${userResponse.id}/picture?type=large`,
                    verified: true,
                    accessToken: accessToken // Saving it locally for demo purposes, usually keep it safe in backend
                }).then(() => {
                    loadingModal.remove();
                    App.navigateTo('dstrack-conexao');
                });
            });

        } else {
            console.log('User cancelled login or did not fully authorize.');
            alert("A conexão foi cancelada ou não foi totalmente autorizada.");
        }
    }, { scope: scopes });
};


window.disconnectSocialAccount = async function (platform) {
    const name = platform === 'instagram' ? 'Instagram' : 'Facebook';
    if (confirm(`Deseja realmente desconectar sua conta do ${name} ? `)) {
        try {
            await fetch(`/api/connections/${platform}`, {
                method: 'DELETE'
            });
        } catch (e) {
            console.warn('Erro ao remover conexão no backend', e);
        }

        await window.updateSocialConnection(platform, {
            connected: false,
            username: platform === 'instagram' ? 'Loja de Teste Oficial' : 'Gerenciador de Negócios',
            avatar: null,
            verified: false
        });
        App.navigateTo('dstrack-conexao');
    }
};

window.showPlatformSelector = function () {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
        <div class="card" style="max-width: 400px; padding: 32px; border-radius: 24px; text-align: center;">
            <h3 style="margin-bottom: 24px;">Adicionar Nova Conta</h3>
            <p style="color: var(--text-secondary); margin-bottom: 32px; font-size: 14px;">Selecione a plataforma que deseja vincular ao seu CRM.</p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div class="platform-select-item" onclick="window.executeAddPlatform('instagram')">
                    <div class="platform-icon-circle" style="margin: 0 auto 12px; color: #e1306c; border-color: #e1306c;">
                        <i class="ph-light ph-instagram-logo"></i>
                    </div>
                    <span style="font-weight: 600; font-size: 14px;">Instagram</span>
                </div>
                <div class="platform-select-item" onclick="window.executeAddPlatform('facebook')">
                    <div class="platform-icon-circle" style="margin: 0 auto 12px; color: #1877f2; border-color: #1877f2;">
                        <i class="ph-light ph-facebook-logo"></i>
                    </div>
                    <span style="font-weight: 600; font-size: 14px;">Facebook</span>
                </div>
            </div>
            
            <button class="btn-icon" style="position: absolute; top: 16px; right: 16px;" onclick="this.closest('.modal-overlay').remove()">
                <i class="ph-light ph-x"></i>
            </button>
        </div>
    `;
    document.body.appendChild(modal);

    window.executeAddPlatform = function (platform) {
        modal.remove();
        window.showSocialLoginModal(platform);
    };
};

async function renderDsTrackConexao() {
    const div = document.createElement('div');
    div.className = 'dstrack-layout';

    // Show loading state temporarily
    div.innerHTML = `<div style="padding:40px; text-align:center;">Carregando conexões...</div>`;

    // Asynchronously fetch connections
    const conns = await window.getSocialConnections();

    div.innerHTML = `
        <div class="page-header">
            <div>
                <div class="greeting">Configurações das APIs</div>
                <h2 class="company-name">Conectar Contas Oficiais</h2>
            </div>
            <div class="balance-area">
                <div class="balance-text">Status Geral: <span class="balance-amount" style="color:#10b981">Monitorando</span></div>
            </div>
        </div>

        <div class="connection-grid">
            <!-- Instagram Card -->
            <div class="connection-card instagram">
                <div class="conn-header">
                    <div class="platform-info">
                        <div class="platform-icon-circle" style="${conns.instagram.avatar ? `background-image: url(${conns.instagram.avatar}); background-size: cover;` : ''}">
                            ${!conns.instagram.avatar ? '<i class="ph-light ph-instagram-logo"></i>' : ''}
                        </div>
                        <div class="platform-texts">
                            <h4 style="display:flex; align-items:center; gap:4px;">
                                Instagram App
                                ${conns.instagram.verified ? '<i class="ph-fill ph-seal-check" style="color:#0095f6; font-size:14px;"></i>' : ''}
                            </h4>
                            <span style="font-weight: 500; color: #1c1e21; opacity: 1;">${conns.instagram.username}</span>
                        </div>
                    </div>
                    <span class="conn-status-badge ${conns.instagram.connected ? 'online' : 'warning'}">
                        ${conns.instagram.connected ? 'Conectado' : 'Desconectado'}
                    </span>
                </div>

                ${conns.instagram.connected ? `
                <div class="conn-details-list">
                    <div class="conn-detail-item">
                        <i class="ph-light ph-git-branch"></i>
                        <span>Versão da API: ${conns.instagram.api}</span>
                    </div>
                    <div class="conn-detail-item">
                        <i class="ph-light ph-clock"></i>
                        <span>Última Sincronização: ${conns.instagram.lastSync}</span>
                    </div>
                    <div class="conn-detail-item">
                        <i class="ph-light ph-fingerprint"></i>
                        <span>ID da Conta: 829...312 (Meta Verified)</span>
                    </div>
                </div>
                ` : `
                <div style="padding: 20px 0; text-align: center; color: var(--text-secondary); font-size: 14px;">
                    Vincule sua conta oficial para gerenciar postagens e mensagens.
                </div>
                `}

                <div class="conn-actions">
                    ${conns.instagram.connected
            ? `<button class="btn-conn-action" onclick="window.disconnectSocialAccount('instagram')"><i class="ph-light ph-sign-out"></i> Desconectar</button>
                           <button class="btn-conn-action primary" onclick="window.showSocialLoginModal('instagram')"><i class="ph-light ph-arrows-clockwise"></i> Trocar Conta</button>`
            : `<button class="btn-conn-action"><i class="ph-light ph-gear"></i> Configurar</button>
                           <button class="btn-conn-action primary" onclick="window.showSocialLoginModal('instagram')"><i class="ph-light ph-link"></i> Vincular Agora</button>`
        }
                </div>
            </div>

            <!-- Facebook Card -->
            <div class="connection-card facebook">
                <div class="conn-header">
                    <div class="platform-info">
                        <div class="platform-icon-circle" style="${conns.facebook.avatar ? `background-image: url(${conns.facebook.avatar}); background-size: cover;` : ''}">
                            ${!conns.facebook.avatar ? '<i class="ph-light ph-facebook-logo"></i>' : ''}
                        </div>
                        <div class="platform-texts">
                            <h4 style="display:flex; align-items:center; gap:4px;">
                                Facebook Pages
                                ${conns.facebook.verified ? '<i class="ph-fill ph-seal-check" style="color:#0095f6; font-size:14px;"></i>' : ''}
                            </h4>
                            <span style="font-weight: 500; color: #1c1e21; opacity: 1;">${conns.facebook.username}</span>
                        </div>
                    </div>
                    <span class="conn-status-badge ${conns.facebook.connected ? 'online' : 'warning'}">
                        ${conns.facebook.connected ? 'Conectado' : 'Requer Ação'}
                    </span>
                </div>

                ${conns.facebook.connected ? `
                <div class="conn-details-list">
                    <div class="conn-detail-item">
                        <i class="ph-light ph-git-branch"></i>
                        <span>Versão da API: Graph v19.0</span>
                    </div>
                    <div class="conn-detail-item">
                        <i class="ph-light ph-clock"></i>
                        <span>Última Sincronização: ${conns.facebook.lastSync}</span>
                    </div>
                </div>
                <div class="conn-actions">
                    <button class="btn-conn-action" onclick="window.disconnectSocialAccount('facebook')"><i class="ph-light ph-sign-out"></i> Sair</button>
                    <button class="btn-conn-action primary" style="background:#1877f2; border-color:#1877f2;" onclick="window.showSocialLoginModal('facebook')"><i class="ph-light ph-arrows-clockwise"></i> Sincronizar</button>
                </div>
                ` : `
                <div class="conn-details-list">
                    <div class="conn-detail-item">
                        <i class="ph-light ph-warning-circle" style="color:#f97316"></i>
                        <span style="color:var(--text-primary); font-weight:500;">Token expirado</span>
                    </div>
                    <div class="conn-detail-item">
                        <i class="ph-light ph-info"></i>
                        <span>A renovação é necessária a cada 60 dias pela Meta.</span>
                    </div>
                </div>
                <div class="conn-actions">
                    <button class="btn-conn-action primary" style="background:#1877f2; border-color:#1877f2;" onclick="window.showSocialLoginModal('facebook')"><i class="ph-light ph-key"></i> Renovar Token</button>
                </div>
                `}
            </div>

            <!-- Add New Card -->
            <div class="connection-card add-conn-card" onclick="window.showPlatformSelector()">
                <i class="ph-light ph-plus-circle"></i>
                <span>Adicionar Nova Conta</span>
            </div>
        </div>

        <div class="card" style="margin-top: 32px; padding: 24px; border-radius: 20px;">
            <div class="card-title" style="margin-bottom: 16px;">
                <i class="ph-light ph-shield-check-bold" style="color:var(--brand-color)"></i> Segurança & Conformidade
            </div>
            <p style="color:var(--text-secondary); font-size: 14px; line-height: 1.6;">
                Sua segurança é nossa prioridade. Utilizamos apenas as APIs oficiais da Meta para garantir que seus dados nunca sejam expostos e que suas automações funcionem conforme as diretrizes do Facebook e Instagram.
            </p>
        </div>
    `;
    return div;
}

window.showNewPostModal = function (postData = null) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'post-new-modal';

    const companyName = document.querySelector('.company-name')?.innerText || 'Sua Marca';
    const initial = companyName.charAt(0).toUpperCase();

    // Contextual values based on whether we are editing or creating
    const isEditing = !!postData;
    const modalTitle = isEditing ? 'Editar Post Agendado' : 'Agendar Novo Post';
    const btnShareText = isEditing ? 'Salvar Alterações' : 'Compartilhar';
    const initialCaption = postData?.caption || '';
    const initialPlatform = postData?.platform || 'instagram';
    const initialType = postData?.type || 'feed';

    modal.innerHTML = `
        <div class="modal-content post-modal-instagram">
            <div class="ig-composer">
                <!-- Media Side -->
                <div class="ig-media-side" id="ig-media-zone">
                    <div class="ig-media-placeholder" id="ig-upload-prompt" onclick="document.getElementById('ig-file-input').click()" style="${postData?.thumb ? 'display:none' : ''}">
                        <i class="ph-light ph-image-square"></i>
                        <p style="font-weight: 600;">Arraste fotos e vídeos aqui</p>
                        <button class="btn-ig-post primary" style="width: auto; padding: 10px 20px;">Selecionar do computador</button>
                    </div>
                    <input type="file" id="ig-file-input" style="display:none" accept="image/*,video/*">
                    <div id="ig-preview-container" style="width:100%; height:100%; ${postData?.thumb ? 'display:block' : 'display:none'}">
                        ${postData?.thumb ? `<img src="${postData.thumb}" class="ig-media-preview">` : ''}
                    </div>
                    
                    <!-- Reels Cover Upload -->
                    <div id="reels-cover-section" class="ig-reels-cover-section" style="${initialType === 'reels' ? 'display:block' : 'display:none'}; position:absolute; bottom:0; width:100%;">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <div class="ig-cover-upload" onclick="document.getElementById('ig-cover-input').click()">
                                <i class="ph-light ph-camera"></i>
                                <span>Capa do Reel</span>
                                <input type="file" id="ig-cover-input" style="display:none" accept="image/*">
                                <img id="ig-cover-preview" class="ig-cover-img" style="display:none">
                            </div>
                            <div style="font-size:12px; color:var(--text-secondary);">Escolha uma capa profissional para o seu Reel.</div>
                        </div>
                    </div>
                </div>

                <!-- Details Side -->
                <div class="ig-details-side" style="overflow-y:auto;">
                    <div class="ig-details-header">
                        <div class="ig-user-info">
                            <div class="ig-avatar">${initial}</div>
                            <span class="ig-username">${companyName}</span>
                        </div>
                        <button class="close-btn" onclick="document.getElementById('post-new-modal').remove()"><i class="ph-light ph-x"></i></button>
                    </div>

                    <div style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); font-weight: 600; color: var(--text-primary); font-size: 14px;">
                        ${modalTitle}
                    </div>

                    <div class="ig-platform-selector">
                        <div class="ig-platform-opt ${initialPlatform === 'instagram' ? 'active instagram' : ''}" onclick="window.switchPostPlatform('instagram', this)">
                            <i class="ph-light ph-instagram-logo"></i> Instagram
                        </div>
                        <div class="ig-platform-opt ${initialPlatform === 'facebook' ? 'active facebook' : ''}" onclick="window.switchPostPlatform('facebook', this)">
                            <i class="ph-light ph-facebook-logo"></i> Facebook
                        </div>
                    </div>

                    <div id="ig-post-types" class="ig-post-type-selector">
                        <div class="ig-type-btn ${initialType === 'feed' ? 'active' : ''}" data-type="feed" onclick="window.setPostType('feed', this)">Feed</div>
                        <div class="ig-type-btn ${initialType === 'stories' ? 'active' : ''}" data-type="stories" onclick="window.setPostType('stories', this)">Stories</div>
                        <div class="ig-type-btn ${initialType === 'reels' ? 'active' : ''} ${initialPlatform === 'facebook' ? 'disabled' : ''}" data-type="reels" onclick="window.setPostType('reels', this)" style="${initialPlatform === 'facebook' ? 'display:none' : ''}">Reels</div>
                    </div>

                    <div class="ig-caption-area">
                        <textarea class="ig-textarea" id="ig-caption-input" placeholder="Escreva uma legenda..." maxlength="2200">${initialCaption}</textarea>
                    </div>

                    <div class="ig-char-counter"><span id="ig-char-count">${initialCaption.length}</span>/2,200</div>

                    <div class="ig-integrated-emoji-bar">
                        ${['😊', '😂', '😍', '🔥', '🚀', '✨', '👏', '✅'].map(emoji => `
                            <span class="ig-emoji-btn" onclick="window.insertEmojiIg('${emoji}')">${emoji}</span>
                        `).join('')}
                        <i class="ph-light ph-smiley" style="margin-left:auto; font-size:20px; cursor:pointer;" onclick="window.toggleFullEmojiIg(event)"></i>
                    </div>

                    <!-- Emoji Popover -->
                    <div id="ig-full-emoji-picker" class="ig-emoji-popover">
                        <div class="ig-emoji-header">Todos os Emojis</div>
                        <div class="ig-emoji-grid">
                            ${['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '☺️', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧'].map(e => `
                                <span class="ig-emoji-btn" onclick="window.insertEmojiIg('${e}')">${e}</span>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Tagging Sections -->
                    <div class="ig-tag-section">
                        <div class="ig-tag-title">Marcar Pessoas <i class="ph-light ph-info" title="Mencione @usuarios"></i></div>
                        <div class="ig-tag-input-row">
                            <input type="text" id="tag-people-input" class="ig-tag-input" placeholder="Usuário...">
                            <button class="btn-ig-post primary" style="padding:6px 12px; width:auto;" onclick="window.addPostTag('people')">Add</button>
                        </div>
                        <div id="tag-people-list" class="ig-tags-list"></div>
                    </div>

                    <div class="ig-tag-section">
                        <div class="ig-tag-title">Colaboradores <i class="ph-light ph-users"></i></div>
                        <div class="ig-tag-input-row">
                            <input type="text" id="tag-collab-input" class="ig-tag-input" placeholder="Usuário...">
                            <button class="btn-ig-post primary" style="padding:6px 12px; width:auto;" onclick="window.addPostTag('collab')">Add</button>
                        </div>
                        <div id="tag-collab-list" class="ig-tags-list"></div>
                    </div>

                    <div class="ig-settings-row">
                        <div class="ig-settings-label">
                            <i class="ph-light ph-map-pin"></i>
                            <input type="text" placeholder="Adicionar localização" style="border:none; outline:none; background:transparent; font-size:14px; width:100%;">
                        </div>
                    </div>

                    <div class="ig-settings-row">
                        <div class="ig-settings-label">
                            <i class="ph-light ph-clock"></i>
                            <span>Programar publicação</span>
                        </div>
                        <input type="datetime-local" class="ig-date-input" id="ig-date-input" value="${postData ? `2026-03-${postData.day.toString().padStart(2, '0')}T${postData.time}` : ''}" style="border:none; outline:none; font-size:12px; color:var(--text-secondary);">
                    </div>

                    <div class="ig-actions-footer">
                        <button class="btn-ig-post secondary" onclick="document.getElementById('post-new-modal').remove()">Cancelar</button>
                        <button class="btn-ig-post primary" id="btn-ig-share">${btnShareText}</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Initial setup
    const fileInput = modal.querySelector('#ig-file-input');
    const captionInput = modal.querySelector('#ig-caption-input');
    const charCount = modal.querySelector('#ig-char-count');
    const previewContainer = modal.querySelector('#ig-preview-container');
    const uploadPrompt = modal.querySelector('#ig-upload-prompt');
    const btnShare = modal.querySelector('#btn-ig-share');
    const coverInput = modal.querySelector('#ig-cover-input');
    const coverPreview = modal.querySelector('#ig-cover-preview');
    const dateInput = modal.querySelector('#ig-date-input');

    fileInput.addEventListener('change', function (e) {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function (e) {
                uploadPrompt.style.display = 'none';
                previewContainer.style.display = 'block';
                previewContainer.innerHTML = `<img src="${e.target.result}" class="ig-media-preview" id="ig-main-img-preview">`;
            }
            reader.readAsDataURL(this.files[0]);
        }
    });

    coverInput.addEventListener('change', function (e) {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function (e) {
                coverPreview.src = e.target.result;
                coverPreview.style.display = 'block';
                modal.querySelector('.ig-cover-upload i').style.display = 'none';
                modal.querySelector('.ig-cover-upload span').style.display = 'none';
            }
            reader.readAsDataURL(this.files[0]);
        }
    });

    captionInput.addEventListener('input', function () {
        charCount.innerText = this.value.length.toLocaleString();
    });

    btnShare.addEventListener('click', function () {
        if (!captionInput.value) {
            alert('Por favor, escreva uma legenda!');
            return;
        }

        const platform = modal.querySelector('.ig-platform-opt.active').classList.contains('instagram') ? 'instagram' : 'facebook';
        const type = modal.querySelector('.ig-type-btn.active').getAttribute('data-type');
        const dateTimeStr = dateInput.value;
        const day = dateTimeStr ? parseInt(dateTimeStr.split('-')[2].split('T')[0]) : 1;
        const time = dateTimeStr ? dateTimeStr.split('T')[1] : '12:00';
        const thumbImg = modal.querySelector('#ig-main-img-preview');

        const newPost = {
            id: postData?.id || Date.now(),
            day: day,
            platform: platform,
            type: type,
            caption: captionInput.value,
            time: time,
            thumb: thumbImg ? thumbImg.src : (postData?.thumb || '')
        };

        btnShare.innerText = isEditing ? 'Salvando...' : 'Compartilhando...';
        btnShare.disabled = true;

        setTimeout(() => {
            window.saveScheduledPost(newPost);
            alert(isEditing ? 'Alterações salvas com sucesso!' : 'Publicação agendada com sucesso!');
            modal.remove();
            App.navigateTo('dstrack-postagens');
        }, 1200);
    });

    // Close emoji picker on click outside
    document.addEventListener('click', function (e) {
        const picker = document.getElementById('ig-full-emoji-picker');
        if (picker && !picker.contains(e.target) && !e.target.closest('.ph-smiley')) {
            picker.classList.remove('active');
        }
    });
};

window.switchPostPlatform = function (platform, el) {
    const modal = document.getElementById('post-new-modal');
    const parent = el.parentElement;
    parent.querySelectorAll('.ig-platform-opt').forEach(opt => opt.classList.remove('active', 'instagram', 'facebook'));
    el.classList.add('active', platform);

    // Update Post Types available
    const typesContainer = modal.querySelector('#ig-post-types');
    const typeButtons = typesContainer.querySelectorAll('.ig-type-btn');

    // Reset all
    typeButtons.forEach(btn => btn.style.display = 'block');

    if (platform === 'facebook') {
        const reelsBtn = typesContainer.querySelector('[data-type="reels"]');
        if (reelsBtn) reelsBtn.style.display = 'none';
        // Add facebook class to active type for styling
        typesContainer.querySelectorAll('.ig-type-btn').forEach(btn => btn.classList.add('fb-type-btn'));
    } else {
        typesContainer.querySelectorAll('.ig-type-btn').forEach(btn => btn.classList.remove('fb-type-btn'));
    }

    const activeType = typesContainer.querySelector('.ig-type-btn.active');
    if (activeType && activeType.style.display === 'none') {
        window.setPostType('feed', typesContainer.querySelector('[data-type="feed"]'));
    }
};

window.setPostType = function (type, el) {
    const modal = document.getElementById('post-new-modal');
    const parent = el.parentElement;
    parent.querySelectorAll('.ig-type-btn').forEach(btn => btn.classList.remove('active'));
    el.classList.add('active');

    // Show/Hide Reels Cover
    const coverSection = modal.querySelector('#reels-cover-section');
    if (coverSection) {
        if (type === 'reels') {
            coverSection.style.display = 'block';
        } else {
            coverSection.style.display = 'none';
        }
    }
};

window.addPostTag = function (category) {
    const input = document.getElementById(`tag-${category}-input`);
    const list = document.getElementById(`tag-${category}-list`);
    const val = input.value.trim().replace('@', '');

    if (val) {
        const tag = document.createElement('div');
        tag.className = 'ig-tag-item';
        tag.innerHTML = `<span>@${val}</span><i class="ph-light ph-x ig-tag-remove" onclick="this.parentElement.remove()"></i>`;
        list.appendChild(tag);
        input.value = '';
    }
};

window.toggleFullEmojiIg = function (e) {
    e.stopPropagation();
    const picker = document.getElementById('ig-full-emoji-picker');
    if (picker) picker.classList.toggle('active');
};

window.insertEmojiIg = function (emoji) {
    const captionInput = document.getElementById('ig-caption-input');
    if (captionInput) {
        const start = captionInput.selectionStart;
        const end = captionInput.selectionEnd;
        const text = captionInput.value;
        captionInput.value = text.substring(0, start) + emoji + text.substring(end);
        captionInput.focus();
        captionInput.selectionEnd = start + emoji.length;
        // Manually trigger input event to update char counter
        captionInput.dispatchEvent(new Event('input'));
    }
};

// --- AUTOMAÇÕES VIEWS ---

function renderAutomacoesFluxo() {
    const div = document.createElement('div');
    div.className = 'automacoes-layout';

    div.innerHTML = `
        <div class="page-header">
            <div>
                <div class="greeting">Inteligência Artificial</div>
                <h2 class="company-name">Construtor de Fluxos</h2>
            </div>
            <div style="display:flex; gap:12px;">
                <button class="btn-secondary" onclick="App.navigateTo('automacoes-config')"><i class="ph-light ph-gear"></i> Configurações</button>
                <button class="btn-primary" onclick="window.saveActionFlow()"><i class="ph-light ph-floppy-disk"></i> Salvar e Ativar</button>
            </div>
        </div>

        <div class="flowbuilder-container">
            <!-- Sidebar com Nós Draggable -->
            <div class="flow-sidebar">
                <h3>Gatilhos</h3>
                <div class="draggable-node trigger" draggable="true" data-type="trigger-message">
                    <i class="ph-light ph-chat-circle-text"></i> Receber Mensagem
                </div>
                
                <h3 style="margin-top:16px;">Inteligência</h3>
                <div class="draggable-node ai-response" draggable="true" data-type="ai-respond">
                    <i class="ph-light ph-brain"></i> IA Responde
                </div>
                <div class="draggable-node ai-response" draggable="true" data-type="ai-qualify">
                    <i class="ph-light ph-magnifying-glass"></i> IA Qualifica Lead
                </div>

                <h3 style="margin-top:16px;">Ações</h3>
                <div class="draggable-node action" draggable="true" data-type="action-transfer">
                    <i class="ph-light ph-user-switch"></i> Transferir Humano
                </div>
                <div class="draggable-node action" draggable="true" data-type="action-tag">
                    <i class="ph-light ph-tag"></i> Adicionar Tag
                </div>
                <div class="draggable-node action" draggable="true" data-type="action-end">
                    <i class="ph-light ph-checkerboard"></i> Encerrar Chat
                </div>
            </div>

            <!-- Canvas Grid -->
            <div class="flow-canvas" id="flow-canvas" ondragover="event.preventDefault()" ondrop="window.dropNodeOnCanvas(event)">
                <svg class="canvas-connection-svg" id="canvas-lines"></svg>
                <!-- Initial Example Node -->
                <div class="canvas-node trigger-node" id="node-1" style="left:50px; top:50px;" draggable="true" ondragstart="window.dragCanvasNode(event, 'node-1')">
                    <div class="node-port output" data-node="node-1" onclick="window.startOrEndConnection(this)"></div>
                    <div class="canvas-node-header">
                        <span><i class="ph-light ph-chat-circle-text" style="color:#f59e0b"></i> Olá inicial</span>
                        <i class="ph-light ph-dots-three" style="cursor:pointer;"></i>
                    </div>
                    <div class="canvas-node-body">
                        Qualquer mensagem recebida no WhatsApp inicia este fluxo.
                    </div>
                </div>
            </div>
        </div>
    `;

    setTimeout(setupFlowBuilderLogic, 100);

    return div;
}

let nodeCounter = 2;

function setupFlowBuilderLogic() {
    const sidebarNodes = document.querySelectorAll('.flow-sidebar .draggable-node');

    sidebarNodes.forEach(node => {
        node.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('source', 'sidebar');
            e.dataTransfer.setData('type', node.getAttribute('data-type'));
            e.dataTransfer.setData('html', node.innerHTML);
            e.dataTransfer.setData('class', node.className);
        });
    });

    window.dragCanvasNode = function (e, id) {
        e.dataTransfer.setData('source', 'canvas');
        e.dataTransfer.setData('id', id);
        // Calculate offset to prevent snapping cursor to top-left
        const rect = e.target.getBoundingClientRect();
        e.dataTransfer.setData('offsetX', e.clientX - rect.left);
        e.dataTransfer.setData('offsetY', e.clientY - rect.top);
    };

    window.dropNodeOnCanvas = function (e) {
        e.preventDefault();
        const canvas = document.getElementById('flow-canvas');
        const source = e.dataTransfer.getData('source');

        const rect = canvas.getBoundingClientRect();
        const scrollLeft = canvas.scrollLeft;
        const scrollTop = canvas.scrollTop;

        // Where to place
        let x = e.clientX - rect.left + scrollLeft;
        let y = e.clientY - rect.top + scrollTop;

        if (source === 'sidebar') {
            const type = e.dataTransfer.getData('type');
            const inner = e.dataTransfer.getData('html');
            const classList = e.dataTransfer.getData('class');

            let cssMapping = '';
            let defaultText = '';

            if (classList.includes('trigger')) { cssMapping = 'trigger-node'; defaultText = 'Gatilho de Entrada'; }
            if (classList.includes('ai-response')) { cssMapping = 'ai-node'; defaultText = 'Processamento IA'; }
            if (classList.includes('action')) { cssMapping = 'action-node'; defaultText = 'Ação de Sistema'; }

            const newNode = document.createElement('div');
            const id = 'node-' + nodeCounter++;
            newNode.className = `canvas-node ${cssMapping}`;
            newNode.id = id;
            newNode.draggable = true;
            newNode.style.left = (x - 120) + 'px'; // Center it roughly
            newNode.style.top = (y - 40) + 'px';
            newNode.setAttribute('ondragstart', `window.dragCanvasNode(event, '${id}')`);

            const hasInput = !classList.includes('trigger');

            newNode.innerHTML = `
                ${hasInput ? '<div class="node-port input" data-node="' + id + '" onclick="window.startOrEndConnection(this)"></div>' : ''}
                <div class="node-port output" data-node="${id}" onclick="window.startOrEndConnection(this)"></div>
                <div class="canvas-node-header">
                    <span>${inner}</span>
                    <i class="ph-light ph-trash" style="cursor:pointer; color:var(--text-tertiary);" onclick="this.parentElement.parentElement.remove()"></i>
                </div>
                <div class="canvas-node-body">
                    ${defaultText}
                </div>
            `;
            canvas.appendChild(newNode);
        } else if (source === 'canvas') {
            const id = e.dataTransfer.getData('id');
            const offsetX = parseInt(e.dataTransfer.getData('offsetX'));
            const offsetY = parseInt(e.dataTransfer.getData('offsetY'));
            const node = document.getElementById(id);
            if (node) {
                node.style.left = (x - offsetX) + 'px';
                node.style.top = (y - offsetY) + 'px';
                window.updateCanvasConnections();
            }
        }
    };

    // Very basic visual connecting logic
    let pendingConnection = null;
    let connections = [];

    window.startOrEndConnection = function (portEl) {
        const nodeId = portEl.getAttribute('data-node');
        const isOutput = portEl.classList.contains('output');

        if (!pendingConnection) {
            // Start connection only from Output
            if (isOutput) {
                pendingConnection = nodeId;
                portEl.style.backgroundColor = 'var(--brand-color)';
            }
        } else {
            // End connection only if target is an Input of another node
            if (!isOutput && pendingConnection !== nodeId) {
                connections.push({ from: pendingConnection, to: nodeId });
                // Reset styling
                document.querySelectorAll('.node-port.output').forEach(p => p.style.backgroundColor = 'white');
                pendingConnection = null;
                window.updateCanvasConnections();
            } else {
                // Cancel
                document.querySelectorAll('.node-port.output').forEach(p => p.style.backgroundColor = 'white');
                pendingConnection = null;
            }
        }
    };

    window.updateCanvasConnections = function () {
        const svg = document.getElementById('canvas-lines');
        if (!svg) return;
        svg.innerHTML = '';
        const canvas = document.getElementById('flow-canvas');
        const canvasRect = canvas.getBoundingClientRect();

        connections.forEach(conn => {
            const fromNode = document.getElementById(conn.from);
            const toNode = document.getElementById(conn.to);
            if (!fromNode || !toNode) return;

            const fromOutput = fromNode.querySelector('.node-port.output');
            const toInput = toNode.querySelector('.node-port.input');
            if (!fromOutput || !toInput) return;

            const fromRect = fromOutput.getBoundingClientRect();
            const toRect = toInput.getBoundingClientRect();

            const x1 = fromRect.left - canvasRect.left + canvas.scrollLeft + 6;
            const y1 = fromRect.top - canvasRect.top + canvas.scrollTop + 6;
            const x2 = toRect.left - canvasRect.left + canvas.scrollLeft + 6;
            const y2 = toRect.top - canvasRect.top + canvas.scrollTop + 6;

            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            const d = `M ${x1} ${y1} C ${x1} ${y1 + 50}, ${x2} ${y2 - 50}, ${x2} ${y2}`;

            path.setAttribute("d", d);
            path.setAttribute("fill", "transparent");
            path.setAttribute("stroke", "#94a3b8");
            path.setAttribute("stroke-width", "3");
            path.setAttribute("stroke-dasharray", "5,5"); // Optional dashed styling
            svg.appendChild(path);
        });
    };
}

function renderAutomacoesConhecimento() {
    const div = document.createElement('div');
    div.className = 'automacoes-layout';

    div.innerHTML = `
                < div class="page-header" >
            <div>
                <div class="greeting">Inteligência Artificial</div>
                <h2 class="company-name">Base de Conhecimento</h2>
            </div>
            <button class="btn-primary" onclick="alert('Upload simulado com sucesso!')"><i class="ph-light ph-upload-simple"></i> Enviar Arquivos</button>
        </div >

                <div class="knowledge-grid">
                    <div class="knowledge-panel">
                        <h3><i class="ph-light ph-file-text"></i> Adicionar Documento</h3>
                        <p style="color:var(--text-secondary); font-size:13px; margin-bottom:20px;">
                            Faça upload de PDFs, planilhas de preços ou manuais para que a IA aprenda sobre seu negócio.
                        </p>
                        <div class="doc-upload-area" onclick="alert('Sistema de upload seria aberto aqui.')">
                            <i class="ph-light ph-cloud-arrow-up"></i>
                            <div>Clique ou arraste arquivos aqui</div>
                            <div style="font-size:12px; margin-top:8px;">Formatos: PDF, DOCX, TXT, CSV (Max 10MB)</div>
                        </div>

                        <h3 style="margin-top:24px;"><i class="ph-light ph-text-t"></i> Regras em Texto Livre</h3>
                        <div class="form-group">
                            <textarea placeholder="Digite instruções adicionais, perguntas frequentes e respostas exatas que a IA deve memorizar..." rows="6"></textarea>
                        </div>
                        <button class="btn-primary" style="margin-top:12px; width:100%" onclick="alert('Conhecimento salvo!')">Treinar IA com Texto</button>
                    </div>

                    <div class="knowledge-panel">
                        <h3><i class="ph-light ph-books"></i> Documentos Treinados</h3>
                        <p style="color:var(--text-secondary); font-size:13px; margin-bottom:20px;">
                            Abaixo estão os arquivos que a IA do seu fluxo já consumiu e utiliza para atendimento.
                        </p>

                        <div class="doc-list">
                            <div class="doc-item">
                                <div class="doc-item-info">
                                    <i class="ph-light ph-file-pdf" style="color:#ef4444;"></i>
                                    <div>
                                        <div>Tabela_de_Preços_2026.pdf</div>
                                        <div style="color:var(--text-tertiary); font-size:11px;">Treinado há 2 dias • 1.2 MB</div>
                                    </div>
                                </div>
                                <button class="btn-icon" style="color:var(--text-tertiary)" onclick="this.parentElement.remove()"><i class="ph-light ph-trash"></i></button>
                            </div>

                            <div class="doc-item">
                                <div class="doc-item-info">
                                    <i class="ph-light ph-file-pdf" style="color:#ef4444;"></i>
                                    <div>
                                        <div>Catalogo_Produtos_Verao.pdf</div>
                                        <div style="color:var(--text-tertiary); font-size:11px;">Treinado há 1 semana • 4.5 MB</div>
                                    </div>
                                </div>
                                <button class="btn-icon" style="color:var(--text-tertiary)" onclick="this.parentElement.remove()"><i class="ph-light ph-trash"></i></button>
                            </div>

                            <div class="doc-item">
                                <div class="doc-item-info">
                                    <i class="ph-light ph-file-text" style="color:#3b82f6;"></i>
                                    <div>
                                        <div>FAQ_Cancelamentos_e_Garantia.txt</div>
                                        <div style="color:var(--text-tertiary); font-size:11px;">Treinado ontem • Texto Direto</div>
                                    </div>
                                </div>
                                <button class="btn-icon" style="color:var(--text-tertiary)" onclick="this.parentElement.remove()"><i class="ph-light ph-trash"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

    return div;
}

function renderAutomacoesConfig() {
    const div = document.createElement('div');
    div.className = 'automacoes-layout';

    div.innerHTML = `
                < div class="page-header" >
            <div>
                <div class="greeting">Inteligência Artificial</div>
                <h2 class="company-name">Configurações do Agente</h2>
            </div>
            <button class="btn-primary" onclick="alert('Configurações salvas e aplicadas a todos os fluxos ativos!')"><i class="ph-light ph-check"></i> Salvar Alterações</button>
        </div >

                <div class="ai-config-section">
                    <h3 style="margin-bottom:24px; font-size:18px; border-bottom:1px solid #eee; padding-bottom:12px;">Persona e Comportamento</h3>

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:20px;">
                        <div class="form-group">
                            <label>Nome do Agente</label>
                            <input type="text" value="Assistente Virtual">
                        </div>
                        <div class="form-group">
                            <label>Tom de Voz</label>
                            <select>
                                <option>Profissional e Direto</option>
                                <option selected>Amigável e Empático</option>
                                <option>Descontraído (Uso de emojis)</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group" style="margin-bottom:24px;">
                        <label>Prompt de Personalidade Primário (System Prompt)</label>
                        <textarea rows="4">Você é um assistente de vendas altamente capacitado focado em qualificar leads e ajudar clientes de forma amigável com foco em tirar dúvidas sobre nossos produtos usando a base de conhecimento. Se não souber a resposta, peça para aguardar a transferência para um vendedor.</textarea>
                    </div>

                    <h3 style="margin-bottom:24px; margin-top:32px; font-size:18px; border-bottom:1px solid #eee; padding-bottom:12px;">Regras de Transferência e Tempo</h3>

                    <div class="toggle-switch-group">
                        <div>
                            <div style="font-weight:500; margin-bottom:4px;">Transferência Humano Automática</div>
                            <div style="font-size:13px; color:var(--text-secondary);">Transferir imediatamente caso o cliente faça mais de 3 perguntas que não constam no conhecimento.</div>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" checked>
                                <span class="toggle-slider"></span>
                        </label>
                    </div>

                    <div class="toggle-switch-group">
                        <div>
                            <div style="font-weight:500; margin-bottom:4px;">Operar Fora do Horário Comercial</div>
                            <div style="font-size:13px; color:var(--text-secondary);">Permitir que a IA responda mensagens recebidas de madrugada e aos domingos.</div>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" checked>
                                <span class="toggle-slider"></span>
                        </label>
                    </div>

                    <div class="toggle-switch-group">
                        <div>
                            <div style="font-weight:500; margin-bottom:4px;">Notificação de Novo Lead via IA</div>
                            <div style="font-size:13px; color:var(--text-secondary);">Criar automaticamente o contato na Aba de Negócios se o cliente informar email no meio da conversa.</div>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" checked>
                                <span class="toggle-slider"></span>
                        </label>
                    </div>

                </div>
            `;

    return div;
}

function renderConfigAdminSaaS() {
    const div = document.createElement('div');
    div.className = 'saas-admin-layout';

    const currentBrandName = localStorage.getItem('crm_brand_name') || 'SUA MARCA';
    const currentPrimary = localStorage.getItem('crm_brand_color') || '#3b82f6';
    const currentLogo = localStorage.getItem('crm_brand_logo') || '';

    div.innerHTML = `
        <div class="page-header">
            <div>
                <div class="greeting">Configurações Master</div>
                <h2 class="company-name">Painel SaaS & White-Label</h2>
            </div>
            <div style="display:flex; gap:12px;">
                <button class="btn-secondary" onclick="App.resetBranding()"><i class="ph-light ph-arrow-counter-clockwise"></i> Resetar Padrão</button>
                <button class="btn-primary" onclick="alert('Configurações salvas no servidor!')"><i class="ph-light ph-check"></i> Salvar Alterações</button>
            </div>
        </div>

        <div class="saas-panel-grid">
            <div class="saas-card">
                <h3><i class="ph-light ph-paint-brush"></i> Identidade Visual</h3>
                <p>Personalize as cores e o logotipo que seus clientes verão ao acessar a plataforma.</p>
                
                <div class="color-picker-group">
                    <label>Cor Primária do Sistema</label>
                    <input type="color" value="${currentPrimary}" onchange="window.setBrandColor(this.value)">
                </div>

                <div style="margin-top:24px;">
                    <label style="display:block; font-weight:500; font-size:14px; margin-bottom:12px;">Logotipo da Sidebar (PNG/SVG)</label>
                    <div class="logo-upload-box" onclick="document.getElementById('saas-logo-input').click()">
                        <input type="file" id="saas-logo-input" hidden accept="image/*" onchange="window.updateSaaSLogo(event)">
                        <img id="saas-logo-preview" src="${currentLogo}" style="${currentLogo ? 'display:block' : 'display:none'}">
                        <i class="ph-light ph-cloud-arrow-up placeholder-icon" style="${currentLogo ? 'display:none' : 'display:block'}"></i>
                        <span style="${currentLogo ? 'display:none' : 'display:block'}">Clique para fazer upload</span>
                    </div>
                </div>

                <div class="saas-input-group">
                    <label>Nome da Marca (Texto)</label>
                    <input type="text" value="${currentBrandName}" oninput="localStorage.setItem('crm_brand_name', this.value); App.applyBranding()">
                </div>
            </div>

            <div class="saas-card">
                <h3><i class="ph-light ph-desktop"></i> Preview do Cliente</h3>
                <p>Veja como a interface aparece para os usuários finais com as cores escolhidas.</p>
                
                <div class="mock-preview-frame">
                    <div class="preview-header" style="background-color: var(--brand-color);">
                        ${currentBrandName}
                    </div>
                    <div class="preview-body">
                        <div class="preview-fake-card"></div>
                        <div class="preview-fake-card" style="width: 70%;"></div>
                        <div style="display:flex; gap:10px;">
                             <div style="width:40px; height:40px; border-radius:50%; background:var(--brand-color); opacity:0.2;"></div>
                             <div style="flex:1; height:40px; border-radius:8px; background:white; border:1px solid #eee;"></div>
                        </div>
                    </div>
                </div>
            </div>

             <div class="saas-card" style="grid-column: span 2;">
                <h3><i class="ph-light ph-users-three"></i> Instâncias Ativas</h3>
                <p>Gerencie os clientes que utilizam sua versão do software.</p>
                
                <div class="saas-clients-list">
                    <div class="saas-client-item">
                        <div class="client-info">
                            <span class="c-name">Imobiliária Silva</span>
                            <span class="c-domain">silva.seudominio.com</span>
                        </div>
                        <span class="client-status">Ativo</span>
                    </div>
                    <div class="saas-client-item">
                        <div class="client-info">
                            <span class="c-name">Clínica Bem Estar</span>
                            <span class="c-domain">clinica.seudominio.com</span>
                        </div>
                        <span class="client-status">Ativo</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    return div;
}

window.updateSaaSLogo = function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const base64 = e.target.result;
            localStorage.setItem('crm_brand_logo', base64);

            // Update preview in current view
            const preview = document.getElementById('saas-logo-preview');
            const icon = document.querySelector('.logo-upload-box i');
            const span = document.querySelector('.logo-upload-box span');

            if (preview) {
                preview.src = base64;
                preview.style.display = 'block';
                if (icon) icon.style.display = 'none';
                if (span) span.style.display = 'none';
            }

            // Apply globally
            App.applyBranding();

            // Proativa: se tivermos um iframe de preview ou algo similar, poderíamos atualizar aqui também
            // No caso atual, applyBranding já cuida do logo da sidebar.
        };
        reader.readAsDataURL(file);
    }
};

App.resetBranding = function () {
    if (confirm('Deseja resetar todas as configurações de marca para o padrão?')) {
        localStorage.removeItem('crm_brand_color');
        localStorage.removeItem('crm_brand_logo');
        localStorage.removeItem('crm_brand_name');

        // Reset CSS
        document.documentElement.style.removeProperty('--brand-color');

        // Apply default
        App.applyBranding();
        App.navigateTo('admin-saas'); // Refresh view
    }
};

function renderWhatsAppWeb() {
    const div = document.createElement('div');
    div.className = 'whatsapp-web-layout';
    div.style.height = '100%';
    div.style.display = 'flex';
    div.style.flexDirection = 'column';
    div.style.overflow = 'hidden';

    div.innerHTML = `
        <div class="page-header" style="border-bottom: 1px solid var(--border-color); padding: 16px 24px;">
            <div>
                <div class="greeting">Integração Oficial</div>
                <h2 class="company-name" style="display:flex; align-items:center; gap:8px;">
                    <i class="ph-light ph-whatsapp-logo" style="color:#2563eb"></i> WhatsApp Web
                </h2>
            </div>
            <div class="header-actions">
                <a href="https://web.whatsapp.com/" target="_blank" class="btn-primary" style="text-decoration:none;">
                    <i class="ph-light ph-arrow-square-out"></i> Abrir em Nova Aba
                </a>
            </div>
        </div>
        
        <div style="flex:1; position:relative; background: #0b141a;">
            <iframe 
                src="https://web.whatsapp.com/" 
                style="width:100%; height:100%; border:none;"
                id="whatsapp-iframe"
                onerror="this.style.display='none'; document.getElementById('whatsapp-fallback').style.display='flex';"
            ></iframe>
            
            <div id="whatsapp-fallback" style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#fff; text-align:center; padding:40px; background: radial-gradient(circle at center, #111b21 0%, #0b141a 100%);">
                <i class="ph-light ph-whatsapp-logo" style="font-size: 80px; color: #2563eb; margin-bottom: 24px;"></i>
                <h3 style="margin-bottom:12px; font-size:24px;">Pronto para conectar?</h3>
                <p style="color: #8696a0; max-width: 460px; margin-bottom: 32px; font-size: 16px; line-height: 1.5;">
                    O WhatsApp Web é exibido aqui de forma segura. Se o seu navegador bloquear a visualização direta por motivos de privacidade, clique no botão abaixo para abrir em uma janela dedicada.
                </p>
                <div style="display:flex; gap:12px;">
                    <a href="https://web.whatsapp.com/" target="_blank" class="btn-primary" style="padding: 14px 28px; font-size: 15px; text-decoration:none;">
                        <i class="ph-light ph-whatsapp-logo"></i> Abrir WhatsApp Web
                    </a>
                    <button class="btn-primary btn-white" onclick="document.getElementById('whatsapp-iframe').src='https://web.whatsapp.com/'" style="padding: 14px 28px; font-size: 15px;">
                        <i class="ph-light ph-arrows-clockwise"></i> Tentar Carregar Novamente
                    </button>
                </div>
            </div>
        </div>
    `;

    return div;
}

window.saveActionFlow = function () {
    const nodes = document.querySelectorAll('.canvas-node').length;
    alert(`Fluxograma salvo com sucesso! O fluxo possui um total de ${nodes} blocos de processamento em ativação.`);
};
