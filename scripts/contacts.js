const STORAGE_KEY = 'crm_contacts_data';

const defaultContacts = [
    { id: 1, name: 'Lucas Mendes', status: 'entrada', tags: ['Follow', 'ICP Ideal'], lastMsg: 'Vi que vocês oferecem planos anuais...', time: '17:15', lat: -23.5505, lng: -46.6333, whatsapp: '5511999999999', value: 1500 },
    { id: 2, name: 'Ana Costa', status: 'entrada', tags: ['MQL', 'Outros Nicho'], lastMsg: 'Eu tenho disponibilidade pra...', time: '17:04', lat: -22.9068, lng: -43.1729, whatsapp: '5521988888888', value: 2000 },
    { id: 3, name: 'Fernanda Lima', status: 'entrada', tags: ['Follow'], lastMsg: 'Opa, te aguardando po...', time: '17:00', lat: -19.9167, lng: -43.9345, whatsapp: '', value: 0 },
    { id: 4, name: 'Rafael Souza', status: 'entrada', tags: ['Follow'], lastMsg: 'Olá', time: '16:49', lat: -15.7801, lng: -47.9292, whatsapp: '5561977777777', value: 3200 },
    { id: 5, name: 'Marcos Paulo', status: 'agendamento', tags: [], lastMsg: 'Precisamos cerca de 45...', time: '16:35', lat: -30.0346, lng: -51.2177, whatsapp: '', value: 5000 },
    { id: 6, name: 'Renan Leith', status: 'agendamento', tags: ['ICP Ideal', 'MQL', 'tem_timing'], lastMsg: 'fechou meu amigooo', time: '16:17', lat: -8.0476, lng: -34.8770, whatsapp: '5581966666666', value: 800 },
    { id: 7, name: 'Juliana Martins', status: 'follow_up', tags: ['Follow'], lastMsg: 'Nessa nova faixa de investim...', time: '16:07', lat: -25.4284, lng: -49.2733, whatsapp: '', value: 1200 },
    { id: 8, name: 'Pedro Henrique', status: 'follow_up', tags: ['Follow'], lastMsg: 'Olha só esse vídeo sobr...', time: '16:06', lat: -3.7319, lng: -38.5267, whatsapp: '5585955555555', value: 0 },
    { id: 9, name: 'Camila Rocha', status: 'follow_up', tags: ['Follow'], lastMsg: 'Tudo bem?', time: '16:00', lat: -20.3155, lng: -40.3128, whatsapp: '5527944444444', value: 0 },
    { id: 10, name: 'Thiago Almeida', status: 'follow_up', tags: ['Follow'], lastMsg: 'Certo, vamos agir sobre isso', time: '15:50', lat: -27.5954, lng: -48.5480, whatsapp: '5548933333333', value: 0 },
    { id: 11, name: 'Guilherme B.', status: 'reuniao', tags: ['Follow 2'], lastMsg: 'Reunião confirmada', time: '15:30', lat: -12.9714, lng: -38.5014, whatsapp: '5571922222222', value: 0 },
    { id: 12, name: 'Beatriz Oliveira', status: 'reuniao', tags: ['Follow'], lastMsg: 'Ok, estou aguardando', time: '15:20', lat: -1.4558, lng: -48.4902, whatsapp: '5591911111111', value: 0 },
    { id: 13, name: 'Renato Alves', status: 'reuniao', tags: ['Follow'], lastMsg: 'Tudo ok', time: '15:10', lat: -9.6663, lng: -35.7351, whatsapp: '5582900000000', value: 0 },
    { id: 14, name: 'Diego Moura', status: 'no_show', tags: [], lastMsg: 'Tive um imprevisto', time: '14:50', lat: -5.7945, lng: -35.2110, whatsapp: '5584899999999', value: 0 }
];

let contacts = [];
let activeContactId = 1;

function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
}

function loadFromStorage() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        try {
            contacts = JSON.parse(data);
        } catch (e) {
            contacts = [...defaultContacts];
            saveToStorage();
        }
    } else {
        contacts = [...defaultContacts];
        saveToStorage();
    }
}

// Initialize
loadFromStorage();

window.getContacts = function () {
    return contacts;
};

window.getActiveContact = function () {
    return contacts.find(c => c.id === activeContactId) || contacts[0];
};

window.setActiveContact = function (id) {
    activeContactId = id;
};

window.formatWhatsApp = function (number) {
    if (!number) return '';
    let cleaned = number.replace(/\D/g, '');
    if (cleaned.length === 10 || cleaned.length === 11) {
        cleaned = '55' + cleaned;
    }
    return cleaned;
};

window.addContact = function (contactData) {
    const newId = contacts.length > 0 ? Math.max(...contacts.map(c => c.id)) + 1 : 1;

    // Generate random coordinates for demo purposes if not provided
    const baseLat = -23.5505;
    const baseLng = -46.6333;
    const latOffset = (Math.random() - 0.5) * 0.1;
    const lngOffset = (Math.random() - 0.5) * 0.1;

    const newContact = {
        id: newId,
        name: contactData.name || 'Sem Nome',
        address: contactData.address || '',
        number: contactData.number || '',
        neighborhood: contactData.neighborhood || '',
        city: contactData.city || '',
        state: contactData.state || '',
        whatsapp: window.formatWhatsApp(contactData.whatsapp),
        gender: contactData.gender || '',
        observation: contactData.observation || '',
        status: contactData.status || 'entrada',
        tags: contactData.tags || [],
        value: parseFloat(contactData.value) || 0,
        lastMsg: 'Contato adicionado via CRM',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        lat: baseLat + latOffset,
        lng: baseLng + lngOffset
    };

    contacts.push(newContact);
    saveToStorage();

    // Try to geocode async
    window.geocodeAddressAndSave(newContact.id);

    return newContact;
};

window.updateContactStatus = function (id, newStatus) {
    const contact = contacts.find(c => c.id === id);
    if (contact) {
        const oldStatus = contact.status;
        contact.status = newStatus;
        saveToStorage();

        // Call trigger check if status changed
        if (oldStatus !== newStatus && window.checkVoiceTriggers) {
            window.checkVoiceTriggers(id, newStatus);
        }
    }
};

window.deleteContact = function (id) {
    contacts = contacts.filter(c => c.id !== id);
    saveToStorage();
};

window.updateContact = function (id, updatedData) {
    const index = contacts.findIndex(c => c.id === id);
    if (index !== -1) {
        const addressChanged =
            contacts[index].address !== updatedData.address ||
            contacts[index].number !== updatedData.number ||
            contacts[index].city !== updatedData.city ||
            contacts[index].state !== updatedData.state;

        contacts[index] = { ...contacts[index], ...updatedData };
        if (updatedData.whatsapp) {
            contacts[index].whatsapp = window.formatWhatsApp(updatedData.whatsapp);
        }
        saveToStorage();

        if (addressChanged) {
            window.geocodeAddressAndSave(id);
        }
    }
};

window.geocodeAddressAndSave = async function (id) {
    const contact = contacts.find(c => c.id === id);
    if (!contact) return;

    // Build address string
    const parts = [];
    if (contact.address) parts.push(contact.address);
    if (contact.number) parts.push(contact.number);
    if (contact.neighborhood) parts.push(contact.neighborhood);
    if (contact.city) parts.push(contact.city);
    if (contact.state) parts.push(contact.state);

    if (parts.length === 0) return;

    const query = parts.join(', ');
    const encoded = encodeURIComponent(query);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1`;

    try {
        const response = await fetch(url, {
            headers: {
                'Accept-Language': 'pt-BR'
            }
        });
        const data = await response.json();

        if (data && data.length > 0) {
            contact.lat = parseFloat(data[0].lat);
            contact.lng = parseFloat(data[0].lon);
            saveToStorage();

            // Re-render map if it exists
            if (window.renderAllContactsOnMap) {
                window.renderAllContactsOnMap(contacts);
            }
        }
    } catch (e) {
        console.error('Error geocoding address:', e);
    }
};
