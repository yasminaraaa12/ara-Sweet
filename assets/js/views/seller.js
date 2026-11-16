/**
 * seller.js — dashboard penjual: ringkasan, CRUD produk, pesanan masuk, profil toko.
 */
const SellerView = (() => {
    const state = { q: '', status: 'semua', kategori: 'semua', orderStatus: 'semua' };

    function myStore(user) {
        let store = Data.storeByOwner(user.id);
        if (!store) {
            store = Data.saveStore({
                id: DB.uid('str'),
                ownerId: user.id,
                nama: 'Toko ' + user.nama,
                deskripsi: '',
                wa: (user.telepon || '').replace(/^0/, '62'),
                kota: user.kota || '',
                alamat: user.alamat || '',
                status: 'pending',
                buka: true,
                rating: 0,
                createdAt: new Date().toISOString()
            });
        }
        return store;
    }

    const revenueOf = (orders) => orders.filter((o) => o.status !== 'dibatalkan').reduce((s, o) => s + o.total, 0);

    function pendingBanner(store) {
        if (store.status === 'aktif') return '';
        return `<div class="notice notice--warn">${UI.icon('alert')}<div>
            <strong>Toko Anda belum terverifikasi admin</strong>
            Anda tetap bisa menyiapkan produk dan mengatur toko, tetapi produk baru tampil di katalog setelah admin menyetujui toko.
        </div></div>`;
    }

    /* ================= RINGKASAN ================= */
    function ringkasan(root, user) {
        const store = myStore(user);
        const products = Data.productsBySeller(user.id);
        const orders = Data.ordersBySeller(user.id);
        const activeProducts = products.filter((p) => p.status === 'aktif');
        const newOrders = orders.filter((o) => o.status === 'baru');
        const lowStock = activeProducts.filter((p) => Number(p.stok) <= 5);
        const revenue = revenueOf(orders);
        const itemsSold = orders.filter((o) => o.status !== 'dibatalkan').reduce((s, o) => s + o.items.reduce((x, i) => x + i.qty, 0), 0);

        const days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const key = d.toISOString().slice(0, 10);
            const dayOrders = orders.filter((o) => o.createdAt.slice(0, 10) === key && o.status !== 'dibatalkan');
            return { label: d.toLocaleDateString('id-ID', { weekday: 'short' }), count: dayOrders.length, total: dayOrders.reduce((s, o) => s + o.total, 0) };
        });
        const maxDay = Math.max(1, ...days.map((d) => d.count));

        const top = activeProducts.slice().sort((a, b) => Number(b.sold || 0) - Number(a.sold || 0)).slice(0, 5);

        root.innerHTML = `
        <div class="stack">
            ${pendingBanner(store)}
            <div class="page-head">
                <div>
                    <h1 class="page-head__title">Halo, ${UI.esc(user.nama.split(' ')[0])} 👋</h1>
                    <p class="page-head__sub">Ringkasan performa ${UI.esc(store.nama)}. Kelola stok dan pesanan agar pembeli tetap happy.</p>
                </div>
                <div class="row">
                    <button class="btn btn--ghost" onclick="App.go('/seller/pesanan')">${UI.icon('receipt')} Pesanan (${newOrders.length})</button>
                    <button class="btn btn--primary" onclick="SellerView.openForm()">${UI.icon('plus')} Tambah Produk</button>
                </div>
            </div>

            <div class="kpi-grid">
                <div class="kpi"><div class="kpi__ico kpi__ico--green">${UI.icon('bag')}</div><div><p class="kpi__label">Pendapatan</p><p class="kpi__value">${UI.rupiah(revenue)}</p><p class="kpi__sub">${itemsSold} item terjual</p></div></div>
                <div class="kpi"><div class="kpi__ico kpi__ico--pink">${UI.icon('receipt')}</div><div><p class="kpi__label">Pesanan Baru</p><p class="kpi__value">${newOrders.length}</p><p class="kpi__sub">dari ${orders.length} total pesanan</p></div></div>
                <div class="kpi"><div class="kpi__ico kpi__ico--violet">${UI.icon('box')}</div><div><p class="kpi__label">Produk Aktif</p><p class="kpi__value">${activeProducts.length}</p><p class="kpi__sub">${products.length} produk terdaftar</p></div></div>
                <div class="kpi"><div class="kpi__ico kpi__ico--amber">${UI.icon('alert')}</div><div><p class="kpi__label">Stok Menipis</p><p class="kpi__value">${lowStock.length}</p><p class="kpi__sub">stok ≤ 5 porsi</p></div></div>
            </div>

            <div class="grid-2">
                <div class="card">
                    <div class="card__head"><div><h2 class="card__title">${UI.icon('chart')} Pesanan 7 hari terakhir</h2><p class="card__sub">Jumlah pesanan masuk per hari</p></div></div>
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
                    <div class="card__head"><h2 class="card__title">${UI.icon('star')} Produk terlaris</h2></div>
                    <div class="card__body" style="display:flex;flex-direction:column;gap:11px">
                        ${top.length ? top.map((p) => `<div class="order-line">
                            <img src="${p.imageUrl}" alt="">
                            <div style="flex:1;min-width:0"><p class="bold" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${UI.esc(p.nama)}</p><p class="tiny muted">${UI.rupiah(p.harga)} · stok ${p.stok}</p></div>
                            <span class="badge badge--pink">${p.sold || 0} terjual</span>
                        </div>`).join('') : UI.empty({ title: 'Belum ada produk', desc: 'Tambahkan produk pertama Anda.' })}
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card__head">
                    <h2 class="card__title">${UI.icon('clock')} Pesanan terbaru</h2>
                    <button class="btn btn--link" onclick="App.go('/seller/pesanan')">Lihat semua</button>
                </div>
                <div class="table-wrap">
                    <table class="table">
                        <thead><tr><th>Kode</th><th>Pembeli</th><th>Item</th><th>Total</th><th>Status</th><th></th></tr></thead>
                        <tbody>
                            ${orders.slice(0, 5).map((o) => `<tr>
                                <td><p class="mono bold" style="font-size:11.5px">${o.kode}</p><p class="tiny muted">${UI.date(o.createdAt)}</p></td>
                                <td>${UI.esc(o.buyerName)}</td>
                                <td>${o.items.reduce((s, i) => s + i.qty, 0)} item</td>
                                <td class="bold">${UI.rupiah(o.total)}</td>
                                <td>${UI.badge(o.status)}</td>
                                <td class="num"><button class="btn btn--ghost btn--xs" onclick="Actions.viewOrder('${o.id}')">Detail</button></td>
                            </tr>`).join('') || `<tr><td colspan="6">${UI.empty({ title: 'Belum ada pesanan', desc: 'Pesanan pembeli akan tampil di sini.' })}</td></tr>`}
                        </tbody>
                    </table>
                </div>
            </div>

            ${lowStock.length ? `<div class="card">
                <div class="card__head"><h2 class="card__title">${UI.icon('alert')} Perlu restock</h2><span class="badge badge--amber">${lowStock.length} produk</span></div>
                <div class="card__body" style="display:flex;flex-direction:column;gap:9px">
                    ${lowStock.map((p) => `<div class="row row--between" style="border-bottom:1px solid var(--line-soft);padding-bottom:8px">
                        <div><p class="bold small">${UI.esc(p.nama)}</p><p class="tiny muted">${p.kategori}</p></div>
                        <div class="row"><span class="badge ${Number(p.stok) === 0 ? 'badge--red' : 'badge--amber'}">Stok ${p.stok}</span>
                        <button class="btn btn--ghost btn--xs" onclick="SellerView.openForm('${p.id}')">Atur stok</button></div>
                    </div>`).join('')}
                </div>
            </div>` : ''}
        </div>`;
    }

    /* ================= PRODUK ================= */
    function produk(root, user) {
        const products = Data.productsBySeller(user.id);
        const categories = Data.categories();
        const list = products.filter((p) => {
            const q = state.q.toLowerCase();
            return (!q || (p.nama + ' ' + p.kategori).toLowerCase().includes(q)) &&
                (state.status === 'semua' || p.status === state.status) &&
                (state.kategori === 'semua' || p.kategori === state.kategori);
        });

        root.innerHTML = `
        <div class="stack">
            <div class="page-head">
                <div>
                    <h1 class="page-head__title">Kelola Produk</h1>
                    <p class="page-head__sub">${products.length} produk terdaftar · ${products.filter((p) => p.status === 'aktif').length} aktif di katalog</p>
                </div>
                <button class="btn btn--primary" onclick="SellerView.openForm()">${UI.icon('plus')} Tambah Produk</button>
            </div>

            <div class="card">
                <div class="card__head">
                    <div class="table-toolbar">
                        <div class="search">${UI.icon('search')}<input class="input" value="${UI.esc(state.q)}" placeholder="Cari produk…" oninput="SellerView.filter('q', this.value)"></div>
                        <select class="select" onchange="SellerView.filter('kategori', this.value)">
                            <option value="semua">Semua kategori</option>
                            ${categories.map((c) => `<option value="${UI.esc(c.nama)}" ${state.kategori === c.nama ? 'selected' : ''}>${UI.esc(c.emoji + ' ' + c.nama)}</option>`).join('')}
                        </select>
                        <select class="select" onchange="SellerView.filter('status', this.value)">
                            <option value="semua" ${state.status === 'semua' ? 'selected' : ''}>Semua status</option>
                            <option value="aktif" ${state.status === 'aktif' ? 'selected' : ''}>Aktif</option>
                            <option value="nonaktif" ${state.status === 'nonaktif' ? 'selected' : ''}>Nonaktif</option>
                        </select>
                    </div>
                    <button class="btn btn--ghost btn--sm" onclick="SellerView.resetFilter()">Reset</button>
                </div>
                <div class="table-wrap">
                    <table class="table">
                        <thead><tr><th>Produk</th><th>Kategori</th><th class="num">Harga</th><th class="num">Stok</th><th class="center">Unggulan</th><th class="center">Status</th><th class="num">Aksi</th></tr></thead>
                        <tbody>
                            ${list.length ? list.map((p) => `<tr>
                                <td><div class="cell-produk"><img src="${p.imageUrl}" alt=""><div><strong>${UI.esc(p.nama)}</strong><span>${p.sold || 0} terjual</span></div></div></td>
                                <td><span class="badge badge--outline">${UI.esc(p.kategori)}</span></td>
                                <td class="num bold">${UI.rupiah(p.harga)}</td>
                                <td class="num"><span class="${Number(p.stok) === 0 ? 'stock stock--out' : Number(p.stok) <= 5 ? 'stock stock--low' : ''}">${p.stok}</span></td>
                                <td class="center"><button class="btn btn--xs ${p.unggulan ? 'btn--primary' : 'btn--ghost'}" onclick="SellerView.toggleFeatured('${p.id}')">${p.unggulan ? '⭐ Ya' : 'Biasa'}</button></td>
                                <td class="center"><button class="badge ${p.status === 'aktif' ? 'badge--green' : 'badge--slate'}" style="border:0;cursor:pointer" onclick="SellerView.toggleActive('${p.id}')">${p.status === 'aktif' ? 'Aktif' : 'Nonaktif'}</button></td>
                                <td class="num"><div class="btn-group"><button class="btn btn--ghost btn--xs" onclick="SellerView.openForm('${p.id}')">Edit</button><button class="btn btn--danger-soft btn--xs" onclick="SellerView.remove('${p.id}')">Hapus</button></div></td>
                            </tr>`).join('') : `<tr><td colspan="7">${UI.empty({ title: 'Belum ada produk', desc: 'Mulai dengan menambahkan produk pertama Anda.', action: `<button class="btn btn--primary btn--sm" onclick="SellerView.openForm()">Tambah produk</button>` })}</td></tr>`}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`;
    }

    function filter(key, value) {
        state[key] = value;
        App.render();
    }

    function resetFilter() {
        state.q = '';
        state.status = 'semua';
        state.kategori = 'semua';
        App.render();
    }

    function toggleFeatured(id) {
        const p = Data.product(id);
        if (!p) return;
        Data.updateProduct(id, { unggulan: !p.unggulan });
        Data.addLog(Auth.current(), 'Ubah produk unggulan', `${p.nama} → ${!p.unggulan ? 'unggulan' : 'biasa'}`);
        UI.toast('Status unggulan diperbarui.');
        App.render();
    }

    function toggleActive(id) {
        const p = Data.product(id);
        if (!p) return;
        Data.updateProduct(id, { status: p.status === 'aktif' ? 'nonaktif' : 'aktif' });
        UI.toast(`Produk "${p.nama}" ${p.status === 'aktif' ? 'dinonaktifkan' : 'diaktifkan'}.`);
        App.render();
    }

    async function remove(id) {
        const p = Data.product(id);
        if (!p) return;
        const ok = await UI.confirm({ title: 'Hapus produk?', message: `"${p.nama}" akan dihapus permanen dari katalog toko Anda.`, confirmText: 'Ya, hapus', danger: true });
        if (!ok) return;
        Data.deleteProduct(id);
        Data.addLog(Auth.current(), 'Hapus produk', p.nama);
        UI.toast('Produk dihapus.', 'info');
        App.render();
    }

    /* ---------- Form produk ---------- */
    function openForm(id) {
        const user = Auth.current();
        const existing = id ? Data.product(id) : null;
        if (existing && existing.sellerId !== user.id) { UI.toast('Produk ini bukan milik toko Anda.', 'error'); return; }
        const store = myStore(user);
        const categories = Data.categories().filter((c) => c.aktif);
        window._formImage = existing && existing.isCustomImage ? existing.imageUrl : '';
        const preset = existing ? existing.presetKey || 'strawberry-milk' : 'strawberry-milk';

        UI.modal({
            title: existing ? 'Edit Produk' : 'Tambah Produk Baru',
            subtitle: store.nama,
            size: 'lg',
            body: `
            <div id="pf-error" class="form-error hidden" style="margin-bottom:12px"></div>
            <div style="display:flex;flex-direction:column;gap:13px">
                <div class="field">
                    <label>Nama produk <span class="req">*</span></label>
                    <input class="input" id="pf-nama" maxlength="80" value="${UI.esc(existing ? existing.nama : '')}" placeholder="Contoh: Strawberry Velvet Dessert Box">
                </div>
                <div class="form-grid">
                    <div class="field">
                        <label>Kategori <span class="req">*</span></label>
                        <select class="select" id="pf-kategori">
                            ${existing && existing.kategori && !categories.some((c) => c.nama === existing.kategori) ? `<option value="${UI.esc(existing.kategori)}" selected>${UI.esc(existing.kategori)}</option>` : ''}
                            ${categories.map((c) => `<option value="${UI.esc(c.nama)}" ${existing && existing.kategori === c.nama ? 'selected' : ''}>${UI.esc(c.emoji + ' ' + c.nama)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="field">
                        <label>Harga (Rp) <span class="req">*</span></label>
                        <input class="input" id="pf-harga" type="number" min="0" step="500" value="${existing ? existing.harga : ''}" placeholder="25000">
                    </div>
                    <div class="field">
                        <label>Stok <span class="req">*</span></label>
                        <input class="input" id="pf-stok" type="number" min="0" step="1" value="${existing ? existing.stok : ''}" placeholder="15">
                    </div>
                    <div class="field">
                        <label>Gambar ilustrasi</label>
                        <select class="select" id="pf-preset" onchange="SellerView.setPreset(this.value)">
                            ${Data.presetList().map((p) => `<option value="${p.key}" ${preset === p.key ? 'selected' : ''}>${p.key}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="field">
                    <label>Deskripsi</label>
                    <textarea class="textarea" id="pf-deskripsi" rows="3" placeholder="Cita rasa, tekstur, ukuran porsi…">${UI.esc(existing ? existing.deskripsi : '')}</textarea>
                </div>
                <div class="form-section">
                    <p class="form-section__title">Foto produk (opsional)</p>
                    <div class="image-picker">
                        <img id="pf-preview" class="image-picker__preview" src="${existing ? existing.imageUrl : Data.PRESETS[preset]}" alt="Preview">
                        <div style="flex:1;display:flex;flex-direction:column;gap:8px">
                            <label class="upload-zone">${UI.icon('upload')} Unggah foto produk<input type="file" id="pf-file" accept="image/*" style="display:none" onchange="SellerView.handleFile(this)"></label>
                            <p class="field__hint">JPG/PNG/WEBP, otomatis dikompres ke maksimal 600px. Foto disimpan lokal (localStorage), maksimal ± 200KB.</p>
                            <button class="btn btn--link" style="align-self:flex-start" onclick="SellerView.clearPhoto()">Gunakan ilustrasi saja</button>
                        </div>
                    </div>
                </div>
                <label class="check"><input type="checkbox" id="pf-unggulan" ${existing && existing.unggulan ? 'checked' : ''}> Tandai sebagai produk unggulan</label>
            </div>`,
            footer: `<button class="btn btn--ghost" onclick="UI.closeModal()">Batal</button>
                     <button class="btn btn--primary" onclick="SellerView.save('${existing ? existing.id : ''}')">Simpan Produk</button>`
        });
    }

    function setPreset(key) {
        window._formImage = '';
        const img = document.getElementById('pf-preview');
        if (img && Data.PRESETS[key]) img.src = Data.PRESETS[key];
    }

    function clearPhoto() {
        window._formImage = '';
        const file = document.getElementById('pf-file');
        if (file) file.value = '';
        const preset = document.getElementById('pf-preset');
        const img = document.getElementById('pf-preview');
        if (img) img.src = Data.PRESETS[preset ? preset.value : 'strawberry-milk'];
        UI.toast('Foto dihapus, ilustrasi dipakai.', 'info');
    }

    function compress(file, maxWidth = 600, quality = 0.72) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    let w = img.width;
                    let h = img.height;
                    if (w > maxWidth) { h = Math.round((h * maxWidth) / w); w = maxWidth; }
                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.onerror = () => reject(new Error('Gagal memproses gambar.'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Gagal membaca file.'));
            reader.readAsDataURL(file);
        });
    }

    async function handleFile(input) {
        const file = input.files && input.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { UI.toast('File harus berupa gambar.', 'error'); return; }
        try {
            const dataUrl = await compress(file);
            if (dataUrl.length > 260000) { UI.toast('Foto masih terlalu besar. Pilih foto lain.', 'error'); return; }
            window._formImage = dataUrl;
            const img = document.getElementById('pf-preview');
            if (img) img.src = dataUrl;
            UI.toast('Foto siap digunakan.');
        } catch (err) {
            UI.toast('Gagal memproses foto.', 'error');
        }
    }

    function save(id) {
        const user = Auth.current();
        const store = myStore(user);
        const err = document.getElementById('pf-error');
        const show = (msg) => { err.textContent = msg; err.classList.remove('hidden'); };

        const nama = document.getElementById('pf-nama').value.trim();
        const kategori = document.getElementById('pf-kategori').value;
        const harga = Number(document.getElementById('pf-harga').value);
        const stok = Number(document.getElementById('pf-stok').value);
        const deskripsi = document.getElementById('pf-deskripsi').value.trim();
        const unggulan = document.getElementById('pf-unggulan').checked;
        const presetKey = document.getElementById('pf-preset').value;

        if (nama.length < 3) return show('Nama produk minimal 3 karakter.');
        if (!Number.isFinite(harga) || harga < 1000) return show('Harga minimal Rp 1.000.');
        if (!Number.isInteger(stok) || stok < 0) return show('Stok harus bilangan bulat ≥ 0.');
        if (!kategori) return show('Kategori wajib dipilih.');

        const custom = window._formImage;
        const data = {
            nama, kategori, harga, stok, deskripsi,
            unggulan,
            presetKey,
            sellerId: user.id,
            storeId: store.id,
            imageUrl: custom || Data.PRESETS[presetKey],
            isCustomImage: Boolean(custom)
        };

        if (id) {
            Data.updateProduct(id, { ...data, updatedAt: new Date().toISOString() });
            Data.addLog(user, 'Edit produk', `${nama} · ${UI.rupiah(harga)}`);
            UI.toast('Produk diperbarui.');
        } else {
            Data.saveProduct({
                id: DB.uid('prd'),
                ...data,
                sold: 0,
                status: 'aktif',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            Data.addLog(user, 'Tambah produk', `${nama} · ${UI.rupiah(harga)}`);
            UI.toast('Produk baru ditambahkan.');
        }
        UI.closeModal();
        App.render();
    }

    /* ================= PESANAN ================= */
    function pesanan(root, user) {
        const store = myStore(user);
        const all = Data.ordersBySeller(user.id);
        const filter = state.orderStatus;
        const list = filter === 'semua' ? all : all.filter((o) => o.status === filter);
        const counts = ['semua', 'baru', 'diproses', 'dikirim', 'selesai', 'dibatalkan'];

        root.innerHTML = `
        <div class="stack">
            <div class="page-head">
                <div>
                    <h1 class="page-head__title">Pesanan Masuk</h1>
                    <p class="page-head__sub">Proses pesanan dari pembeli: konfirmasi, kirim, lalu tandai selesai.</p>
                </div>
                ${UI.badge(store.status === 'aktif' ? 'aktif' : 'pending', store.status === 'aktif' ? 'Toko aktif' : 'Menunggu verifikasi')}
            </div>

            <div class="pills">
                ${counts.map((key) => `<button class="pill ${filter === key ? 'is-active' : ''}" onclick="SellerView.filterOrders('${key}')">
                    ${key === 'semua' ? 'Semua' : UI.badge(key).replace(/<[^>]+>/g, '')} (${key === 'semua' ? all.length : all.filter((o) => o.status === key).length})
                </button>`).join('')}
            </div>

            <div class="card">
                <div class="table-wrap">
                    <table class="table">
                        <thead><tr><th>Kode & Tanggal</th><th>Pembeli</th><th>Produk</th><th class="num">Total</th><th>Status</th><th class="num">Aksi</th></tr></thead>
                        <tbody>
                            ${list.length ? list.map((o) => `<tr>
                                <td><p class="mono bold" style="font-size:11.5px">${o.kode}</p><p class="tiny muted">${UI.dateTime(o.createdAt)}</p></td>
                                <td><p class="bold">${UI.esc(o.buyerName)}</p><p class="tiny muted">${UI.esc(o.telepon || '-')}</p></td>
                                <td>
                                    <p class="small">${UI.esc(o.items[0].nama)}${o.items.length > 1 ? ` +${o.items.length - 1} lainnya` : ''}</p>
                                    <p class="tiny muted">${o.items.reduce((s, i) => s + i.qty, 0)} item · ${UI.esc(o.pengiriman)}</p>
                                </td>
                                <td class="num bold">${UI.rupiah(o.total)}</td>
                                <td>${UI.badge(o.status)}</td>
                                <td class="num"><div class="btn-group">
                                    <button class="btn btn--ghost btn--xs" onclick="Actions.viewOrder('${o.id}')">Detail</button>
                                    ${App.Status.nextStatus(o.status) ? `<button class="btn btn--primary btn--xs" onclick="Actions.setStatus('${o.id}','${App.Status.nextStatus(o.status)}')">
                                        ${o.status === 'baru' ? 'Proses' : o.status === 'diproses' ? 'Kirim' : 'Selesai'}
                                    </button>` : ''}
                                </div></td>
                            </tr>`).join('') : `<tr><td colspan="6">${UI.empty({ title: 'Tidak ada pesanan', desc: 'Pesanan dengan filter ini belum tersedia.' })}</td></tr>`}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`;
    }

    function filterOrders(status) {
        state.orderStatus = status;
        App.render();
    }

    /* ================= TOKO ================= */
    function toko(root, user) {
        const store = myStore(user);
        root.innerHTML = `
        <div class="stack">
            ${pendingBanner(store)}
            <div class="page-head">
                <div>
                    <h1 class="page-head__title">Pengaturan Toko</h1>
                    <p class="page-head__sub">Informasi ini tampil di katalog dan dipakai saat pembeli menghubungi Anda via WhatsApp.</p>
                </div>
                ${UI.badge(store.status === 'aktif' ? 'aktif' : 'pending')}
            </div>

            <div class="grid-2">
                <div class="card">
                    <div class="card__head"><h2 class="card__title">${UI.icon('store')} Profil toko</h2></div>
                    <div class="card__body">
                        <form onsubmit="SellerView.saveStore(event)" style="display:flex;flex-direction:column;gap:13px">
                            <div class="field"><label>Nama toko <span class="req">*</span></label><input class="input" id="st-nama" value="${UI.esc(store.nama)}" required></div>
                            <div class="field"><label>Deskripsi singkat</label><textarea class="textarea" id="st-deskripsi" rows="3" placeholder="Ceritakan keunggulan produk Anda">${UI.esc(store.deskripsi || '')}</textarea></div>
                            <div class="form-grid">
                                <div class="field">
                                    <label>Nomor WhatsApp <span class="req">*</span></label>
                                    <input class="input" id="st-wa" value="${UI.esc(store.wa)}" placeholder="6281234567890" inputmode="numeric">
                                    <p class="field__hint">Format internasional, contoh 6281234567890.</p>
                                </div>
                                <div class="field"><label>Kota</label><input class="input" id="st-kota" value="${UI.esc(store.kota || '')}"></div>
                            </div>
                            <div class="field"><label>Alamat</label><textarea class="textarea" id="st-alamat" rows="2">${UI.esc(store.alamat || '')}</textarea></div>
                            <label class="check"><input type="checkbox" id="st-buka" ${store.buka ? 'checked' : ''} ${store.status !== 'aktif' ? 'disabled' : ''}> Toko buka & menerima pesanan</label>
                            <button class="btn btn--primary" style="align-self:flex-start">Simpan pengaturan toko</button>
                        </form>
                    </div>
                </div>

                <div class="stack">
                    <div class="card">
                        <div class="card__head"><h2 class="card__title">${UI.icon('shield')} Status verifikasi</h2></div>
                        <div class="card__body" style="display:flex;flex-direction:column;gap:10px">
                            <div class="row row--between"><span class="small muted">Status toko</span>${UI.badge(store.status === 'aktif' ? 'aktif' : 'pending')}</div>
                            <div class="row row--between"><span class="small muted">Bergabung</span><span class="small bold">${UI.date(store.createdAt)}</span></div>
                            <div class="row row--between"><span class="small muted">Produk terdaftar</span><span class="small bold">${Data.productsBySeller(user.id).length}</span></div>
                            <div class="row row--between"><span class="small muted">Pesanan</span><span class="small bold">${Data.ordersBySeller(user.id).length}</span></div>
                            ${store.status !== 'aktif' ? `<div class="notice notice--info">${UI.icon('clock')}<div><strong>Menunggu admin</strong>Admin akan memverifikasi toko Anda. Pastikan nama toko dan nomor WhatsApp valid.</div></div>` : `<div class="notice notice--success">${UI.icon('check')}<div><strong>Toko terverifikasi</strong>Produk aktif Anda sudah tampil di katalog pembeli.</div></div>`}
                        </div>
                    </div>

                    <div class="card">
                        <div class="card__head"><h2 class="card__title">${UI.icon('whatsapp')} Cek pesan WhatsApp</h2></div>
                        <div class="card__body">
                            <p class="small muted" style="line-height:1.65">Pembeli dapat menghubungi Anda langsung. Format pesan otomatis sudah menyertakan nama produk, jumlah, dan estimasi total.</p>
                            <a class="btn btn--success" style="margin-top:12px" href="https://wa.me/${store.wa}" target="_blank" rel="noopener">${UI.icon('whatsapp')} Buka WhatsApp toko</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    }

    function saveStore(event) {
        event.preventDefault();
        const user = Auth.current();
        const store = myStore(user);
        const nama = document.getElementById('st-nama').value.trim();
        const waRaw = document.getElementById('st-wa').value.trim().replace(/[\s\-+()]/g, '');
        const wa = waRaw.startsWith('0') ? '62' + waRaw.slice(1) : waRaw;
        const buka = document.getElementById('st-buka').checked;

        if (nama.length < 3) { UI.toast('Nama toko minimal 3 karakter.', 'error'); return; }
        if (!/^62[0-9]{7,13}$/.test(wa)) { UI.toast('Nomor WhatsApp tidak valid. Gunakan format 628xxxxxxxxxx.', 'error'); return; }

        Data.updateStore(store.id, {
            nama,
            deskripsi: document.getElementById('st-deskripsi').value.trim(),
            wa,
            kota: document.getElementById('st-kota').value.trim(),
            alamat: document.getElementById('st-alamat').value.trim(),
            buka
        });
        Data.updateUser(user.id, { telepon: wa });
        Data.addLog(user, 'Perbarui toko', `${nama} · WA ${wa}`);
        UI.toast('Pengaturan toko disimpan.');
        App.render();
    }

    /* ================= PROFIL ================= */
    function profil(root, user) {
        const store = myStore(user);
        const orders = Data.ordersBySeller(user.id);
        root.innerHTML = `
        <div class="stack">
            <div class="profile-head">
                ${UI.avatar(user.nama, 'avatar--lg avatar--violet')}
                <div style="flex:1"><h2>${UI.esc(user.nama)}</h2><p>${UI.esc(user.email)} · Penjual sejak ${UI.date(user.createdAt)}</p></div>
                ${UI.badge('seller')}
            </div>
            <div class="kpi-grid">
                <div class="kpi"><div class="kpi__ico kpi__ico--pink">${UI.icon('box')}</div><div><p class="kpi__label">Produk</p><p class="kpi__value">${Data.productsBySeller(user.id).length}</p></div></div>
                <div class="kpi"><div class="kpi__ico kpi__ico--green">${UI.icon('receipt')}</div><div><p class="kpi__label">Pesanan</p><p class="kpi__value">${orders.length}</p></div></div>
                <div class="kpi"><div class="kpi__ico kpi__ico--violet">${UI.icon('store')}</div><div><p class="kpi__label">Toko</p><p class="kpi__value" style="font-size:16px">${UI.esc(store.nama)}</p></div></div>
            </div>
            <div class="grid-2--even">
                <div class="card">
                    <div class="card__head"><h2 class="card__title">${UI.icon('users')} Data diri</h2></div>
                    <div class="card__body">
                        <form onsubmit="SellerView.saveProfile(event)" style="display:flex;flex-direction:column;gap:12px">
                            <div class="field"><label>Nama lengkap</label><input class="input" id="sp-nama" value="${UI.esc(user.nama)}" required></div>
                            <div class="field"><label>Email</label><input class="input" value="${UI.esc(user.email)}" disabled></div>
                            <div class="form-grid">
                                <div class="field"><label>No. WhatsApp</label><input class="input" id="sp-telepon" value="${UI.esc(user.telepon || '')}"></div>
                                <div class="field"><label>Kota</label><input class="input" id="sp-kota" value="${UI.esc(user.kota || '')}"></div>
                            </div>
                            <div class="field"><label>Alamat</label><textarea class="textarea" id="sp-alamat" rows="2">${UI.esc(user.alamat || '')}</textarea></div>
                            <button class="btn btn--primary" style="align-self:flex-start">Simpan perubahan</button>
                        </form>
                    </div>
                </div>
                <div class="card">
                    <div class="card__head"><h2 class="card__title">${UI.icon('lock')} Ubah password</h2></div>
                    <div class="card__body">
                        <form onsubmit="SellerView.changePassword(event)" style="display:flex;flex-direction:column;gap:12px">
                            <div class="field"><label>Password lama</label><input class="input" type="password" id="spw-old" required></div>
                            <div class="field"><label>Password baru</label><input class="input" type="password" id="spw-new" placeholder="Minimal 6 karakter" required></div>
                            <div class="field"><label>Konfirmasi password baru</label><input class="input" type="password" id="spw-confirm" required></div>
                            <button class="btn btn--dark" style="align-self:flex-start">Perbarui password</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>`;
    }

    function saveProfile(event) {
        event.preventDefault();
        const user = Auth.current();
        const nama = document.getElementById('sp-nama').value.trim();
        if (nama.length < 3) { UI.toast('Nama minimal 3 karakter.', 'error'); return; }
        Auth.updateProfile(user, {
            nama,
            telepon: document.getElementById('sp-telepon').value.trim(),
            kota: document.getElementById('sp-kota').value.trim(),
            alamat: document.getElementById('sp-alamat').value.trim()
        });
        UI.toast('Profil disimpan.');
        App.render();
    }

    function changePassword(event) {
        event.preventDefault();
        const res = Auth.changePassword(Auth.current(),
            document.getElementById('spw-old').value,
            document.getElementById('spw-new').value,
            document.getElementById('spw-confirm').value);
        if (!res.ok) { UI.toast(res.message, 'error'); return; }
        UI.toast('Password diperbarui.');
        event.target.reset();
    }

    return {
        ringkasan, produk, filter, resetFilter, toggleFeatured, toggleActive, remove,
        openForm, setPreset, clearPhoto, handleFile, save,
        pesanan, filterOrders, toko, saveStore, profil, saveProfile, changePassword, myStore
    };
})();

window.SellerView = SellerView;
