/**
 * ui.js — helper tampilan: ikon, format, modal, toast, badge, empty state.
 */
const UI = (() => {
    const ICONS = {
        grid: '<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>',
        store: '<path d="M3 9l1.5-5h15L21 9M3 9h18M3 9v11h18V9M9 20v-6h6v6"/>',
        cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h2.5l2.6 12.4A2 2 0 009 17h9"/>',
        bag: '<path d="M6 7h12l1 13H5L6 7z"/><path d="M9 7a3 3 0 016 0"/>',
        users: '<path d="M16 20v-1.5a4 4 0 00-4-4H7a4 4 0 00-4 4V20"/><circle cx="9.5" cy="7" r="3.5"/><path d="M17 4.2a3.5 3.5 0 010 6.6M21 20v-1.5a4 4 0 00-3-3.8"/>',
        box: '<path d="M20 8l-8-4-8 4 8 4 8-4z"/><path d="M4 8v8l8 4 8-4V8"/><path d="M12 12v8"/>',
        tag: '<path d="M20.6 12.6L12 21H3v-9l8.6-8.6a2 2 0 012.8 0l6.2 6.2a2 2 0 010 2.8z"/><circle cx="7.5" cy="7.5" r="1.4"/>',
        receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
        settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H10a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V10a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>',
        chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
        logout: '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
        search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
        plus: '<path d="M12 5v14M5 12h14"/>',
        minus: '<path d="M5 12h14"/>',
        edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>',
        trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5"/>',
        check: '<path d="M20 6L9 17l-5-5"/>',
        x: '<path d="M18 6L6 18M6 6l12 12"/>',
        alert: '<path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
        star: '<path d="M12 3l2.9 5.9 6.1.9-4.5 4.4 1.1 6.3-5.6-3-5.6 3 1.1-6.3L3 9.8l6.1-.9z"/>',
        menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
        arrowLeft: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
        arrowRight: '<path d="M5 12h14M12 5l7 7-7 7"/>',
        whatsapp: '<path d="M21 11.5a8.5 8.5 0 01-12.6 7.4L3 21l2.2-5.3A8.5 8.5 0 1121 11.5z"/><path d="M8.5 9.5c0 3 2 5 5 5 .7 0 1.3-.6 1.3-1.3l-1.6-.8-.9.8c-.9-.3-1.7-1.1-2-2l.8-.9-.8-1.6c-.7 0-1.8.4-1.8 1.3z"/>',
        upload: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M7 9l5-5 5 5M12 4v12"/>',
        phone: '<path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.5c.9.3 1.8.6 2.8.7a2 2 0 011.8 2.1z"/>',
        pin: '<path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 1118 0z"/><circle cx="12" cy="10" r="3"/>',
        mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 6 10-6"/>',
        lock: '<rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>',
        eye: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/>',
        clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
        shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
        activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
        refresh: '<path d="M4 4v5h.6M20 20v-5h-.6"/><path d="M20 9A8 8 0 004.6 6M4 15a8 8 0 0015.4 3"/>',
        filter: '<path d="M22 3H2l8 9.5V19l4 2v-8.5L22 3z"/>',
        cake: '<path d="M4 21h16v-8H4z"/><path d="M4 13a4 4 0 014-4h8a4 4 0 014 4M12 9V6M12 4v.5"/>',
        truck: '<path d="M1 3h15v13H1zM16 8h4l3 4v4h-7"/><circle cx="5.5" cy="19" r="2"/><circle cx="18.5" cy="19" r="2"/>',
        logoutSmall: '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>'
    };

    const esc = (val) => String(val == null ? '' : val)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    const icon = (name, extra = '') =>
        `<svg class="ico ${extra}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.box}</svg>`;

    const rupiah = (n) => 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.round(Number(n) || 0));

    const shortNumber = (n) => {
        const v = Number(n) || 0;
        if (v >= 1000000000) return (v / 1000000000).toFixed(1).replace('.', ',') + ' M';
        if (v >= 1000000) return (v / 1000000).toFixed(1).replace('.', ',') + ' jt';
        if (v >= 1000) return (v / 1000).toFixed(0) + ' rb';
        return String(v);
    };

    const num = (n) => new Intl.NumberFormat('id-ID').format(Number(n) || 0);

    const date = (iso) => {
        if (!iso) return '-';
        const d = new Date(iso);
        return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const dateTime = (iso) => {
        if (!iso) return '-';
        const d = new Date(iso);
        return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) +
            ' · ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    const timeAgo = (iso) => {
        const diff = Date.now() - new Date(iso).getTime();
        const m = Math.floor(diff / 60000);
        if (m < 1) return 'baru saja';
        if (m < 60) return m + ' menit lalu';
        const h = Math.floor(m / 60);
        if (h < 24) return h + ' jam lalu';
        const d = Math.floor(h / 24);
        if (d < 30) return d + ' hari lalu';
        return date(iso);
    };

    const initials = (name) => String(name || '?').trim().split(/\s+/).slice(0, 2)
        .map((w) => w[0] || '').join('').toUpperCase();

    const avatar = (name, tone = '') =>
        `<span class="avatar ${tone}">${esc(initials(name))}</span>`;

    const STATUS = {
        aktif: ['Aktif', 'green'],
        nonaktif: ['Nonaktif', 'slate'],
        pending: ['Menunggu Verifikasi', 'amber'],
        ditolak: ['Ditolak', 'red'],
        baru: ['Pesanan Baru', 'pink'],
        diproses: ['Diproses', 'violet'],
        dikirim: ['Dikirim', 'blue'],
        selesai: ['Selesai', 'green'],
        dibatalkan: ['Dibatalkan', 'red'],
        admin: ['Admin', 'dark'],
        seller: ['Penjual', 'violet'],
        pembeli: ['Pembeli', 'pink']
    };

    const badge = (key, label) => {
        const conf = STATUS[key] || [label || key, 'slate'];
        return `<span class="badge badge--${conf[1]}">${esc(label || conf[0])}</span>`;
    };

    // ---------- Toast ----------
    function toast(message, type = 'success') {
        const root = document.getElementById('toast-root');
        if (!root) return;
        const el = document.createElement('div');
        el.className = `toast toast--${type}`;
        const ico = type === 'error' ? 'alert' : type === 'info' ? 'clock' : 'check';
        el.innerHTML = `<span class="toast__ico">${icon(ico)}</span><span>${esc(message)}</span>`;
        root.appendChild(el);
        setTimeout(() => {
            el.classList.add('is-out');
            setTimeout(() => el.remove(), 260);
        }, 3400);
    }

    // ---------- Modal ----------
    let lastFocus = null;

    function modal({ title, subtitle = '', body = '', footer = '', size = 'md', onMount }) {
        closeModal();
        lastFocus = document.activeElement;
        const root = document.getElementById('modal-root');
        const wrap = document.createElement('div');
        wrap.className = 'modal-backdrop';
        wrap.innerHTML = `
            <div class="modal modal--${size}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
                <div class="modal__head">
                    <div>
                        <h2 class="modal__title">${esc(title)}</h2>
                        ${subtitle ? `<p class="modal__sub">${esc(subtitle)}</p>` : ''}
                    </div>
                    <button type="button" class="btn btn--icon btn--ghost" data-modal-close aria-label="Tutup">${icon('x')}</button>
                </div>
                <div class="modal__body">${body}</div>
                ${footer ? `<div class="modal__foot">${footer}</div>` : ''}
            </div>`;
        wrap.addEventListener('mousedown', (e) => {
            if (e.target === wrap || e.target.closest('[data-modal-close]')) closeModal();
        });
        root.appendChild(wrap);
        document.body.classList.add('no-scroll');
        requestAnimationFrame(() => wrap.classList.add('is-open'));
        if (typeof onMount === 'function') onMount(wrap);
        const first = wrap.querySelector('input, select, textarea, button.btn--primary');
        if (first) setTimeout(() => first.focus(), 80);
        return wrap;
    }

    function closeModal() {
        const root = document.getElementById('modal-root');
        if (!root) return;
        root.innerHTML = '';
        document.body.classList.remove('no-scroll');
        if (lastFocus && typeof lastFocus.focus === 'function') {
            try { lastFocus.focus(); } catch (e) { /* ignore */ }
        }
    }

    function confirm({ title = 'Konfirmasi', message = '', confirmText = 'Ya, lanjutkan', cancelText = 'Batal', danger = false }) {
        return new Promise((resolve) => {
            const wrap = modal({
                title,
                body: `<p class="confirm__text">${esc(message)}</p>`,
                footer: `<button type="button" class="btn btn--ghost" data-cancel>${esc(cancelText)}</button>
                         <button type="button" class="btn ${danger ? 'btn--danger' : 'btn--primary'}" data-ok>${esc(confirmText)}</button>`,
                size: 'sm'
            });
            wrap.querySelector('[data-cancel]').onclick = () => { closeModal(); resolve(false); };
            wrap.querySelector('[data-ok]').onclick = () => { closeModal(); resolve(true); };
            wrap.addEventListener('mousedown', (e) => { if (e.target === wrap) resolve(false); });
        });
    }

    // Confirmation versi callback (dipakai inline handler async).
    async function ask(options) {
        const ok = await confirm(options);
        return ok;
    }

    function empty({ iconName = 'cake', title = 'Belum ada data', desc = '', action = '' }) {
        return `<div class="empty">
            <div class="empty__ico">${icon(iconName)}</div>
            <h3 class="empty__title">${esc(title)}</h3>
            ${desc ? `<p class="empty__desc">${esc(desc)}</p>` : ''}
            ${action}
        </div>`;
    }

    const debounce = (fn, wait = 240) => {
        let t;
        return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
    };

    const todayISO = () => new Date().toISOString();

    return {
        ICONS, icon, esc, rupiah, shortNumber, num, date, dateTime, timeAgo, initials, avatar,
        badge, toast, modal, closeModal, confirm, ask, empty, debounce, todayISO
    };
})();
