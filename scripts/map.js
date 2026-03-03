let leafletMap = null;
let currentMarker = null;

window.initMap = function (containerId, lat, lng, status) {
    // Small delay to ensure container is fully rendered in DOM
    setTimeout(() => {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (leafletMap) {
            leafletMap.remove();
            leafletMap = null;
        }

        // Initialize map
        leafletMap = L.map(containerId).setView([lat, lng], 13);

        L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        }).addTo(leafletMap);

        updateMapMarker(lat, lng, status);
    }, 100);
};

function updateMapMarker(lat, lng, status) {
    if (!leafletMap) return;

    leafletMap.setView([lat, lng], 13);

    if (currentMarker) {
        leafletMap.removeLayer(currentMarker);
    }

    // Status colors
    let color = '#3b82f6';
    if (status === 'reuniao') color = '#2dd4bf';
    else if (status === 'no_show') color = '#ef4444';
    else if (status === 'agendamento') color = '#eab308';
    else if (status === 'follow_up') color = '#f97316';
    else if (status === 'ganhou') color = '#10b981';
    else if (status === 'perdido') color = '#ef4444';

    const iconHtml = `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`;

    const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-map-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });

    currentMarker = L.marker([lat, lng], { icon: customIcon }).addTo(leafletMap);
}
let pipelineMarkers = [];

window.initPipelineMap = function (containerId, contactsData) {
    setTimeout(() => {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (leafletMap) {
            leafletMap.remove();
            leafletMap = null;
        }

        leafletMap = L.map(containerId).setView([-23.5505, -46.6333], 5); // Overview zoom

        L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        }).addTo(leafletMap);

        window.renderAllContactsOnMap(contactsData);
    }, 100);
};

window.renderAllContactsOnMap = function (contactsData) {
    if (!leafletMap) return;

    // Clear existing pipeline markers
    pipelineMarkers.forEach(m => leafletMap.removeLayer(m));
    pipelineMarkers = [];

    const bounds = [];

    contactsData.forEach(contact => {
        if (contact.lat && contact.lng) {
            let color = '#3b82f6'; // default/entrada
            if (contact.status === 'reuniao') color = '#2dd4bf';
            else if (contact.status === 'no_show') color = '#ef4444';
            else if (contact.status === 'agendamento') color = '#eab308';
            else if (contact.status === 'follow_up') color = '#f97316';
            else if (contact.status === 'ganhou') color = '#10b981';
            else if (contact.status === 'perdido') color = '#ef4444';

            const iconHtml = `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`;

            const customIcon = L.divIcon({
                html: iconHtml,
                className: 'custom-map-marker',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });

            const marker = L.marker([contact.lat, contact.lng], { icon: customIcon })
                .bindPopup(`<b>${contact.name}</b><br>Status: ${contact.status}`)
                .addTo(leafletMap);

            pipelineMarkers.push(marker);
            bounds.push([contact.lat, contact.lng]);
        }
    });

    if (bounds.length > 0) {
        leafletMap.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
};

window.focusContactOnMap = function (lat, lng) {
    if (!leafletMap) return;
    leafletMap.flyTo([lat, lng], 16, {
        animate: true,
        duration: 1.5
    });
};

