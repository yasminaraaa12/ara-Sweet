/**
 * app.js — router hash, shell (sidebar/appbar), layar auth, dan aksi lintas peran.
 */
const App = (() => {
    const ROUTES = {
        '/pembeli/katalog': { role: 'pembeli', nav: 'katalog', title: 'Katalog Produk', crumb: 'Pembeli · Belanja', view: (root, user) => BuyerView.katalog(root, user) },
        '/pembeli/keranjang': { role: 'pembeli', nav: 'keranjang', title: 'Keranjang Belanja', crumb: 'Pembeli · Belanja', view: (root, user) => BuyerView.keranjang(root, user) },
        '/pembeli/pesanan': { role: 'pembeli', nav: 'pesanan', title: 'Pesanan Saya', crumb: 'Pembeli · Transaksi', view: (root, user) => BuyerView.pesanan(root, user) },
        '/pembeli/profil': { role: 'pembeli', nav: 'profil', title: 'Profil Saya', crumb: 'Pembeli · Akun', view: (root, user) => BuyerView.profil(root, user) },

        '/seller/ringkasan': { role: 'seller', nav: 'ringkasan', title: 'Ringkasan Toko', crumb: 'Penjual · Dashboard', view: (root, user) => SellerView.ringkasan(root, user) },
        '/seller/produk': { role: 'seller', nav: 'produk', title: 'Kelola Produk', crumb: 'Penjual · Katalog', view: (root, user) => SellerView.produk(root, user) },
        '/seller/pesanan': { role: 'seller', nav: 'pesanan', title: 'Pesanan Masuk', crumb: 'Penjual · Transaksi', view: (root, user) => SellerView.pesanan(root, user) },
        '/seller/toko': { role: 'seller', nav: 'toko', title: 'Toko Saya', crumb: 'Penjual · Pengaturan', view: (root, user) => SellerView.toko(root, user) },
        '/seller/profil': { role: 'seller', nav: 'profil', title: 'Profil Saya', crumb: 'Penjual · Akun', view: (root, user) => SellerView.profil(root, user) },

        '/admin/ringkasan': { role: 'admin', nav: 'ringkasan', title: 'Ringkasan Platform', crumb: 'Admin · Dashboard', view: (root, user) => AdminView.ringkasan(root, user) },
        '/admin/pengguna': { role: 'admin', nav: 'pengguna', title: 'Manajemen Pengguna', crumb: 'Admin · Pengguna', view: (root, user) => AdminView.pengguna(root, user) },
        '/admin/toko': { role: 'admin', nav: 'toko', title: 'Verifikasi Toko', crumb: 'Admin · Penjual', view: (root, user) => AdminView.toko(root, user) },
        '/admin/produk': { role: 'admin', nav: 'produk', title: 'Moderasi Produk', crumb: 'Admin · Katalog', view: (root, user) => AdminView.produk(root, user) },
        '/admin/pesanan': { role: 'admin', nav: 'pesanan', title: 'Semua Pesanan', crumb: 'Admin · Transaksi', view: (root, user) => AdminView.pesanan(root, user) },
        '/admin/kategori': { role: 'admin', nav: 'kategori', title: 'Kategori Produk', crumb: 'Admin · Katalog', view: (root, user) => AdminView.kategori(root, user) },
        '/admin/log': { role: 'admin', nav: 'log', title: 'Log Aktivitas', crumb: 'Admin · Audit', view: (root, user) => AdminView.log(root, user) },
        '/admin/pengaturan': { role: 'admin', nav: 'pengaturan', title: 'Pengaturan Platform', crumb: 'Admin · Sistem', view: (root, user) => AdminView.pengaturan(root, user) }
    };

    const NAV = {
        pembeli: [
            { group: 'Belanja', items: [
                { key: 'katalog', path: '/pembeli/katalog', label: 'Katalog', icon: 'grid' },
                { key: 'keranjang', path: '/pembeli/keranjang', label: 'Keranjang', icon: 'cart', count: 'cart' },
                { key: 'pesanan', path: '/pembeli/pesanan', label: 'Pesanan Saya', icon: 'receipt', count: 'buyerOrders' }
            ] },
            { group: 'Akun', items: [{ key: 'profil', path: '/pembeli/profil', label: 'Profil & Alamat', icon: 'users' }] }
        ],
        seller: [
            { group: 'Dashboard', items: [
                { key: 'ringkasan', path: '/seller/ringkasan', label: 'Ringkasan', icon: 'chart' },
                { key: 'pesanan', path: '/seller/pesanan', label: 'Pesanan Masuk', icon: 'receipt', count: 'sellerOrders' }
            ] },
            { group: 'Toko', items: [
                { key: 'produk', path: '/seller/produk', label: 'Produk Saya', icon: 'box' },
                { key: 'toko', path: '/seller/toko', label: 'Pengaturan Toko', icon: 'store' }
            ] },
            { group: 'Akun', items: [{ key: 'profil', path: '/seller/profil', label: 'Profil Saya', icon: 'users' }] }
        ],
        admin: [
            { group: 'Platform', items: [
                { key: 'ringkasan', path: '/admin/ringkasan', label: 'Ringkasan', icon: 'chart' },
                { key: 'pengguna', path: '/admin/pengguna', label: 'Pengguna', icon: 'users' },
                { key: 'toko', path: '/admin/toko', label: 'Verifikasi Toko', icon: 'store', count: 'pendingStores' }
            ] },
            { group: 'Katalog & Transaksi', items: [
                { key: 'produk', path: '/admin/produk', label: 'Produk', icon: 'box' },
                { key: 'pesanan', path: '/admin/pesanan', label: 'Pesanan', icon: 'receipt', count: 'adminOrders' },
                { key: 'kategori', path: '/admin/kategori', label: 'Kategori', icon: 'tag' }
            ] },
            { group: 'Sistem', items: [
                { key: 'log', path: '/admin/log', label: 'Log Aktivitas', icon: 'activity' },
                { key: 'pengaturan', path: '/admin/pengaturan', label: 'Pengaturan', icon: 'settings' }
            ] }
        ]
    };

    const homeFor = (role) => ({ pembeli: '/pembeli/katalog', seller: '/seller/ringkasan', admin: '/admin/ringkasan' }[role] || '/pembeli/katalog');

    const path = () => location.hash.replace(/^#/, '') || '';

    function countFor(kind, user) {
        if (!user) return 0;
        if (kind === 'cart') return Data.cart(user.id).reduce((s, i) => s + i.qty, 0);
        if (kind === 'buyerOrders') return Data.ordersByBuyer(user.id).filter((o) => ['baru', 'diproses', 'dikirim'].includes(o.status)).length;
        if (kind === 'sellerOrders') return Data.ordersBySeller(user.id).filter((o) => o.status === 'baru').length;
        if (kind === 'pendingStores') return Data.stores().filter((s) => s.status === 'pending').length;
        if (kind === 'adminOrders') return Data.orders().filter((o) => o.status === 'baru').length;
        return 0;
    }

    function go(route) {
        if (location.hash === '#' + route) render();
        else location.hash = route;
    }

    function render() {
        const user = Auth.current();
        const current = path();

        if (!user) {
            renderAuth((window._authMode || 'login'), window._authRole || 'pembeli');
            return;
        }
        const route = ROUTES[current];
        if (!route || route.role !== user.role) {
            go(homeFor(user.role));
            return;
        }
        document.getElementById('auth-screen').classList.add('hidden');
        const shell = document.getElementById('app-shell');
        shell.classList.remove('hidden');

        renderSidebar(user, route);
        renderAppbar(user, route);
        const main = document.getElementById('app-main');
        main.innerHTML = '';
        try {
            route.view(main, user);
        } catch (err) {
            console.error('Render error:', err);
            main.innerHTML = `<div class="card"><div class="card__body">
                <div class="notice notice--danger">${UI.icon('alert')}<div><strong>Terjadi kesalahan saat memuat halaman</strong>${UI.esc(err.message)}</div></div>
                <button class="btn btn--ghost" style="margin-top:14px" onclick="App.go('${homeFor(user.role)}')">Kembali ke beranda</button>
            </div></div>`;
        }
        window.scrollTo({ top: 0, behavior: 'instant' });
    }

    function renderSidebar(user, route) {
        const store = user.role === 'seller' ? Data.storeByOwner(user.id) : null;
        const roleLabel = { pembeli: 'Pembeli', seller: 'Penjual', admin: 'Administrator' }[user.role];
        const groups = NAV[user.role].map((group) => `
            <div class="nav__label">${group.group}</div>
            ${group.items.map((item) => {
                const count = item.count ? countFor(item.count, user) : 0;
                return `<a class="nav__item ${route.nav === item.key ? 'is-active' : ''}" href="#${item.path}">
                    ${UI.icon(item.icon)}<span>${item.label}</span>
                    ${count > 0 ? `<span class="nav__count ${item.count === 'pendingStores' || item.count === 'sellerOrders' ? '' : 'nav__count--soft'}">${count}</span>` : ''}
                </a>`;
            }).join('')}
        `).join('');

        document.getElementById('sidebar').innerHTML = `
            <div class="sidebar__brand">
                <div class="brand__logo">🧁</div>
                <div>
                    <p class="brand__name">ara'Sweet</p>
                    <span class="sidebar__role">${roleLabel}</span>
                </div>
            </div>
            ${store ? `<a class="sidebar__store" href="#/seller/toko">
                <span class="avatar avatar--pink">${store.nama.slice(0, 1)}</span>
                <div style="min-width:0"><strong>${UI.esc(store.nama)}</strong><span>${store.status === 'aktif' ? (store.buka ? 'Toko buka' : 'Toko tutup') : 'Menunggu verifikasi'}</span></div>
            </a>` : ''}
            <nav class="sidebar__nav">${groups}</nav>
            <div class="sidebar__foot">
                <div class="sidebar__user">
                    ${UI.avatar(user.nama, user.role === 'admin' ? 'avatar--dark' : 'avatar--pink')}
                    <div class="sidebar__user-meta">
                        <strong>${UI.esc(user.nama)}</strong>
                        <span>${UI.esc(user.email)}</span>
                    </div>
                    <button class="btn btn--icon btn--ghost" title="Keluar" onclick="Actions.logout()" style="margin-left:auto">${UI.icon('logout')}</button>
                </div>
            </div>`;
    }

    function renderAppbar(user, route) {
        const cartCount = countFor('cart', user);
        const bar = document.getElementById('appbar');
        bar.innerHTML = `
            <div class="appbar__left">
                <button class="appbar__icon-btn sidebar-toggle" onclick="App.toggleSidebar(true)" aria-label="Buka menu">${UI.icon('menu')}</button>
                <div>
                    <p class="appbar__title">${UI.esc(route.title)}</p>
                    <p class="appbar__crumb">${UI.esc(route.crumb)}</p>
                </div>
            </div>
            <div class="appbar__right">
                ${user.role === 'pembeli' ? `<button class="appbar__icon-btn" onclick="App.go('/pembeli/keranjang')" title="Keranjang" aria-label="Keranjang">
                    ${UI.icon('cart')}${cartCount ? `<span class="appbar__dot"></span>` : ''}
                </button>` : ''}
                <div class="chip-user">
                    ${UI.avatar(user.nama, user.role === 'admin' ? 'avatar--dark' : 'avatar--pink')}
                    <div><strong>${UI.esc(user.nama.split(' ')[0])}</strong><span>${UI.esc(user.email)}</span></div>
                </div>
                <button class="btn btn--ghost btn--sm" onclick="Actions.logout()" title="Keluar">${UI.icon('logout')}<span>Keluar</span></button>
            </div>`;
    }

    function toggleSidebar(open) {
        const sidebar = document.getElementById('sidebar');
        const scrim = document.getElementById('sidebar-scrim');
        sidebar.classList.toggle('is-open', open);
        scrim.classList.toggle('is-open', open);
    }

    /* ---------------- Auth screen ---------------- */
    function renderAuth(mode, role) {
        window._authMode = mode;
        window._authRole = role || 'pembeli';
        document.getElementById('app-shell').classList.add('hidden');
        const root = document.getElementById('auth-screen');
        root.classList.remove('hidden');

        const isLogin = mode === 'login';
        const isSeller = window._authRole === 'seller';

        root.innerHTML = `
        <section class="auth__brand">
            <div>
                <div class="brand">
                    <div class="brand__logo">🧁</div>
                    <div>
                        <p class="brand__name" style="color:#fff">ara'Sweet</p>
                        <p class="brand__sub">Marketplace UMKM Dessert & Minuman</p>
                    </div>
                </div>
                <h1 class="auth__headline" style="margin-top:38px">Satu platform untuk pembeli, penjual, dan pengelola UMKM.</h1>
                <p class="auth__lead">Katalog dessert dan minuman rumahan, pesanan real-time, verifikasi toko, hingga laporan penjualan — semuanya dalam satu aplikasi bertema pink.</p>
            </div>
            <div class="auth__features">
                <div class="auth__feature">${UI.icon('bag')}<div><strong>Pembeli</strong><span>Cari produk lintas toko, keranjang, checkout, dan lacak status pesanan.</span></div></div>
                <div class="auth__feature">${UI.icon('store')}<div><strong>Penjual</strong><span>Kelola katalog, stok, pesanan masuk, dan profil toko WhatsApp.</span></div></div>
                <div class="auth__feature">${UI.icon('shield')}<div><strong>Admin</strong><span>Verifikasi toko, moderasi produk, pantau transaksi dan pengaturan platform.</span></div></div>
            </div>
            <p class="auth__foot">Prototype produksi · Data demo disimpan pada localStorage peramban Anda.</p>
        </section>
        <section class="auth__panel">
            <div class="auth-card">
                <span class="auth-card__badge">🧁 ara'Sweet</span>
                <h2 class="auth-card__title">${isLogin ? 'Selamat datang kembali' : 'Buat akun baru'}</h2>
                <p class="auth-card__sub">${isLogin ? 'Masuk sesuai peran Anda: pembeli, penjual, atau administrator platform.' : 'Daftar sebagai pembeli untuk berbelanja, atau penjual untuk membuka toko.'}</p>

                <div class="tabs" role="tablist">
                    <button class="tabs__btn ${isLogin ? 'is-active' : ''}" onclick="App.renderAuth('login')">Masuk</button>
                    <button class="tabs__btn ${!isLogin ? 'is-active' : ''}" onclick="App.renderAuth('register', '${isSeller ? 'seller' : 'pembeli'}')">Daftar</button>
                </div>

                <div id="auth-error" class="form-error hidden" style="margin-bottom:12px"></div>

                ${isLogin ? `
                <form onsubmit="Actions.login(event)" novalidate>
                    <div class="field">
                        <label for="auth-email">Email</label>
                        <input class="input" type="email" id="auth-email" placeholder="nama@email.com" autocomplete="username" required>
                    </div>
                    <div class="field">
                        <label for="auth-password">Password</label>
                        <input class="input" type="password" id="auth-password" placeholder="••••••••" autocomplete="current-password" required>
                    </div>
                    <button type="submit" class="btn btn--primary auth-card__submit">Masuk ke ara'Sweet ${UI.icon('arrowRight')}</button>
                </form>
                <p class="auth-card__hint">Belum punya akun? <button class="btn--link" onclick="App.renderAuth('register')">Daftar sekarang</button></p>

                <div class="demo-box">
                    <p class="demo-box__title">${UI.icon('lock')} Akun demo siap pakai</p>
                    <div class="demo-box__grid">
                        <button class="demo-btn" onclick="Actions.demoLogin('admin@arasweet.id','admin123')"><span>🛡️ Admin</span><span>admin@arasweet.id</span></button>
                        <button class="demo-btn" onclick="Actions.demoLogin('dapur@arasweet.id','seller123')"><span>🏪 Penjual</span><span>dapur@arasweet.id</span></button>
                        <button class="demo-btn" onclick="Actions.demoLogin('rina@mail.com','pembeli123')"><span>🛍️ Pembeli</span><span>rina@mail.com</span></button>
                    </div>
                </div>` : `
                <form onsubmit="Actions.register(event)" novalidate>
                    <div class="field">
                        <label>Daftar sebagai</label>
                        <div class="role-picker">
                            <label class="role-option">
                                <input type="radio" name="auth-role" value="pembeli" ${isSeller ? '' : 'checked'} onchange="App.renderAuth('register','pembeli')">
                                <strong>🛍️ Pembeli</strong>
                                <span>Belanja dari banyak toko UMKM.</span>
                            </label>
                            <label class="role-option">
                                <input type="radio" name="auth-role" value="seller" ${isSeller ? 'checked' : ''} onchange="App.renderAuth('register','seller')">
                                <strong>🏪 Penjual</strong>
                                <span>Buka toko dan jual produk.</span>
                            </label>
                        </div>
                    </div>
                    <div class="field" style="margin-top:12px">
                        <label for="reg-nama">Nama lengkap</label>
                        <input class="input" id="reg-nama" placeholder="Nama sesuai KTP" required>
                    </div>
                    ${isSeller ? `<div class="field" style="margin-top:12px">
                        <label for="reg-store">Nama toko</label>
                        <input class="input" id="reg-store" placeholder="Contoh: Dapur Manis Ara" required>
                        <p class="field__hint">Toko akan berstatus “menunggu verifikasi” sampai disetujui admin.</p>
                    </div>` : ''}
                    <div class="field" style="margin-top:12px">
                        <label for="reg-email">Email</label>
                        <input class="input" type="email" id="reg-email" placeholder="nama@email.com" required>
                    </div>
                    <div class="field" style="margin-top:12px">
                        <label for="reg-password">Password</label>
                        <input class="input" type="password" id="reg-password" placeholder="Minimal 6 karakter" required>
                    </div>
                    <div class="form-grid" style="margin-top:12px">
                        <div class="field">
                            <label for="reg-telepon">No. WhatsApp</label>
                            <input class="input" id="reg-telepon" placeholder="08xxxxxxxxxx" inputmode="numeric">
                        </div>
                        <div class="field">
                            <label for="reg-kota">Kota</label>
                            <input class="input" id="reg-kota" placeholder="Bandung">
                        </div>
                    </div>
                    <div class="field" style="margin-top:12px">
                        <label for="reg-alamat">Alamat</label>
                        <textarea class="textarea" id="reg-alamat" rows="2" placeholder="Alamat pengiriman / toko"></textarea>
                    </div>
                    <button type="submit" class="btn btn--primary auth-card__submit">Daftar sebagai ${isSeller ? 'Penjual' : 'Pembeli'} ${UI.icon('arrowRight')}</button>
                </form>
                <p class="auth-card__hint">Sudah punya akun? <button class="btn--link" onclick="App.renderAuth('login')">Masuk di sini</button></p>`}
            </div>
        </section>`;
    }

    function showAuthError(message) {
        const box = document.getElementById('auth-error');
        if (!box) return;
        box.textContent = message;
        box.classList.remove('hidden');
    }

    /* ---------------- Order modal & status machine ---------------- */
    const FLOW = ['baru', 'diproses', 'dikirim', 'selesai'];
    const nextStatus = (status) => {
        const i = FLOW.indexOf(status);
        return i >= 0 && i < FLOW.length - 1 ? FLOW[i + 1] : null;
    };
    const STATUS_NOTE = {
        diproses: 'Pesanan dikonfirmasi penjual',
        dikirim: 'Pesanan diserahkan ke kurir',
        selesai: 'Pesanan selesai',
        dibatalkan: 'Pesanan dibatalkan'
    };

    function setOrderStatus(orderId, status, actor) {
        const order = Data.order(orderId);
        if (!order) return;
        if (!Status.transitionAllowed(order, status, actor)) {
            UI.toast('Perubahan status ini tidak diizinkan untuk peran Anda.', 'error');
            return;
        }
        if (status === 'dibatalkan' && !order.restocked) {
            order.items.forEach((item) => {
                const p = Data.product(item.productId);
                if (p) Data.updateProduct(p.id, { stok: Number(p.stok) + item.qty });
            });
            order.restocked = true;
        }
        order.status = status;
        order.updatedAt = new Date().toISOString();
        order.timeline.push({ status, at: order.updatedAt, note: STATUS_NOTE[status] || status });
        Data.saveOrder(order);
        Data.addLog(actor, 'Ubah status pesanan', `${order.kode} → ${status}`);
        UI.toast(`Pesanan ${order.kode} diperbarui menjadi "${status}".`);
        UI.closeModal();
        render();
    }

    const Status = {
        FLOW, nextStatus,
        transitionAllowed(order, status, actor) {
            if (!order || order.status === status) return false;
            if (['selesai', 'dibatalkan'].includes(order.status) && actor.role !== 'admin') return false;
            if (status === 'dibatalkan') {
                if (actor.role === 'pembeli') return order.buyerId === actor.id && order.status === 'baru';
                return ['seller', 'admin'].includes(actor.role);
            }
            const nxt = nextStatus(order.status);
            if (!nxt || status !== nxt) return false;
            if (actor.role === 'admin') return true;
            return actor.role === 'seller' && order.sellerId === actor.id;
        }
    };

    function orderModal(orderId) {
        const order = Data.order(orderId);
        const user = Auth.current();
        if (!order || !user) return;
        const isBuyer = user.role === 'pembeli' && order.buyerId === user.id;
        const isSeller = user.role === 'seller' && order.sellerId === user.id;
        const canSee = user.role === 'admin' || isBuyer || isSeller;
        if (!canSee) { UI.toast('Anda tidak memiliki akses ke pesanan ini.', 'error'); return; }

        const steps = FLOW.map((s) => {
            const ev = order.timeline.find((t) => t.status === s);
            return `<div class="timeline__item ${ev ? 'is-done' : ''}">
                <div class="timeline__dot">${UI.icon(ev ? 'check' : 'clock')}</div>
                <div>
                    <p class="timeline__title">${UI.esc(UI.badge(s).replace(/<[^>]+>/g, ''))}</p>
                    <p class="timeline__time">${ev ? UI.dateTime(ev.at) : 'Menunggu'}</p>
                    ${ev && ev.note ? `<p class="timeline__note">${UI.esc(ev.note)}</p>` : ''}
                </div>
            </div>`;
        }).join('');

        const cancelEv = order.timeline.find((t) => t.status === 'dibatalkan');

        const items = order.items.map((i) => `
            <div class="order-line">
                <img src="${i.imageUrl}" alt="">
                <div style="flex:1;min-width:0"><p class="bold">${UI.esc(i.nama)}</p><p class="tiny muted">${i.qty} × ${UI.rupiah(i.harga)}</p></div>
                <p class="bold nowrap">${UI.rupiah(i.harga * i.qty)}</p>
            </div>`).join('');

        const next = nextStatus(order.status);
        const actions = [];
        if (next && Status.transitionAllowed(order, next, user)) {
            actions.push(`<button class="btn btn--primary" onclick="Actions.setStatus('${order.id}','${next}')">Tandai ${next === 'diproses' ? 'Diproses' : next === 'dikirim' ? 'Dikirim' : 'Selesai'} ${UI.icon('arrowRight')}</button>`);
        }
        if (Status.transitionAllowed(order, 'dibatalkan', user)) {
            actions.push(`<button class="btn btn--danger-soft" onclick="Actions.cancelOrder('${order.id}')">Batalkan Pesanan</button>`);
        }
        if (isBuyer) {
            actions.push(`<button class="btn btn--ghost" onclick="Actions.reorder('${order.id}')">Pesan Lagi</button>`);
            actions.push(`<button class="btn btn--ghost" onclick="Actions.orderWa('${order.id}')">${UI.icon('whatsapp')} WhatsApp Toko</button>`);
        }

        UI.modal({
            title: 'Detail Pesanan',
            subtitle: `${order.kode} · ${UI.dateTime(order.createdAt)}`,
            size: 'lg',
            body: `
                <div class="row row--between" style="margin-bottom:14px">
                    ${UI.badge(order.status)}
                    <span class="tiny muted">${order.items.reduce((s, i) => s + i.qty, 0)} item</span>
                </div>
                <div class="grid-2--even" style="display:grid;gap:14px">
                    <div class="form-section">
                        <p class="form-section__title">Pembeli</p>
                        <p class="bold">${UI.esc(order.buyerName)}</p>
                        <p class="small muted">${UI.esc(order.telepon || '-')}</p>
                        <p class="small muted" style="margin-top:4px">${UI.esc(order.alamat || '-')}</p>
                    </div>
                    <div class="form-section">
                        <p class="form-section__title">Toko</p>
                        <p class="bold">${UI.esc(order.storeName)}</p>
                        <p class="small muted">Pengiriman: ${UI.esc(order.pengiriman)}</p>
                        <p class="small muted">Pembayaran: ${UI.esc(order.pembayaran)}</p>
                    </div>
                </div>
                <div class="form-section" style="margin-top:14px;background:#fff">
                    <p class="form-section__title">Rincian Produk</p>
                    <div class="stack--sm" style="display:flex;flex-direction:column;gap:9px">${items}</div>
                    <div style="margin-top:12px;border-top:1px dashed var(--blush-300);padding-top:9px">
                        <div class="summary-row"><span>Subtotal</span><span>${UI.rupiah(order.subtotal)}</span></div>
                        <div class="summary-row"><span>Ongkos kirim</span><span>${UI.rupiah(order.ongkir)}</span></div>
                        <div class="summary-row summary-row--total"><span>Total</span><span>${UI.rupiah(order.total)}</span></div>
                    </div>
                </div>
                ${order.catatan ? `<div class="notice notice--info" style="margin-top:14px">${UI.icon('edit')}<div><strong>Catatan pembeli</strong>${UI.esc(order.catatan)}</div></div>` : ''}
                <div class="form-section" style="margin-top:14px;background:#fff">
                    <p class="form-section__title">Riwayat Status</p>
                    <div class="timeline">${steps}${cancelEv ? `<div class="timeline__item is-done"><div class="timeline__dot">${UI.icon('x')}</div><div><p class="timeline__title">Dibatalkan</p><p class="timeline__time">${UI.dateTime(cancelEv.at)}</p><p class="timeline__note">${UI.esc(cancelEv.note)}</p></div></div>` : ''}</div>
                </div>`,
            footer: actions.join(' ')
        });
    }

    function start() {
        try {
            Data.bootstrap();
        } catch (e) {
            console.error('Seed error:', e);
        }
        document.getElementById('boot-screen').classList.add('hidden');
        const year = document.getElementById('footer-year');
        if (year) year.textContent = new Date().getFullYear();
        window.addEventListener('hashchange', render);
        render();
    }

    return { ROUTES, NAV, homeFor, go, render, start, renderAuth, showAuthError, toggleSidebar, orderModal, setOrderStatus, Status, countFor };
})();

const Actions = Object.assign(window.Actions, {
    login(event) {
        event.preventDefault();
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        if (!email || !password) { App.showAuthError('Email dan password wajib diisi.'); return; }
        const res = Auth.login(email, password);
        if (!res.ok) { App.showAuthError(res.message); return; }
        UI.toast(`Selamat datang, ${res.user.nama.split(' ')[0]}!`);
        App.go(App.homeFor(res.user.role));
    },

    demoLogin(email, password) {
        const res = Auth.login(email, password);
        if (!res.ok) { App.showAuthError(res.message); return; }
        UI.toast(`Masuk sebagai ${res.user.nama}.`);
        App.go(App.homeFor(res.user.role));
    },

    register(event) {
        event.preventDefault();
        const roleEl = document.querySelector('input[name="auth-role"]:checked');
        const res = Auth.register({
            role: roleEl ? roleEl.value : 'pembeli',
            nama: document.getElementById('reg-nama').value,
            storeName: document.getElementById('reg-store') ? document.getElementById('reg-store').value : '',
            email: document.getElementById('reg-email').value,
            password: document.getElementById('reg-password').value,
            telepon: document.getElementById('reg-telepon').value,
            kota: document.getElementById('reg-kota').value,
            alamat: document.getElementById('reg-alamat').value
        });
        if (!res.ok) { App.showAuthError(res.message); return; }
        UI.toast(res.user.role === 'seller' ? 'Akun penjual dibuat. Toko menunggu verifikasi admin.' : 'Akun pembeli berhasil dibuat. Selamat berbelanja!');
        App.go(App.homeFor(res.user.role));
    },

    logout() {
        UI.confirm({
            title: 'Keluar dari akun?',
            message: 'Sesi Anda akan diakhiri. Data demo tetap tersimpan di browser ini.',
            confirmText: 'Ya, keluar'
        }).then((ok) => {
            if (!ok) return;
            Auth.logout();
            App.renderAuth('login');
            location.hash = '';
            UI.toast('Anda telah keluar.', 'info');
        });
    },

    viewOrder(id) { App.orderModal(id); },

    setStatus(id, status) {
        const user = Auth.current();
        App.setOrderStatus(id, status, user);
    },

    async cancelOrder(id) {
        const ok = await UI.confirm({ title: 'Batalkan pesanan?', message: 'Stok produk akan dikembalikan ke toko. Tindakan ini tidak dapat diurungkan.', confirmText: 'Ya, batalkan', danger: true });
        if (!ok) return;
        App.setOrderStatus(id, 'dibatalkan', Auth.current());
    }
});

window.App = App;
window.Actions = Actions;
document.addEventListener('DOMContentLoaded', App.start);
