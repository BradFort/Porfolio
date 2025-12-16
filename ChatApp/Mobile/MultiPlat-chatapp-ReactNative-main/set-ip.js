const os = require('os');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Parse les adaptateurs réseau sur Windows via ipconfig
 */
function parseIpConfigWin() {
    try {
        const out = execSync('ipconfig /all', { encoding: 'utf8' });
        const sections = out.split(/\r?\n\r?\n/).map(s => s.trim()).filter(Boolean);
        const adapters = [];

        for (const sec of sections) {
            const firstLine = sec.split(/\r?\n/)[0];
            if (!/adapter/i.test(firstLine)) continue;

            const name = firstLine.replace(/:\s*$/, '').trim();
            const lines = sec.split(/\r?\n/).slice(1);

            let ipv4 = null;
            let gateway = null;

            for (const l of lines) {
                const mIp = l.match(/IPv4 Address[^:]*:\s*([0-9.]+)/i) || l.match(/IPv4[^:]*:\s*([0-9.]+)/i);
                if (mIp) ipv4 = mIp[1];
                const mGw = l.match(/Default Gateway[^:]*:\s*([0-9.]+)/i);
                if (mGw) gateway = mGw[1];
            }

            adapters.push({ name, ipv4, gateway });
        }
        return adapters;
    } catch (err) {
        console.warn('Failed to parse ipconfig:', err.message);
        return null;
    }
}

/**
 * Récupère l'adresse IPv4 locale prioritaire
 */
function getLocalIp() {
    const interfaces = os.networkInterfaces();
    const candidates = [];

    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal && !iface.address.startsWith('169.254')) {
                candidates.push({ name, address: iface.address });
            }
        }
    }

    if (candidates.length === 0) return '127.0.0.1';

    const wifiRegex = /(wi[-_ ]?fi|wlan|wireless|wlp|wlx|airport|wl|sans[- ]fil|wifi)/i;
    const virtualRegex = /(virtual|vethernet|vmware|loopback|docker|tunnel|hamachi|teredo|bluetooth|hyper-v|vbox)/i;

    // Priorité Windows avec ipconfig
    if (process.platform === 'win32') {
        const adapters = parseIpConfigWin();
        if (adapters?.length) {
            const wifi = adapters.find(a => a.gateway && wifiRegex.test(a.name) && !virtualRegex.test(a.name) && a.ipv4);
            if (wifi) return wifi.ipv4;

            const nonVirtual = adapters.find(a => a.gateway && !virtualRegex.test(a.name) && a.ipv4);
            if (nonVirtual) return nonVirtual.ipv4;
        }
    }

    // Priorité Wi-Fi sur autres OS
    const wifiIface = candidates.find(c => wifiRegex.test(c.name) && !virtualRegex.test(c.name));
    if (wifiIface) return wifiIface.address;

    const ethIface = candidates.find(c => !virtualRegex.test(c.name));
    if (ethIface) return ethIface.address;

    return candidates[0].address;
}

// Récupération de l'IP
const ip = getLocalIp();

// Chemin du fichier de config
const configPath = path.join(process.cwd(), 'config', 'api.js');
let config = fs.readFileSync(configPath, 'utf8');

// Mise à jour des URLs pour utiliser Nginx (port 80) et WebSocket
config = config

    .replace(/http:\/\/[0-9.]+(?::\d+)?\/chatappAPI/g, `http://${ip}:8080/chatappAPI`)

    .replace(/ws:\/\/[0-9.]+(?::\d+)?\/ws/g, `ws://${ip}:8080/ws`);


// Écriture du fichier
fs.writeFileSync(configPath, config, 'utf8');

console.log(`Updated API_BASE_URL to: http://${ip}/chatappAPI`);
console.log(`Updated WS_URL to: ws://${ip}/ws`);
