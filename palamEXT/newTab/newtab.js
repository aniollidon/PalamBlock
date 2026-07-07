// ── Rellotge ──────────────────────────────────────────────────────────────────
function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('clock').textContent = `${h}:${m}`;
}
setInterval(updateClock, 1000);
updateClock();

// ── Llista blanca ─────────────────────────────────────────────────────────────

/**
 * Neteja un host amb wildcards per obtenir un domini usable.
 * Exemples: "*wikipedia.org" → "wikipedia.org", "*.gencat.cat" → "gencat.cat"
 */
function cleanHost(host) {
    if (!host) return '';
    let cleaned = host.trim();
    // Treu wildcards *
    cleaned = cleaned.replace(/\*/g, '');
    // Treu punts al principi (ex: ".gencat.cat" → "gencat.cat")
    cleaned = cleaned.replace(/^\.+/, '');
    return cleaned;
}

/**
 * Neteja un pathname. Si conté wildcards, retorna "" (no es pot enllaçar directament).
 */
function cleanPathname(pathname) {
    if (!pathname) return '';
    // Si conté wildcards, no el podem fer servir com a enllaç directe
    if (pathname.includes('*')) return '';
    return pathname;
}

/**
 * Construeix una URL vàlida a partir dels camps d'una línia de la whitelist.
 * Retorna la URL en string si és vàlida, o null si no.
 */
function buildUrl(line) {
    const host = cleanHost(line.host);
    if (!host) return null;

    const protocol = line.protocol || 'https:';
    const pathname = cleanPathname(line.pathname);

    let urlStr = protocol + '//' + host;
    if (pathname) urlStr += pathname;
    if (line.search) urlStr += line.search;

    try {
        const url = new URL(urlStr);
        return url.href;
    } catch {
        return null;
    }
}

/**
 * Comprova si un host (original, amb possibles wildcards) correspon a google.com.
 * Cobreix patrons com "google.com", "www.google.com", "*google.com", etc.
 */
function isGoogleHost(host) {
    if (!host) return false;
    const cleaned = host.replace(/\*/g, '').replace(/^\.+/, '').replace(/^www\./, '');
    return cleaned === 'google.com';
}

/**
 * Comprova si un host NO s'ha de mostrar com a icona a la newTab.
 * Inclou google.com (ja tenim el cercador) i dominis auxiliars de Google.
 */
function isHiddenHost(host) {
    if (!host) return true;
    const cleaned = host.replace(/\*/g, '').replace(/^\.+/, '').replace(/^www\./, '');
    // google.com: ja hi ha el cercador
    if (cleaned === 'google.com') return true;
    // Dominis auxiliars de Google (login, compte, user content)
    if (cleaned === 'myaccount.google.com') return true;
    if (cleaned === 'accounts.google.com') return true;
    if (cleaned.endsWith('googleusercontent.com')) return true;
    return false;
}

function getDisplayLabel(line) {
    if (line.title && line.title.trim()) return line.title.trim();
    const host = cleanHost(line.host);
    if (host) {
        // Treu www. per un text més net
        return host.replace(/^www\./, '');
    }
    return '';
}

/**
 * Renderitza les icones de la llista blanca al contenidor.
 * @param {Array} lines - Línies de la whitelist
 * @param {Object} iconMap - Mapping host → URL d'icona resolta (des del service worker)
 */
function renderWhitelist(lines, iconMap) {
    const container = document.getElementById('whitelist-container');
    const searchContainer = document.querySelector('.search-container');
    let hasGoogle = false;

    container.innerHTML = '';

    for (const line of lines) {
        // Detectem google.com per al cercador (encara que no el mostrem com a icona)
        if (isGoogleHost(line.host)) {
            hasGoogle = true;
        }

        // No mostrem icones per a google ni dominis auxiliars
        if (isHiddenHost(line.host)) continue;

        const url = buildUrl(line);
        if (!url) continue;

        const host = cleanHost(line.host);
        if (!host) continue;

        const label = getDisplayLabel(line);

        const link = document.createElement('a');
        link.className = 'whitelist-item';
        link.href = url;
        link.target = '_self';
        link.title = label;

        // Sempre mostrem una icona: SVG predefinit, icona resolta, o globus
        const builtinSvg = DEFAULT_ICONS[host];
        const resolvedUrl = iconMap ? iconMap[host] : null;

        if (builtinSvg) {
            const iconDiv = document.createElement('div');
            iconDiv.className = 'whitelist-icon';
            iconDiv.innerHTML = builtinSvg;
            iconDiv.querySelector('svg').setAttribute('width', '24');
            iconDiv.querySelector('svg').setAttribute('height', '24');
            link.appendChild(iconDiv);
        } else if (resolvedUrl) {
            const img = document.createElement('img');
            img.className = 'whitelist-icon';
            img.src = resolvedUrl;
            img.alt = label;
            img.loading = 'lazy';
            link.appendChild(img);
        } else {
            const fallback = document.createElement('div');
            fallback.className = 'whitelist-icon whitelist-fallback';
            fallback.innerHTML = GLOBE_SVG;
            link.appendChild(fallback);
        }

        const span = document.createElement('span');
        span.className = 'whitelist-label';
        span.textContent = label;

        link.appendChild(span);
        container.appendChild(link);
    }

    // Si hi ha almenys un element, mostrem el contenidor
    if (container.children.length > 0) {
        container.style.display = 'flex';
    }

    // Amaga el cercador si google.com NO és a la llista
    if (lines.length > 0 && !hasGoogle) {
        searchContainer.style.display = 'none';
    }
}

/**
 * Consulta el servidor per obtenir la llista blanca activa,
 * resol les icones via el service worker i renderitza.
 */
async function loadWhitelist() {
    try {
        const stored = await chrome.storage.local.get(['alumne', 'server']);
        const alumne = stored.alumne;
        const server = stored.server;

        if (!alumne || !server) return;

        const endpoint = server + '/api/v1/alumne/active_whitelist?alumne=' + encodeURIComponent(alumne);
        const response = await fetch(endpoint);

        if (!response.ok) return;

        const json = await response.json();
        if (json.status !== 'OK' || !json.data || !json.data.whitelist) return;

        const lines = json.data.whitelist;
        if (!Array.isArray(lines) || lines.length === 0) return;

        // Recollir els hosts que necessiten resolució (no builtin, no ocults)
        const hostsToResolve = [];
        for (const line of lines) {
            if (isHiddenHost(line.host)) continue;
            const host = cleanHost(line.host);
            if (!host || DEFAULT_ICONS[host]) continue;
            hostsToResolve.push(host);
        }

        // Resoldre icones via el service worker (té host_permissions sense CORS)
        let iconMap = {};
        if (hostsToResolve.length > 0) {
            try {
                iconMap = await chrome.runtime.sendMessage({
                    type: 'resolveIcons',
                    hosts: hostsToResolve
                });
            } catch {
                // Si el service worker no respon, farem servir globus per a totes
            }
        }

        renderWhitelist(lines, iconMap);
    } catch {
        // Si falla, la newTab es manté igual
    }
}

// Inicialitza la càrrega de la llista blanca
loadWhitelist();
