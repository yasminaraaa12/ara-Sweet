/**
 * admin.js — panel admin: ringkasan platform, pengguna, verifikasi toko,
 * moderasi produk, pesanan, kategori, log aktivitas, pengaturan.
 */
const AdminView = (() => {
    const state = { userQ: '', userRole: 'semua', userStatus: 'semua', productQ: '', productStore: 'semua', orderQ: '', orderStatus: 'semua', storeStatus: 'semua' };

    const gmv = (orders) => orders.filter((o) => o.status !== 'dibatalkan').reduce((s, o) => s + o.total, 0);

    /* ================= RINGKASAN ================= */
    function ringkasan(root, user) {
        const users = Data.users();
        const stores = Data.stores();
        const products = Data.products();
        const orders = Data.orders();
        const settings = Data.settings();
        const pendingStores = stores.filter((s) => s.status === 'pending');
        const activeSellers = stores.filter((s) => s.status === 'aktif');
        const revenue = gmv(orders);
        const komisi = Math.round(revenue * (Number(settings.komisi) || 0) / 100);

        const days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const key = d.toISOString().slice(0, 10);
            const dayOrders = orders.filter((o) => o.createdAt.slice(0, 10) === key && o.status !== 'dibatalkan');
            return { label: d.toLocaleDateString('id-ID', { weekday: 'short' }), count: dayOrders.length, total: dayOrders.reduce((s, o) => s + o.total, 0) };
        });
        const maxDay = Math.max(1, ...days.map((d) => d.count));

        const topStores = activeSellers.map((s) => {
            const so = orders.filter((o) => o.storeId === s.id && o.status !== 'dibatalkan');
            return { store: s, count: so.length, total: so.reduce((x, o) => x + o.total, 0) };
        }).sort((a, b) => b.total - a.total).slice(0, 4);

        root.innerHTML = `
        <div class="stack">
            <div class="page-head">
                <div>
                    <h1 class="page-head__title">Ringkasan Platform</h1>
                    <p class="page-head__sub">Pantau kesehatan marketplace: pengguna, toko, transaksi, dan antrean verifikasi.</p>
                </div>
                <div class="row">
                    <button class="btn btn--ghost" onclick="App.go('/admin/toko')">${UI.icon('store')} Verifikasi (${pendingStores.length})</button>
                    <button class="btn btn--primary" onclick="App.go('/admin/pesanan')">${UI.icon('receipt')} Pesanan baru (${orders.filter((o) => o.status === 'baru').length})</button>
                </div>
            </div>

            ${pendingStores.length ? `<div class="notice notice--warn">${UI.icon('alert')}<div><strong>${pendingStores.length} toko menunggu verifikasi</strong>
                ${possibleNames(pendingStores)} — tinjau data toko lalu setujui agar produknya tampil di katalog.
                <div style="margin-top:8px"><button class="btn btn--dark btn--sm" onclick="App.go('/admin/toko')">Tinjau sekarang</button></div>
            </div></div>` : ''}

            <div class="kpi-grid">
                <div class="kpi"><div class="kpi__ico kpi__ico--green">${UI.icon('bag')}</div><div><p class="kpi__label">GMV (non-batal)</p><p class="kpi__value">${UI.rupiah(revenue)}</p><p class="kpi__sub">Komisi ${settings.komisi}%: ${UI.rupiah(komisi)}</p></div></div>
                <div class="kpi"><div class="kpi__ico kpi__ico--pink">${UI.icon('receipt')}</div><div><p class="kpi__label">Pesanan</p><p class="kpi__value">${orders.length}</p><p class="kpi__sub">${orders.filter((o) => o.status === 'baru').length} baru</p></div></div>
                <div class="kpi"><div class="kpi__ico kpi__ico--violet">${UI.icon('users')}</div><div><p class="kpi__label">Pengguna</p><p class="kpi__value">${users.length}</p><p class="kpi__sub">${users.filter((u) => u.role === 'pembeli').length} pembeli · ${users.filter((u) => u.role === 'seller').length} penjual</p></div></div>
                <div class="kpi"><div class="kpi__ico kpi__ico--blue">${UI.icon('box')}</div><div><p class="kpi__label">Produk</p><p class="kpi__value">${products.length}</p><p class="kpi__sub">${products.filter((p) => p.status === 'aktif').length} aktif</p></div></div>
            </div>

            <div class="grid-2">
                <div class="card">
                    <div class="card__head"><div><h2 class="card__title">${UI.icon('chart')} Pesanan 7 hari</h2><p class="card__sub">Volume transaksi harian</p></div><span class="badge badge--pink">${days.reduce((s, d) => s + d.count, 0)} pesanan</span></div>
                    <div class="card__body">
                        <div class="bars">
                            ${days.map((d) => `<div class="bars__col" title="${d.count} pesanan · ${UI.rupiah(d.total)}">
                                <span class="bars__value">${d.count}</span>
                                <div class="bars__bar" style="height:${Math.round((d.count / maxDay) * 100)}%"></div>
                                <span class="bars__label">${d.label}</span>
                            </div>`).join('')}
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card__head"><h2 class="card__title">${UI.icon('store')} Toko teratas</h2><button class="btn btn--link" onclick="App.go('/admin/toko')">Semua toko</button></div>
                    <div class="card__body" style="display:flex;flex-direction:column;gap:11px">
                        ${topStores.length ? topStores.map((t, i) => `<div class="row row--between">
                            <div class="row"><span class="avatar ${i === 0 ? 'avatar--pink' : ''}">${i + 1}</span>
                                <div><p class="bold small">${UI.esc(t.store.nama)}</p><p class="tiny muted">${t.count} pesanan</p></div></div>
                            <span class="bold small" style="color:var(--pink-700)">${UI.rupiah(t.total)}</span>
                        </div>`).join('') : UI.empty({ title: 'Belum ada transaksi' })}
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card__head"><h2 class="card__title">${UI.icon('clock')} Pesanan terbaru</h2><button class="btn btn--link" onclick="App.go('/admin/pesanan')">Lihat semua</button></div>
                <div class="table-wrap">
                    <table class="table">
                        <thead><tr><th>Kode</th><th>Toko</th><th>Pembeli</th><th class="num">Total</th><th>Status</th><th></th></tr></thead>
                        <tbody>${orders.slice(0, 6).map((o) => `<tr>
                            <td><p class="mono bold" style="font-size:11.5px">${o.kode}</p><p class="tiny muted">${UI.date(o.createdAt)}</p></td>
                            <td>${UI.esc(o.storeName)}</td>
                            <td>${UI.esc(o.buyerName)}</td>
                            <td class="num bold">${UI.rupiah(o.total)}</td>
                            <td>${UI.badge(o.status)}</td>
                            <td class="num"><button class="btn btn--ghost btn--xs" onclick="Actions.viewOrder('${o.id}')">Detail</button></td>
                        </tr>`).join('')}</tbody>
                    </table>
                </div>
            </div>
        </div>`;
    }

    const possibleNames = (stores) => stores.slice(0, 2).map((s) => `<strong>${UI.esc(s.nama)}</strong>`).join(', ') + (stores.length > 2 ? `, +${stores.length - 2} lainnya` : '');

    /* ================= PENGGUNA ================= */
    function pengguna(root, user) {
        const all = Data.users();
        const list = all.filter((u) => {
            const q = state.userQ.toLowerCase();
            return (!q || (u.nama + ' ' + u.email).toLowerCase().includes(q)) &&
                (state.userRole === 'semua' || u.role === state.userRole) &&
                (state.userStatus === 'semua' || u.status === state.userStatus);
        });

        root.innerHTML = `
        <div class="stack">
            <div class="page-head">
                <div><h1 class="page-head__title">Manajemen Pengguna</h1>
                <p class="page-head__sub">${all.length} akun · ${all.filter((u) => u.role === 'pembeli').length} pembeli · ${all.filter((u) => u.role === 'seller').length} penjual · ${all.filter((u) => u.role === 'admin').length} admin</p></div>
            </div>

            <div class="card">
                <div class="card__head">
                    <div class="table-toolbar">
                        <div class="search">${UI.icon('search')}<input class="input" value="${UI.esc(state.userQ)}" placeholder="Cari nama atau email…" oninput="AdminView.filterUser('userQ', this.value)"></div>
                        <select class="select" onchange="AdminView.filterUser('userRole', this.value)">
                            <option value="semua">Semua peran</option>
                            <option value="pembeli" ${state.userRole === 'pembeli' ? 'selected' : ''}>Pembeli</option>
                            <option value="seller" ${state.userRole === 'seller' ? 'selected' : ''}>Penjual</option>
                            <option value="admin" ${state.userRole === 'admin' ? 'selected' : ''}>Admin</option>
                        </select>
                        <select class="select" onchange="AdminView.filterUser('userStatus', this.value)">
                            <option value="semua">Semua status</option>
                            <option value="aktif" ${state.userStatus === 'aktif' ? 'selected' : ''}>Aktif</option>
                            <option value="nonaktif" ${state.userStatus === 'nonaktif' ? 'selected' : ''}>Nonaktif</option>
                            <option value="pending" ${state.userStatus === 'pending' ? 'selected' : ''}>Pending</option>
                        </select>
                    </div>
                    <span class="badge badge--pink">${list.length} hasil</span>
                </div>
                <div class="table-wrap">
                    <table class="table">
                        <thead><tr><th>Pengguna</th><th>Peran</th><th>Kontak</th><th>Bergabung</th><th>Status</th><th class="num">Aksi</th></tr></thead>
                        <tbody>${list.length ? list.map((u) => `<tr>
                            <td><div class="row" style="gap:9px">${UI.avatar(u.nama, u.role === 'admin' ? 'avatar--dark' : u.role === 'seller' ? 'avatar--violet' : 'avatar--pink')}<div><p class="bold">${UI.esc(u.nama)}</p><p class="tiny muted">${UI.esc(u.email)}</p></div></div></td>
                            <td>${UI.badge(u.role)}</td>
                            <td><p class="small">${UI.esc(u.telepon || '-')}</p><p class="tiny muted">${UI.esc(u.kota || '-')}</p></td>
                            <td class="nowrap small">${UI.date(u.createdAt)}</td>
                            <td>${UI.badge(u.status === 'aktif' ? 'aktif' : u.status === 'pending' ? 'pending' : 'nonaktif', u.status === 'aktif' ? 'Aktif' : u.status === 'pending' ? 'Pending' : 'Nonaktif')}</td>
                            <td class="num"><div class="btn-group" style="justify-content:flex-end">
                                <button class="btn btn--ghost btn--xs" onclick="AdminView.userDetail('${u.id}')">Detail</button>
                                ${u.id !== user.id ? `<button class="btn btn--ghost btn--xs" onclick="AdminView.toggleUser('${u.id}')">${u.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}</button>` : '<span class="badge badge--outline">Anda</span>'}
                            </div></td>
                        </tr>`).join('') : `<tr><td colspan="6">${UI.empty({ title: 'Tidak ada pengguna', desc: 'Ubah filter untuk melihat akun lain.' })}</td></tr>`}</tbody>
                    </table>
                </div>
            </div>
        </div>`;
    }

    function filterUser(key, value) {
        state[key] = value;
        App.render();
    }

    function userDetail(id) {
        const u = Data.user(id);
        if (!u) return;
        const store = u.role === 'seller' ? Data.storeByOwner(u.id) : null;
        const orders = u.role === 'seller' ? Data.ordersBySeller(u.id) : Data.ordersByBuyer(u.id);
        const spent = orders.filter((o) => o.status !== 'dibatalkan').reduce((s, o) => s + o.total, 0);
        UI.modal({
            title: 'Detail Pengguna',
            subtitle: u.email,
            body: `
                <div class="row" style="gap:13px;margin-bottom:16px">
                    ${UI.avatar(u.nama, 'avatar--lg avatar--pink')}
                    <div><p class="bold" style="font-size:16px">${UI.esc(u.nama)}</p><p class="small muted">${UI.esc(u.email)}</p></div>
                    <div style="margin-left:auto" class="row">${UI.badge(u.role)}${UI.badge(u.status === 'aktif' ? 'aktif' : 'nonaktif')}</div>
                </div>
                <dl class="kv">
                    <dt>Telepon</dt><dd>${UI.esc(u.telepon || '-')}</dd>
                    <dt>Kota</dt><dd>${UI.esc(u.kota || '-')}</dd>
                    <dt>Alamat</dt><dd>${UI.esc(u.alamat || '-')}</dd>
                    <dt>Bergabung</dt><dd>${UI.dateTime(u.createdAt)}</dd>
                    <dt>${u.role === 'seller' ? 'Toko' : 'Pesanan'}</dt>
                    <dd>${u.role === 'seller' ? (store ? UI.esc(store.nama) + ' · ' + store.status : 'Belum ada toko') : orders.length + ' pesanan'}</dd>
                    <dt>Total transaksi</dt><dd>${UI.rupiah(spent)}</dd>
                </dl>
                <div class="form-section" style="margin-top:16px">
                    <p class="form-section__title">Tindakan admin</p>
                    <div class="row">
                        <button class="btn btn--ghost btn--sm" onclick="AdminView.resetPassword('${u.id}')">${UI.icon('lock')} Reset password</button>
                        ${u.role !== 'admin' ? `<button class="btn btn--danger-soft btn--sm" onclick="AdminView.deleteUser('${u.id}')">${UI.icon('trash')} Hapus akun</button>` : ''}
                    </div>
                    <p class="field__hint" style="margin-top:8px">Reset password menetapkan password sementara <span class="mono">reset123</span> dan mencatatnya di log aktivitas.</p>
                </div>`,
            footer: `<button class="btn btn--ghost" onclick="UI.closeModal()">Tutup</button>`
        });
    }

    async function toggleUser(id) {
        const u = Data.user(id);
        if (!u) return;
        const next = u.status === 'aktif' ? 'nonaktif' : 'aktif';
        const ok = await UI.confirm({
            title: next === 'nonaktif' ? 'Nonaktifkan pengguna?' : 'Aktifkan pengguna?',
            message: next === 'nonaktif' ? `${u.nama} tidak akan bisa masuk ke aplikasi.` : `${u.nama} akan dapat masuk kembali.`,
            confirmText: next === 'nonaktif' ? 'Ya, nonaktifkan' : 'Ya, aktifkan',
            danger: next === 'nonaktif'
        });
        if (!ok) return;
        Data.updateUser(id, { status: next });
        if (u.role === 'seller') {
            const store = Data.storeByOwner(id);
            if (store && next === 'nonaktif') Data.updateStore(store.id, { status: 'nonaktif' });
        }
        Data.addLog(Auth.current(), 'Ubah status pengguna', `${u.nama} → ${next}`);
        UI.toast(`Status ${u.nama} menjadi ${next}.`);
        UI.closeModal();
        App.render();
    }

    async function resetPassword(id) {
        const u = Data.user(id);
        if (!u) return;
        const ok = await UI.confirm({ title: 'Reset password?', message: `Password ${u.email} akan direset menjadi "reset123".`, confirmText: 'Ya, reset', danger: true });
        if (!ok) return;
        Data.updateUser(id, { passwordHash: Data.hashPassword('reset123') });
        Data.addLog(Auth.current(), 'Reset password', u.email);
        UI.toast(`Password ${u.email} direset menjadi reset123.`, 'info');
        UI.closeModal();
        App.render();
    }

    async function deleteUser(id) {
        const u = Data.user(id);
        if (!u || u.role === 'admin') { UI.toast('Akun admin tidak dapat dihapus.', 'error'); return; }
        const ok = await UI.confirm({
            title: 'Hapus akun?',
            message: `Akun ${u.email} beserta toko dan produknya akan dihapus permanen. Riwayat pesanan tetap tersimpan.`,
            confirmText: 'Ya, hapus akun', danger: true
        });
        if (!ok) return;
        const store = Data.storeByOwner(id);
        if (store) {
            Data.products().filter((p) => p.sellerId === id).forEach((p) => Data.deleteProduct(p.id));
            Data.deleteStore(store.id);
        }
        Data.deleteUser(id);
        Data.addLog(Auth.current(), 'Hapus akun', `${u.nama} (${u.role})`);
        UI.closeModal();
        UI.toast('Akun dihapus.', 'info');
        App.render();
    }

    /* ================= TOKO ================= */
    function toko(root) {
        const stores = Data.stores();
        const list = stores.filter((s) => state.storeStatus === 'semua' || s.status === state.storeStatus);
        const pending = stores.filter((s) => s.status === 'pending').length;

        root.innerHTML = `
        <div class="stack">
            <div class="page-head">
                <div><h1 class="page-head__title">Verifikasi & Manajemen Toko</h1>
                <p class="page-head__sub">${stores.length} toko terdaftar · ${stores.filter((s) => s.status === 'aktif').length} aktif · ${pending} menunggu verifikasi.</p></div>
                <div class="pills">
                    ${['semua', 'pending', 'aktif', 'nonaktif'].map((s) => `<button class="pill ${state.storeStatus === s ? 'is-active' : ''}" onclick="AdminView.filterStore('${s}')">${s === 'semua' ? 'Semua' : s === 'pending' ? 'Menunggu' : s === 'aktif' ? 'Aktif' : 'Nonaktif'}</button>`).join('')}
                </div>
            </div>

            ${pending ? `<div class="notice notice--warn">${UI.icon('alert')}<div><strong>${pending} toko menunggu verifikasi</strong>Setujui toko agar produknya muncul di katalog pembeli.</div></div>` : ''}

            <div class="grid-3">
                ${list.length ? list.map((s) => {
                    const owner = Data.user(s.ownerId);
                    const products = Data.products().filter((p) => p.storeId === s.id);
                    const orders = Data.orders().filter((o) => o.storeId === s.id && o.status !== 'dibatalkan');
                    return `<div class="card">
                        <div class="card__body">
                            <div class="row row--between" style="align-items:flex-start">
                                <div class="row">${UI.avatar(s.nama, 'avatar--lg avatar--pink')}<div>
                                    <p class="bold" style="font-size:14px">${UI.esc(s.nama)}</p>
                                    <p class="tiny muted">${UI.esc(s.kota || '-')}</p>
                                </div></div>
                                ${UI.badge(s.status === 'aktif' ? 'aktif' : s.status === 'pending' ? 'pending' : 'nonaktif', s.status === 'aktif' ? 'Aktif' : s.status === 'pending' ? 'Menunggu' : 'Nonaktif')}
                            </div>
                            <p class="small muted" style="margin-top:10px;line-height:1.6;min-height:34px">${UI.esc(s.deskripsi || 'Belum ada deskripsi toko.')}</p>
                            <div class="row" style="margin-top:10px;gap:6px">
                                <span class="badge badge--outline">${products.length} produk</span>
                                <span class="badge badge--outline">${orders.length} pesanan</span>
                                <span class="badge badge--outline">${s.buka ? 'Buka' : 'Tutup'}</span>
                            </div>
                            <div class="divider" style="margin:12px 0"></div>
                            <dl class="kv" style="grid-template-columns:88px 1fr">
                                <dt>Pemilik</dt><dd>${UI.esc(owner ? owner.nama : '-')}</dd>
                                <dt>Email</dt><dd style="font-weight:500;word-break:break-all">${UI.esc(owner ? owner.email : '-')}</dd>
                                <dt>WhatsApp</dt><dd>+${UI.esc(s.wa)}</dd>
                                <dt>Dibuat</dt><dd>${UI.date(s.createdAt)}</dd>
                            </dl>
                            <div class="btn-group" style="margin-top:14px">
                                ${s.status === 'pending' ? `<button class="btn btn--success btn--sm" onclick="AdminView.approveStore('${s.id}')">${UI.icon('check')} Setujui</button>` : ''}
                                ${s.status === 'aktif' ? `<button class="btn btn--danger-soft btn--sm" onclick="AdminView.suspendStore('${s.id}')">Nonaktifkan</button>` : ''}
                                ${s.status === 'nonaktif' ? `<button class="btn btn--ghost btn--sm" onclick="AdminView.approveStore('${s.id}')">Aktifkan</button>` : ''}
                                ${owner ? `<button class="btn btn--ghost btn--sm" onclick="AdminView.userDetail('${owner.id}')">Pemilik</button>` : ''}
                            </div>
                        </div>
                    </div>`;
                }).join('') : `<div class="card" style="grid-column:1/-1"><div class="card__body">${UI.empty({ title: 'Tidak ada toko', desc: 'Belum ada toko dengan status ini.' })}</div></div>`}
            </div>
        </div>`;
    }

    function filterStore(status) {
        state.storeStatus = status;
        App.render();
    }

    async function approveStore(id) {
        const s = Data.store(id);
        if (!s) return;
        const ok = await UI.confirm({ title: 'Setujui toko?', message: `"${s.nama}" akan aktif dan produknya tampil di katalog pembeli.`, confirmText: 'Ya, setujui' });
        if (!ok) return;
        Data.updateStore(id, { status: 'aktif', buka: true });
        Data.updateUser(s.ownerId, { status: 'aktif' });
        Data.addLog(Auth.current(), 'Verifikasi toko', `Toko "${s.nama}" disetujui.`);
        UI.toast(`Toko "${s.nama}" kini aktif.`);
        App.render();
    }

    async function suspendStore(id) {
        const s = Data.store(id);
        if (!s) return;
        const ok = await UI.confirm({ title: 'Nonaktifkan toko?', message: `Produk "${s.nama}" akan disembunyikan dari katalog. Pemilik tetap bisa masuk.`, confirmText: 'Ya, nonaktifkan', danger: true });
        if (!ok) return;
        Data.updateStore(id, { status: 'nonaktif', buka: false });
        Data.addLog(Auth.current(), 'Nonaktifkan toko', s.nama);
        UI.toast('Toko dinonaktifkan.', 'info');
        App.render();
    }

    /* ================= PRODUK ================= */
    function produk(root) {
        const stores = Data.stores();
        const all = Data.products();
        const q = state.productQ.toLowerCase();
        const list = all.filter((p) => {
            const store = Data.store(p.storeId);
            return (!q || (p.nama + ' ' + p.kategori + ' ' + (store ? store.nama : '')).toLowerCase().includes(q)) &&
                (state.productStore === 'semua' || p.storeId === state.productStore);
        });

        root.innerHTML = `
        <div class="stack">
            <div class="page-head">
                <div><h1 class="page-head__title">Moderasi Produk</h1>
                <p class="page-head__sub">${all.length} produk dari ${stores.length} toko. Nonaktifkan produk yang melanggar ketentuan platform.</p></div>
            </div>
            <div class="card">
                <div class="card__head">
                    <div class="table-toolbar">
                        <div class="search">${UI.icon('search')}<input class="input" value="${UI.esc(state.productQ)}" placeholder="Cari produk atau toko…" oninput="AdminView.filterProduct('productQ', this.value)"></div>
                        <select class="select" onchange="AdminView.filterProduct('productStore', this.value)">
                            <option value="semua">Semua toko</option>
                            ${stores.map((s) => `<option value="${s.id}" ${state.productStore === s.id ? 'selected' : ''}>${UI.esc(s.nama)}</option>`).join('')}
                        </select>
                    </div>
                    <span class="badge badge--pink">${list.length} produk</span>
                </div>
                <div class="table-wrap">
                    <table class="table">
                        <thead><tr><th>Produk</th><th>Toko</th><th class="num">Harga</th><th class="num">Stok</th><th>Status</th><th class="center">Unggulan</th><th class="num">Aksi</th></tr></thead>
                        <tbody>${list.length ? list.map((p) => {
                            const store = Data.store(p.storeId);
                            return `<tr>
                                <td><div class="cell-produk"><img src="${p.imageUrl}" alt=""><div><strong>${UI.esc(p.nama)}</strong><span>${UI.esc(p.kategori)} · ${p.sold || 0} terjual</span></div></div></td>
                                <td><p class="small">${UI.esc(store ? store.nama : '-')}</p><p class="tiny muted">${store ? store.status : '-'}</p></td>
                                <td class="num bold">${UI.rupiah(p.harga)}</td>
                                <td class="num">${p.stok}</td>
                                <td><button class="badge ${p.status === 'aktif' ? 'badge--green' : 'badge--slate'}" style="border:0;cursor:pointer" onclick="AdminView.toggleProduct('${p.id}')">${p.status === 'aktif' ? 'Aktif' : 'Nonaktif'}</button></td>
                                <td class="center"><button class="btn btn--xs ${p.unggulan ? 'btn--primary' : 'btn--ghost'}" onclick="AdminView.toggleFeatured('${p.id}')">${p.unggulan ? '⭐' : '—'}</button></td>
                                <td class="num"><button class="btn btn--danger-soft btn--xs" onclick="AdminView.deleteProduct('${p.id}')">Hapus</button></td>
                            </tr>`;
                        }).join('') : `<tr><td colspan="7">${UI.empty({ title: 'Tidak ada produk', desc: 'Ubah filter pencarian.' })}</td></tr>`}</tbody>
                    </table>
                </div>
            </div>
        </div>`;
    }

    function filterProduct(key, value) {
        state[key] = value;
        App.render();
    }

    function toggleProduct(id) {
        const p = Data.product(id);
        if (!p) return;
        Data.updateProduct(id, { status: p.status === 'aktif' ? 'nonaktif' : 'aktif' });
        Data.addLog(Auth.current(), 'Moderasi produk', `${p.nama} → ${p.status === 'aktif' ? 'nonaktif' : 'aktif'}`);
        UI.toast('Status produk diperbarui.');
        App.render();
    }

    function toggleFeatured(id) {
        const p = Data.product(id);
        if (!p) return;
        Data.updateProduct(id, { unggulan: !p.unggulan });
        UI.toast('Status unggulan diperbarui.');
        App.render();
    }

    async function deleteProduct(id) {
        const p = Data.product(id);
        if (!p) return;
        const ok = await UI.confirm({ title: 'Hapus produk?', message: `"${p.nama}" akan dihapus dari katalog. Riwayat pesanan tetap tersimpan.`, confirmText: 'Ya, hapus', danger: true });
        if (!ok) return;
        Data.deleteProduct(id);
        Data.addLog(Auth.current(), 'Hapus produk', p.nama);
        UI.toast('Produk dihapus.', 'info');
        App.render();
    }

    /* ================= PESANAN ================= */
    function pesanan(root) {
        const all = Data.orders();
        const q = state.orderQ.toLowerCase();
        const list = all.filter((o) => {
            return (!q || (o.kode + ' ' + o.buyerName + ' ' + o.storeName).toLowerCase().includes(q)) &&
                (state.orderStatus === 'semua' || o.status === state.orderStatus);
        });
        const total = list.filter((o) => o.status !== 'dibatalkan').reduce((s, o) => s + o.total, 0);

        root.innerHTML = `
        <div class="stack">
            <div class="page-head">
                <div><h1 class="page-head__title">Semua Pesanan</h1>
                <p class="page-head__sub">Monitor transaksi lintas toko, bantu penyelesaian sengketa, dan batalkan pesanan bermasalah.</p></div>
                <div class="row"><span class="badge badge--outline">${list.length} pesanan</span><span class="badge badge--green">Nilai ${UI.rupiah(total)}</span></div>
            </div>

            <div class="card">
                <div class="card__head">
                    <div class="table-toolbar">
                        <div class="search">${UI.icon('search')}<input class="input" value="${UI.esc(state.orderQ)}" placeholder="Cari kode, pembeli, toko…" oninput="AdminView.filterOrder('orderQ', this.value)"></div>
                    </div>
                    <div class="pills">
                        ${['semua', 'baru', 'diproses', 'dikirim', 'selesai', 'dibatalkan'].map((s) => `<button class="pill ${state.orderStatus === s ? 'is-active' : ''}" onclick="AdminView.filterOrder('orderStatus','${s}')">${s === 'semua' ? 'Semua' : s.charAt(0).toUpperCase() + s.slice(1)}</button>`).join('')}
                    </div>
                </div>
                <div class="table-wrap">
                    <table class="table">
                        <thead><tr><th>Kode</th><th>Toko</th><th>Pembeli</th><th>Produk</th><th class="num">Total</th><th>Status</th><th class="num">Aksi</th></tr></thead>
                        <tbody>${list.length ? list.map((o) => `<tr>
                            <td><p class="mono bold" style="font-size:11.5px">${o.kode}</p><p class="tiny muted">${UI.dateTime(o.createdAt)}</p></td>
                            <td>${UI.esc(o.storeName)}</td>
                            <td><p class="small">${UI.esc(o.buyerName)}</p><p class="tiny muted">${UI.esc(o.pembayaran)}</p></td>
                            <td><p class="small">${o.items.reduce((s, i) => s + i.qty, 0)} item</p><p class="tiny muted">${UI.esc(o.items[0].nama)}</p></td>
                            <td class="num bold">${UI.rupiah(o.total)}</td>
                            <td>${UI.badge(o.status)}</td>
                            <td class="num"><div class="btn-group" style="justify-content:flex-end">
                                <button class="btn btn--ghost btn--xs" onclick="Actions.viewOrder('${o.id}')">Detail</button>
                                ${App.Status.nextStatus(o.status) ? `<button class="btn btn--primary btn--xs" onclick="Actions.setStatus('${o.id}','${App.Status.nextStatus(o.status)}')">${App.Status.nextStatus(o.status) === 'diproses' ? 'Proses' : App.Status.nextStatus(o.status) === 'dikirim' ? 'Kirim' : 'Selesai'}</button>` : ''}
                            </div></td>
                        </tr>`).join('') : `<tr><td colspan="7">${UI.empty({ title: 'Tidak ada pesanan', desc: 'Ubah filter untuk melihat pesanan lain.' })}</td></tr>`}</tbody>
                    </table>
                </div>
            </div>
        </div>`;
    }

    function filterOrder(key, value) {
        state[key] = value;
        App.render();
    }

    /* ================= KATEGORI ================= */
    function kategori(root) {
        const categories = Data.categories();
        const products = Data.products();

        root.innerHTML = `
        <div class="stack">
            <div class="page-head">
                <div><h1 class="page-head__title">Kategori Produk</h1>
                <p class="page-head__sub">Kategori dipakai penjual saat menambah produk dan tampil sebagai filter di katalog.</p></div>
            </div>

            <div class="grid-2">
                <div class="card">
                    <div class="card__head"><h2 class="card__title">${UI.icon('tag')} Daftar kategori</h2><span class="badge badge--pink">${categories.length} kategori</span></div>
                    <div class="table-wrap">
                        <table class="table" style="min-width:0">
                            <thead><tr><th>Kategori</th><th class="num">Produk</th><th>Status</th><th class="num">Aksi</th></tr></thead>
                            <tbody>${categories.map((c) => {
                                const count = products.filter((p) => p.kategori === c.nama).length;
                                return `<tr>
                                    <td><div class="row"><span style="font-size:18px">${UI.esc(c.emoji || '🍰')}</span><strong>${UI.esc(c.nama)}</strong></div></td>
                                    <td class="num">${count}</td>
                                    <td><button class="badge ${c.aktif ? 'badge--green' : 'badge--slate'}" style="border:0;cursor:pointer" onclick="AdminView.toggleCategory('${c.id}')">${c.aktif ? 'Aktif' : 'Nonaktif'}</button></td>
                                    <td class="num"><div class="btn-group" style="justify-content:flex-end">
                                        <button class="btn btn--ghost btn--xs" onclick="AdminView.editCategory('${c.id}')">Edit</button>
                                        <button class="btn btn--danger-soft btn--xs" onclick="AdminView.deleteCategory('${c.id}')">Hapus</button>
                                    </div></td>
                                </tr>`;
                            }).join('')}</tbody>
                        </table>
                    </div>
                </div>

                <div class="card">
                    <div class="card__head"><h2 class="card__title">${UI.icon('plus')} Tambah kategori</h2></div>
                    <div class="card__body">
                        <form onsubmit="AdminView.addCategory(event)" style="display:flex;flex-direction:column;gap:12px">
                            <div class="form-grid">
                                <div class="field"><label>Nama kategori <span class="req">*</span></label><input class="input" id="cat-nama" placeholder="Contoh: Dessert Box" required></div>
                                <div class="field"><label>Emoji</label><input class="input" id="cat-emoji" placeholder="🍰" maxlength="4" value="🍰"></div>
                            </div>
                            <button class="btn btn--primary" style="align-self:flex-start">Tambah kategori</button>
                        </form>
                        <div class="notice notice--info" style="margin-top:14px">${UI.icon('alert')}<div><strong>Perhatian</strong>Kategori yang masih memiliki produk tidak dapat dihapus, hanya dinonaktifkan.</div></div>
                    </div>
                </div>
            </div>
        </div>`;
    }

    function addCategory(event) {
        event.preventDefault();
        const nama = document.getElementById('cat-nama').value.trim();
        const emoji = document.getElementById('cat-emoji').value.trim() || '🍰';
        if (nama.length < 3) { UI.toast('Nama kategori minimal 3 karakter.', 'error'); return; }
        if (Data.categories().some((c) => c.nama.toLowerCase() === nama.toLowerCase())) { UI.toast('Kategori sudah ada.', 'error'); return; }
        Data.saveCategory({ id: DB.uid('cat'), nama, emoji, aktif: true });
        Data.addLog(Auth.current(), 'Tambah kategori', nama);
        UI.toast('Kategori ditambahkan.');
        App.render();
    }

    function editCategory(id) {
        const c = Data.category(id);
        if (!c) return;
        UI.modal({
            title: 'Edit Kategori',
            body: `<div style="display:flex;flex-direction:column;gap:12px">
                <div class="field"><label>Nama kategori</label><input class="input" id="ec-nama" value="${UI.esc(c.nama)}"></div>
                <div class="field"><label>Emoji</label><input class="input" id="ec-emoji" value="${UI.esc(c.emoji)}" maxlength="4"></div>
            </div>`,
            footer: `<button class="btn btn--ghost" onclick="UI.closeModal()">Batal</button><button class="btn btn--primary" onclick="AdminView.saveCategory('${c.id}')">Simpan</button>`
        });
    }

    function saveCategory(id) {
        const c = Data.category(id);
        if (!c) return;
        const nama = document.getElementById('ec-nama').value.trim();
        if (nama.length < 3) { UI.toast('Nama kategori minimal 3 karakter.', 'error'); return; }
        if (nama !== c.nama) {
            Data.products().filter((p) => p.kategori === c.nama).forEach((p) => Data.updateProduct(p.id, { kategori: nama }));
        }
        Data.updateCategory(id, { nama, emoji: document.getElementById('ec-emoji').value.trim() || '🍰' });
        Data.addLog(Auth.current(), 'Edit kategori', `${c.nama} → ${nama}`);
        UI.toast('Kategori diperbarui.');
        UI.closeModal();
        App.render();
    }

    function toggleCategory(id) {
        const c = Data.category(id);
        if (!c) return;
        Data.updateCategory(id, { aktif: !c.aktif });
        UI.toast(`Kategori ${c.nama} ${!c.aktif ? 'diaktifkan' : 'dinonaktifkan'}.`);
        App.render();
    }

    async function deleteCategory(id) {
        const c = Data.category(id);
        if (!c) return;
        const used = Data.products().filter((p) => p.kategori === c.nama).length;
        if (used) { UI.toast(`Kategori dipakai ${used} produk. Nonaktifkan saja.`, 'error'); return; }
        const ok = await UI.confirm({ title: 'Hapus kategori?', message: `Kategori "${c.nama}" akan dihapus.`, confirmText: 'Ya, hapus', danger: true });
        if (!ok) return;
        Data.deleteCategory(id);
        Data.addLog(Auth.current(), 'Hapus kategori', c.nama);
        UI.toast('Kategori dihapus.', 'info');
        App.render();
    }

    /* ================= LOG ================= */
    function log(root) {
        const logs = Data.logs();
        root.innerHTML = `
        <div class="stack">
            <div class="page-head">
                <div><h1 class="page-head__title">Log Aktivitas</h1><p class="page-head__sub">Jejak audit aksi penting: pendaftaran, verifikasi toko, moderasi produk, dan perubahan status pesanan.</p></div>
                <button class="btn btn--danger-soft" onclick="AdminView.clearLogs()">${UI.icon('trash')} Bersihkan log</button>
            </div>
            <div class="card">
                <div class="card__head"><h2 class="card__title">${UI.icon('activity')} ${logs.length} entri terakhir</h2></div>
                <div class="card__body" style="padding:0">
                    ${logs.length ? logs.map((l) => `<div class="log-item">
                        <div class="log-item__dot"></div>
                        <div style="flex:1">
                            <div class="row row--between" style="align-items:flex-start">
                                <p class="small"><strong>${UI.esc(l.aktorName)}</strong> · ${UI.esc(l.aksi)}</p>
                                <span class="tiny muted nowrap">${UI.timeAgo(l.at)}</span>
                            </div>
                            <p class="tiny muted" style="margin-top:2px">${UI.esc(l.detail)}</p>
                            <p class="tiny muted" style="margin-top:2px">${UI.dateTime(l.at)}</p>
                        </div>
                    </div>`).join('') : UI.empty({ title: 'Log kosong', desc: 'Aktivitas pengguna akan tercatat di sini.' })}
                </div>
            </div>
        </div>`;
    }

    async function clearLogs() {
        const ok = await UI.confirm({ title: 'Bersihkan log?', message: 'Seluruh riwayat aktivitas akan dihapus.', confirmText: 'Ya, bersihkan', danger: true });
        if (!ok) return;
        Data.clearLogs();
        Data.addLog(Auth.current(), 'Bersihkan log', 'Semua log aktivitas dihapus.');
        UI.toast('Log dibersihkan.', 'info');
        App.render();
    }

    /* ================= PENGATURAN ================= */
    function pengaturan(root) {
        const s = Data.settings();
        const usage = DB.KEYS.reduce((total, k) => {
            try { total += (localStorage.getItem(DB.PREFIX + k) || '').length; } catch (e) { return total; }
            return total;
        }, 0);
        const kb = (usage / 1024).toFixed(1);

        root.innerHTML = `
        <div class="stack">
            <div class="page-head">
                <div><h1 class="page-head__title">Pengaturan Platform</h1><p class="page-head__sub">Konfigurasi nama platform, ongkir, komisi, dan data demo. Perubahan langsung dipakai di seluruh aplikasi.</p></div>
            </div>

            <div class="grid-2">
                <div class="card">
                    <div class="card__head"><h2 class="card__title">${UI.icon('settings')} Konfigurasi umum</h2></div>
                    <div class="card__body">
                        <form onsubmit="AdminView.saveSettings(event)" style="display:flex;flex-direction:column;gap:13px">
                            <div class="form-grid">
                                <div class="field"><label>Nama platform</label><input class="input" id="set-nama" value="${UI.esc(s.namaPlatform)}"></div>
                                <div class="field"><label>WA admin</label><input class="input" id="set-wa" value="${UI.esc(s.waAdmin)}" placeholder="6281234567890"></div>
                                <div class="field"><label>Ongkos kirim default (Rp)</label><input class="input" type="number" min="0" step="1000" id="set-ongkir" value="${s.ongkir}"></div>
                                <div class="field"><label>Komisi platform (%)</label><input class="input" type="number" min="0" max="50" step="0.5" id="set-komisi" value="${s.komisi}"></div>
                                <div class="field"><label>Minimum transaksi (Rp)</label><input class="input" type="number" min="0" step="1000" id="set-min" value="${s.minOrder}"></div>
                                <div class="field"><label>Versi aplikasi</label><input class="input" value="${UI.esc(s.versi)}" disabled></div>
                            </div>
                            <div class="field"><label>Tagline</label><input class="input" id="set-tagline" value="${UI.esc(s.tagline)}"></div>
                            <label class="check"><input type="checkbox" id="set-maint" ${s.maintenance ? 'checked' : ''}> Mode maintenance (tampilkan peringatan ke pengguna)</label>
                            <button class="btn btn--primary" style="align-self:flex-start">Simpan pengaturan</button>
                        </form>
                    </div>
                </div>

                <div class="stack">
                    <div class="card">
                        <div class="card__head"><h2 class="card__title">${UI.icon('box')} Penyimpanan lokal</h2></div>
                        <div class="card__body">
                            <p class="small muted" style="line-height:1.7">Database demo berjalan sepenuhnya di browser (localStorage). Tidak ada data yang dikirim ke server.</p>
                            <div class="row row--between" style="margin-top:12px"><span class="small muted">Ukuran terpakai</span><strong>${kb} KB</strong></div>
                            <div class="row row--between" style="margin-top:6px"><span class="small muted">Jumlah pesanan</span><strong>${Data.orders().length}</strong></div>
                            <div class="row row--between" style="margin-top:6px"><span class="small muted">Jumlah produk</span><strong>${Data.products().length}</strong></div>
                            <p class="tiny muted" style="margin-top:12px">Tip: hapus foto produk berukuran besar bila penyimpanan mendekati batas (± 5 MB).</p>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card__head"><h2 class="card__title">${UI.icon('refresh')} Data demo</h2></div>
                        <div class="card__body">
                            <p class="small muted" style="line-height:1.7">Reset mengembalikan seluruh data (pengguna, toko, produk, pesanan, pengaturan) ke kondisi awal.</p>
                            <button class="btn btn--danger-soft" style="margin-top:12px" onclick="AdminView.resetData()">${UI.icon('refresh')} Reset data demo</button>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card__head"><h2 class="card__title">${UI.icon('users')} Akun demo</h2></div>
                        <div class="card__body" style="display:flex;flex-direction:column;gap:8px">
                            <div class="row row--between"><span class="small">Admin</span><span class="mono tiny">admin@arasweet.id / admin123</span></div>
                            <div class="row row--between"><span class="small">Penjual</span><span class="mono tiny">dapur@arasweet.id / seller123</span></div>
                            <div class="row row--between"><span class="small">Pembeli</span><span class="mono tiny">rina@mail.com / pembeli123</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    }

    function saveSettings(event) {
        event.preventDefault();
        const ongkir = Number(document.getElementById('set-ongkir').value);
        const komisi = Number(document.getElementById('set-komisi').value);
        if (!Number.isFinite(ongkir) || ongkir < 0) { UI.toast('Ongkir tidak valid.', 'error'); return; }
        if (!Number.isFinite(komisi) || komisi < 0 || komisi > 50) { UI.toast('Komisi harus 0–50%.', 'error'); return; }
        Data.updateSettings({
            namaPlatform: document.getElementById('set-nama').value.trim(),
            waAdmin: document.getElementById('set-wa').value.trim(),
            ongkir,
            komisi,
            minOrder: Number(document.getElementById('set-min').value) || 0,
            tagline: document.getElementById('set-tagline').value.trim(),
            maintenance: document.getElementById('set-maint').checked
        });
        Data.addLog(Auth.current(), 'Perbarui pengaturan', `Ongkir ${UI.rupiah(ongkir)} · komisi ${komisi}%`);
        UI.toast('Pengaturan platform disimpan.');
        App.render();
    }

    async function resetData() {
        const ok = await UI.confirm({
            title: 'Reset seluruh data demo?',
            message: 'Semua perubahan (termasuk akun yang baru didaftarkan) akan hilang dan data awal dipulihkan. Anda akan keluar dari sesi.',
            confirmText: 'Ya, reset data', danger: true
        });
        if (!ok) return;
        Data.resetAll();
        Auth.clear();
        UI.toast('Data demo berhasil direset.', 'info');
        location.hash = '';
        App.renderAuth('login');
    }

    return {
        ringkasan, pengguna, filterUser, userDetail, toggleUser, resetPassword, deleteUser,
        toko, filterStore, approveStore, suspendStore,
        produk, filterProduct, toggleProduct, toggleFeatured, deleteProduct,
        pesanan, filterOrder,
        kategori, addCategory, editCategory, saveCategory, toggleCategory, deleteCategory,
        log, clearLogs, pengaturan, saveSettings, resetData
    };
})();

window.AdminView = AdminView;
