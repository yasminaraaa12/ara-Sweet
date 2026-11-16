/**
 * data.js — lapisan database localStorage + data dummy (seed).
 * Semua koleksi disimpan sebagai JSON per-key agar mudah di-reset.
 */
const DB = (() => {
    const PREFIX = 'arasweet.prod.v1.';
    const KEYS = ['meta', 'users', 'stores', 'products', 'categories', 'orders', 'settings', 'logs', 'session', 'carts'];

    function get(key, fallback) {
        try {
            const raw = localStorage.getItem(PREFIX + key);
            return raw == null ? fallback : JSON.parse(raw);
        } catch (e) {
            console.error('DB read error:', key, e);
            return fallback;
        }
    }

    function set(key, value) {
        try {
            localStorage.setItem(PREFIX + key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('DB write error:', key, e);
            UI.toast('Penyimpanan browser penuh. Hapus sebagian foto produk lalu coba lagi.', 'error');
            return false;
        }
    }

    function clearAll() {
        KEYS.forEach((k) => {
            try { localStorage.removeItem(PREFIX + k); } catch (e) { /* ignore */ }
        });
    }

    const uid = (prefix) => prefix + '-' + Date.now().toString(36).slice(-5) + Math.random().toString(36).slice(2, 6);

    return { PREFIX, KEYS, get, set, clearAll, uid };
})();

const Data = (() => {
    const read = (key) => DB.get(key, []);
    const write = (key, value) => DB.set(key, value);
    const clone = (obj) => JSON.parse(JSON.stringify(obj));

    /* ---------------- Gambar ilustrasi SVG (data URI, tanpa aset eksternal) ---------------- */
    function svgImage(bg1, bg2, accent, emoji, label) {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${bg1}"/><stop offset="100%" stop-color="${bg2}"/></linearGradient></defs>
<rect width="400" height="300" fill="url(#g)"/>
<circle cx="340" cy="50" r="65" fill="${accent}" fill-opacity="0.2"/>
<circle cx="60" cy="250" r="80" fill="${accent}" fill-opacity="0.16"/>
<rect x="135" y="60" width="130" height="130" rx="36" fill="#FFFFFF" fill-opacity="0.9"/>
<text x="200" y="143" font-size="68" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
<text x="200" y="228" font-family="sans-serif" font-size="13" font-weight="700" fill="#5C1130" text-anchor="middle" letter-spacing="0.6">${label}</text>
</svg>`;
        return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg.replace(/\n/g, '').trim());
    }

    const PRESETS = {
        'strawberry-milk': svgImage('#FFE4EC', '#FBCFE8', '#DB2777', '🍓', 'STRAWBERRY ROSE MILK'),
        'choco-box': svgImage('#FCE7F3', '#F9A8D4', '#BE185D', '🍫', 'PINK CHOCO BOX'),
        'tiramisu': svgImage('#FFF1F2', '#FECDD3', '#E11D48', '☕', 'BERRY TIRAMISU JAR'),
        'croissant': svgImage('#FDF2F8', '#F5D0FE', '#C026D3', '🥐', 'ROSE BUTTER PASTRY'),
        'brownies': svgImage('#FFE4E6', '#FDA4AF', '#9F1239', '🟫', 'FUDGY BERRY BROWNIES'),
        'boba-coffee': svgImage('#FCE7F3', '#F472B6', '#831843', '🧋', 'CREAMY PINK LATTE'),
        'cheesecake': svgImage('#FFF1F2', '#FBCFE8', '#DB2777', '🍰', 'RASPBERRY CHEESECAKE'),
        'cookies': svgImage('#FFE4EC', '#FECDD3', '#BE123C', '🍪', 'RED VELVET COOKIES'),
        'pudding': svgImage('#FDF2F8', '#F9A8D4', '#EC4899', '🍮', 'SILKY BERRY PUDDING'),
        'hampers': svgImage('#FCE7F3', '#F0ABFC', '#A21CAF', '🎁', 'SWEET GIFT HAMPERS'),
        'donut': svgImage('#FFE4EC', '#FBCFE8', '#E11D48', '🍩', 'GLAZED PINK DONUT'),
        'gelato': svgImage('#FFF1F2', '#F9A8D4', '#DB2777', '🍨', 'BERRY GELATO SCOOP')
    };

    const presetList = () => Object.keys(PRESETS).map((key) => ({ key, url: PRESETS[key] }));

    /* ---------------- Hash password demo (bukan kriptografi produksi) ---------------- */
    function hashPassword(pw) {
        let h = 0x811c9dc5;
        const s = 'arasweet::' + String(pw);
        for (let i = 0; i < s.length; i++) {
            h ^= s.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return ('0000000' + (h >>> 0).toString(16)).slice(-8);
    }

    /* ---------------- Seed data dummy ---------------- */
    const daysAgo = (n, hour = 10) => {
        const d = new Date();
        d.setDate(d.getDate() - n);
        d.setHours(hour, Math.floor(Math.random() * 50), 0, 0);
        return d.toISOString();
    };

    const SEED_USERS = [
        { id: 'usr-admin', nama: 'Ara Prameswari', email: 'admin@arasweet.id', role: 'admin', telepon: '6281234567890', kota: 'Bandung', alamat: 'Jl. Braga No. 12, Bandung', status: 'aktif', createdAt: daysAgo(120, 9) },
        { id: 'usr-s1', nama: 'Ara Sweet', email: 'dapur@arasweet.id', role: 'seller', telepon: '6281234567890', kota: 'Bandung', alamat: 'Jl. Cihampelas No. 88, Bandung', status: 'aktif', createdAt: daysAgo(110, 9) },
        { id: 'usr-s2', nama: 'Bella Nastiti', email: 'bella@rasabunga.id', role: 'seller', telepon: '6281298765432', kota: 'Jakarta Selatan', alamat: 'Jl. Kemang Raya No. 21, Jakarta', status: 'aktif', createdAt: daysAgo(84, 11) },
        { id: 'usr-s3', nama: 'Dewi Lestari', email: 'dewi@manisjaya.id', role: 'seller', telepon: '6281355566677', kota: 'Surabaya', alamat: 'Jl. Darmo No. 45, Surabaya', status: 'aktif', createdAt: daysAgo(3, 14) },
        { id: 'usr-b1', nama: 'Rina Kartika', email: 'rina@mail.com', role: 'pembeli', telepon: '6285711122233', kota: 'Bandung', alamat: 'Jl. Dipatiukur No. 7, Bandung', status: 'aktif', createdAt: daysAgo(60, 10) },
        { id: 'usr-b2', nama: 'Bayu Pratama', email: 'bayu@mail.com', role: 'pembeli', telepon: '6285711199887', kota: 'Jakarta Selatan', alamat: 'Jl. Cipete Raya No. 3, Jakarta', status: 'aktif', createdAt: daysAgo(45, 15) },
        { id: 'usr-b3', nama: 'Sinta Maharani', email: 'sinta@mail.com', role: 'pembeli', telepon: '6285711155443', kota: 'Surabaya', alamat: 'Jl. Raya Gubeng No. 10, Surabaya', status: 'aktif', createdAt: daysAgo(22, 12) },
        { id: 'usr-b4', nama: 'Fajar Nugroho', email: 'fajar@mail.com', role: 'pembeli', telepon: '6285711177665', kota: 'Yogyakarta', alamat: 'Jl. Kaliurang Km 5, Sleman', status: 'nonaktif', createdAt: daysAgo(15, 9) }
    ].map((u) => ({
        ...u,
        passwordHash: hashPassword(u.role === 'admin' ? 'admin123' : u.role === 'seller' ? 'seller123' : 'pembeli123')
    }));

    const SEED_STORES = [
        {
            id: 'str-1', ownerId: 'usr-s1', nama: "ara'Sweet Signature", deskripsi: 'Dessert box, pudding sutra, dan minuman segar buatan rumah dengan bahan pilihan.',
            wa: '6281234567890', kota: 'Bandung', alamat: 'Jl. Cihampelas No. 88, Bandung',
            status: 'aktif', buka: true, rating: 4.9, createdAt: daysAgo(110, 9)
        },
        {
            id: 'str-2', ownerId: 'usr-s2', nama: 'Rasa Bunga Patisserie', deskripsi: 'Pastry butter Prancis, cheesecake premium, dan hampers cantik untuk hadiah.',
            wa: '6281298765432', kota: 'Jakarta Selatan', alamat: 'Jl. Kemang Raya No. 21, Jakarta',
            status: 'aktif', buka: true, rating: 4.8, createdAt: daysAgo(84, 11)
        },
        {
            id: 'str-3', ownerId: 'usr-s3', nama: 'Manis Jaya Snack', deskripsi: 'Camilan rumahan: kue kering, brownies, dan oleh-oleh khas Surabaya.',
            wa: '6281355566677', kota: 'Surabaya', alamat: 'Jl. Darmo No. 45, Surabaya',
            status: 'pending', buka: true, rating: 0, createdAt: daysAgo(3, 14)
        }
    ];

    const SEED_CATEGORIES = [
        { id: 'cat-1', nama: 'Dessert Box', emoji: '🍰', aktif: true },
        { id: 'cat-2', nama: 'Minuman', emoji: '🧋', aktif: true },
        { id: 'cat-3', nama: 'Kue & Pastry', emoji: '🥐', aktif: true },
        { id: 'cat-4', nama: 'Camilan', emoji: '🍪', aktif: true },
        { id: 'cat-5', nama: 'Pudding & Jelly', emoji: '🍮', aktif: true },
        { id: 'cat-6', nama: 'Hampers & Gift Box', emoji: '🎁', aktif: true },
        { id: 'cat-7', nama: 'Roti & Donat', emoji: '🍩', aktif: true },
        { id: 'cat-8', nama: 'Es Krim & Gelato', emoji: '🍨', aktif: true }
    ];

    const rawProducts = [
        ['prd-1', 'usr-s1', 'str-1', 'Pink Velvet Choco Melt Box', 'Dessert Box', 35000, 14, 'choco-box', true, 'aktif', 'Lapisan sponge cake red velvet lembut dengan krim mousse stroberi dan lelehan cokelat lumer.'],
        ['prd-2', 'usr-s1', 'str-1', 'Strawberry Rose Matcha Latte', 'Minuman', 22000, 20, 'strawberry-milk', true, 'aktif', 'Selai stroberi homemade segar, susu UHT creamy, dan pure matcha Uji Jepang.'],
        ['prd-3', 'usr-s1', 'str-1', 'Silky Strawberry Milk Pudding', 'Pudding & Jelly', 16000, 18, 'pudding', true, 'aktif', 'Puding susu sutra super lembut dengan vla vanila dan potongan stroberi segar.'],
        ['prd-4', 'usr-s1', 'str-1', 'Sweet Pink Gift Hampers Box', 'Hampers & Gift Box', 85000, 6, 'hampers', true, 'aktif', 'Paket bingkisan berisi 2 dessert jar, 4 soft cookies, dan kartu ucapan edisi spesial.'],
        ['prd-5', 'usr-s1', 'str-1', 'Glazed Berry Bomboloni Donut', 'Roti & Donat', 14000, 15, 'donut', false, 'aktif', 'Donat kentang empuk berlapis glasir pink stroberi dengan isian krim custard.'],
        ['prd-6', 'usr-s1', 'str-1', 'Raspberry Rose Artisanal Gelato', 'Es Krim & Gelato', 26000, 10, 'gelato', false, 'aktif', 'Gelato rendah lemak dengan cita rasa asam-manis rasberi dan aroma kelopak mawar.'],
        ['prd-7', 'usr-s1', 'str-1', 'Red Velvet Cream Cheese Cookies', 'Camilan', 15000, 0, 'cookies', false, 'aktif', 'Kukis lembut warna merah muda dengan isian lumer cream cheese dan white chocolate.'],
        ['prd-8', 'usr-s1', 'str-1', 'Berry Tiramisu Jar', 'Dessert Box', 32000, 9, 'tiramisu', false, 'aktif', 'Tiramisu dalam jar dengan lapisan mascarpone dan selai berry homemade.'],
        ['prd-9', 'usr-s2', 'str-2', 'Almond Butter Croissant', 'Kue & Pastry', 24000, 7, 'croissant', true, 'aktif', 'Pastry renyah berlapis mentega dengan isian krim almon manis dan kacang panggang.'],
        ['prd-10', 'usr-s2', 'str-2', 'Raspberry Cheesecake Slice', 'Kue & Pastry', 38000, 12, 'cheesecake', true, 'aktif', 'Cheesecake baked creamy dengan saus raspberry segar dan base biskuit butter.'],
        ['prd-11', 'usr-s2', 'str-2', 'Fudgy Berry Brownies', 'Camilan', 28000, 4, 'brownies', false, 'aktif', 'Brownies fudgy pekat dengan topping berry kering dan drizzle cokelat putih.'],
        ['prd-12', 'usr-s2', 'str-2', 'Pink Creamy Iced Latte', 'Minuman', 25000, 25, 'boba-coffee', false, 'aktif', 'Espresso arabika, susu segar, dan sirup pink rose. Disajikan dingin.'],
        ['prd-13', 'usr-s2', 'str-2', 'Grand Hampers Romance', 'Hampers & Gift Box', 145000, 3, 'hampers', true, 'aktif', 'Hampers premium: cheesecake jar, cookies, dan kartu ucapan eksklusif.'],
        ['prd-14', 'usr-s2', 'str-2', 'Strawberry Shortcake Mini', 'Kue & Pastry', 45000, 8, 'strawberry-milk', false, 'nonaktif', 'Mini shortcake dengan strawberry segar dan whipped cream lembut.'],
        ['prd-15', 'usr-s3', 'str-3', 'Brownies Kukus Manis Jaya', 'Camilan', 26000, 30, 'brownies', false, 'aktif', 'Brownies kukus klasik dengan cokelat compound melimpah, cocok untuk oleh-oleh.'],
        ['prd-16', 'usr-s3', 'str-3', 'Donat Gula Mini (isi 12)', 'Roti & Donat', 20000, 22, 'donut', false, 'aktif', 'Donat mini empuk bertabur gula halus, kemasan box siap bawa pulang.']
    ];

    const SEED_PRODUCTS = rawProducts.map((r, i) => ({
        id: r[0], sellerId: r[1], storeId: r[2], nama: r[3], kategori: r[4], harga: r[5], stok: r[6],
        presetKey: r[7], imageUrl: PRESETS[r[7]], isCustomImage: false, unggulan: r[8], status: r[9],
        deskripsi: r[10], sold: 10 + ((i * 7) % 45), createdAt: daysAgo(30 - (i % 25), 8)
    }));

    const ongkirDefault = 12000;

    const rawOrders = [
        ['ord-1', 'usr-b1', 'usr-s1', 'str-1', 9, 'selesai', [[ 'prd-1', 2 ], ['prd-3', 1]], 'Kurir lokal', 'Transfer Bank', 12000],
        ['ord-2', 'usr-b2', 'usr-s1', 'str-1', 7, 'selesai', [['prd-2', 3], ['prd-5', 2]], 'Kurir lokal', 'COD', 12000],
        ['ord-3', 'usr-b3', 'usr-s2', 'str-2', 5, 'dikirim', [['prd-9', 2], ['prd-10', 1]], 'Kurir lokal', 'Transfer Bank', 12000],
        ['ord-4', 'usr-b1', 'usr-s2', 'str-2', 3, 'diproses', [['prd-13', 1]], 'Kurir lokal', 'Transfer Bank', 12000],
        ['ord-5', 'usr-b2', 'usr-s2', 'str-2', 2, 'baru', [['prd-12', 2], ['prd-11', 1]], 'Ambil di toko', 'Bayar di tempat', 0],
        ['ord-6', 'usr-b3', 'usr-s1', 'str-1', 2, 'baru', [['prd-4', 1]], 'Kurir lokal', 'COD', 12000],
        ['ord-7', 'usr-b1', 'usr-s1', 'str-1', 1, 'diproses', [['prd-8', 2], ['prd-6', 1]], 'Ambil di toko', 'Bayar di tempat', 0],
        ['ord-8', 'usr-b2', 'usr-s1', 'str-1', 14, 'dibatalkan', [['prd-7', 2]], 'Kurir lokal', 'COD', 12000],
        ['ord-9', 'usr-b3', 'usr-s2', 'str-2', 20, 'selesai', [['prd-10', 2], ['prd-12', 1]], 'Kurir lokal', 'Transfer Bank', 12000]
    ];

    const BUYERS = {
        'usr-b1': 'Rina Kartika', 'usr-b2': 'Bayu Pratama', 'usr-b3': 'Sinta Maharani', 'usr-b4': 'Fajar Nugroho'
    };

    const SEED_ORDERS = rawOrders.map((r) => {
        const [id, buyerId, sellerId, storeId, days, status, items, pengiriman, pembayaran, ongkir] = r;
        const detail = items.map(([pid, qty]) => {
            const p = SEED_PRODUCTS.find((x) => x.id === pid);
            return { productId: pid, nama: p.nama, harga: p.harga, qty, imageUrl: p.imageUrl, kategori: p.kategori };
        });
        const subtotal = detail.reduce((s, i) => s + i.harga * i.qty, 0);
        const store = SEED_STORES.find((s) => s.id === storeId);
        const createdAt = daysAgo(days, 10 + (days % 6));
        const flow = ['baru', 'diproses', 'dikirim', 'selesai'];
        const timeline = [{ status: 'baru', at: createdAt, note: 'Pesanan dibuat pembeli' }];
        if (status === 'dibatalkan') {
            timeline.push({ status: 'dibatalkan', at: new Date(new Date(createdAt).getTime() + 3600000).toISOString(), note: 'Dibatalkan oleh pembeli' });
        } else {
            const upto = flow.indexOf(status);
            for (let i = 1; i <= upto; i++) {
                timeline.push({
                    status: flow[i],
                    at: new Date(new Date(createdAt).getTime() + i * 5400000).toISOString(),
                    note: flow[i] === 'diproses' ? 'Pesanan dikonfirmasi penjual' : flow[i] === 'dikirim' ? 'Pesanan diserahkan ke kurir' : 'Pesanan diterima pembeli'
                });
            }
        }
        return {
            id, kode: 'AS-' + createdAt.slice(2, 10).replace(/-/g, '') + '-' + id.slice(-1) + '0' + days,
            buyerId, buyerName: BUYERS[buyerId], sellerId, storeId, storeName: store.nama,
            items: detail, subtotal, ongkir, total: subtotal + ongkir,
            pengiriman, pembayaran, status, catatan: '',
            alamat: SEED_USERS.find((u) => u.id === buyerId).alamat,
            telepon: SEED_USERS.find((u) => u.id === buyerId).telepon,
            createdAt, updatedAt: timeline[timeline.length - 1].at, timeline, restocked: status === 'dibatalkan'
        };
    });

    const DEFAULT_SETTINGS = {
        namaPlatform: "ara'Sweet",
        tagline: 'Marketplace UMKM Dessert & Minuman',
        waAdmin: '6281234567890',
        ongkir: ongkirDefault,
        komisi: 5,
        minOrder: 0,
        maintenance: false,
        versi: '1.0.0'
    };

    const SEED_LOGS = [
        { id: 'log-1', at: daysAgo(3, 14), actorId: 'usr-s3', actorName: 'Dewi Lestari', aksi: 'Daftar penjual', detail: 'Toko "Manis Jaya Snack" menunggu verifikasi admin.' },
        { id: 'log-2', at: daysAgo(5, 9), actorId: 'usr-admin', actorName: 'Ara Prameswari', aksi: 'Verifikasi toko', detail: 'Toko "Rasa Bunga Patisserie" disetujui dan aktif di katalog.' },
        { id: 'log-3', at: daysAgo(9, 11), actorId: 'usr-admin', actorName: 'Ara Prameswari', aksi: 'Perbarui pengaturan', detail: 'Ongkos kirim default diubah menjadi Rp 12.000.' }
    ];

    function seed() {
        write('users', clone(SEED_USERS));
        write('stores', clone(SEED_STORES));
        write('products', clone(SEED_PRODUCTS));
        write('categories', clone(SEED_CATEGORIES));
        write('orders', clone(SEED_ORDERS));
        write('settings', clone(DEFAULT_SETTINGS));
        write('logs', clone(SEED_LOGS));
        write('carts', {});
        write('meta', { seeded: true, version: 1, at: new Date().toISOString() });
    }

    function bootstrap() {
        const meta = DB.get('meta', null);
        if (!meta || !meta.seeded) seed();
    }

    function resetAll() {
        DB.clearAll();
        seed();
        DB.set('session', null);
    }

    /* ---------------- Repository ---------------- */
    const users = () => read('users');
    const user = (id) => users().find((u) => u.id === id) || null;
    const userByEmail = (email) => users().find((u) => u.email.toLowerCase() === String(email || '').toLowerCase()) || null;
    const saveUser = (u) => {
        const list = users();
        const idx = list.findIndex((x) => x.id === u.id);
        if (idx >= 0) list[idx] = u; else list.push(u);
        write('users', list);
        return u;
    };
    const updateUser = (id, patch) => {
        const u = user(id);
        if (!u) return null;
        const next = { ...u, ...patch };
        saveUser(next);
        return next;
    };
    const deleteUser = (id) => write('users', users().filter((u) => u.id !== id));

    const stores = () => read('stores');
    const store = (id) => stores().find((s) => s.id === id) || null;
    const storeByOwner = (ownerId) => stores().find((s) => s.ownerId === ownerId) || null;
    const saveStore = (s) => {
        const list = stores();
        const idx = list.findIndex((x) => x.id === s.id);
        if (idx >= 0) list[idx] = s; else list.push(s);
        write('stores', list);
        return s;
    };
    const updateStore = (id, patch) => {
        const s = store(id);
        if (!s) return null;
        const next = { ...s, ...patch };
        saveStore(next);
        return next;
    };
    const deleteStore = (id) => write('stores', stores().filter((s) => s.id !== id));

    const products = () => read('products');
    const product = (id) => products().find((p) => p.id === id) || null;
    const productsBySeller = (sellerId) => products().filter((p) => p.sellerId === sellerId);
    const saveProduct = (p) => {
        const list = products();
        const idx = list.findIndex((x) => x.id === p.id);
        if (idx >= 0) list[idx] = p; else list.push(p);
        write('products', list);
        return p;
    };
    const updateProduct = (id, patch) => {
        const p = product(id);
        if (!p) return null;
        const next = { ...p, ...patch };
        saveProduct(next);
        return next;
    };
    const deleteProduct = (id) => write('products', products().filter((p) => p.id !== id));

    const categories = () => read('categories');
    const category = (id) => categories().find((c) => c.id === id) || null;
    const saveCategory = (c) => {
        const list = categories();
        const idx = list.findIndex((x) => x.id === c.id);
        if (idx >= 0) list[idx] = c; else list.push(c);
        write('categories', list);
        return c;
    };
    const updateCategory = (id, patch) => {
        const c = category(id);
        if (!c) return null;
        const next = { ...c, ...patch };
        saveCategory(next);
        return next;
    };
    const deleteCategory = (id) => write('categories', categories().filter((c) => c.id !== id));

    const orders = () => read('orders').slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const order = (id) => orders().find((o) => o.id === id) || null;
    const ordersByBuyer = (buyerId) => orders().filter((o) => o.buyerId === buyerId);
    const ordersBySeller = (sellerId) => orders().filter((o) => o.sellerId === sellerId);
    const saveOrder = (o) => {
        const list = read('orders');
        const idx = list.findIndex((x) => x.id === o.id);
        if (idx >= 0) list[idx] = o; else list.push(o);
        write('orders', list);
        return o;
    };

    const settings = () => ({ ...DEFAULT_SETTINGS, ...DB.get('settings', {}) });
    const updateSettings = (patch) => {
        const next = { ...settings(), ...patch };
        write('settings', next);
        return next;
    };

    const logs = () => read('logs').slice().sort((a, b) => new Date(b.at) - new Date(a.at));
    function addLog(actor, aksi, detail) {
        const list = read('logs');
        list.push({
            id: DB.uid('log'),
            at: new Date().toISOString(),
            actorId: actor ? actor.id : 'system',
            actorName: actor ? actor.nama : 'Sistem',
            aksi, detail
        });
        write('logs', list.slice(-200));
    }
    const clearLogs = () => write('logs', []);

    const allCarts = () => DB.get('carts', {});
    const cart = (userId) => allCarts()[userId] || [];
    const setCart = (userId, items) => {
        const carts = allCarts();
        carts[userId] = items;
        write('carts', carts);
    };
    const clearCart = (userId) => setCart(userId, []);

    return {
        PRESETS, presetList, hashPassword, seed, bootstrap, resetAll,
        users, user, userByEmail, saveUser, updateUser, deleteUser,
        stores, store, storeByOwner, saveStore, updateStore, deleteStore,
        products, product, productsBySeller, saveProduct, updateProduct, deleteProduct,
        categories, category, saveCategory, updateCategory, deleteCategory,
        orders, order, ordersByBuyer, ordersBySeller, saveOrder,
        settings, updateSettings, logs, addLog, clearLogs,
        cart, setCart, clearCart,
        DEFAULT_SETTINGS
    };
})();
