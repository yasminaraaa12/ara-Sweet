/**
 * buyer.js — tampilan pembeli: katalog, detail produk, keranjang, checkout, pesanan, profil.
 */
const BuyerView = (() => {
    let me = null;
    const state = { q: '', kategori: 'Semua', toko: 'Semua', sort: 'default', unggulan: false };

    const activeStore = (p) => {
        const store = Data.store(p.storeId);
        return store && store.status === 'aktif' ? store : null;
    };

    function available() {
        return Data.products().filter((p) => p.status === 'aktif' && activeStore(p));
    }

    function cartDetails(user) {
        const items = Data.cart(user.id);
        return items.map((ci) => {
            const p = Data.product(ci.productId);
            if (!p) return null;
            return { ...ci, product: p, store: Data.store(p.storeId), lineTotal: p.harga * ci.qty };
        }).filter(Boolean);
    }

    /* ================= KATALOG ================= */
    function katalog(root, user) {
        me = user;
        const products = available();
        const categories = Data.categories().filter((c) => c.aktif);
        const stores = Data.stores().filter((s) => s.status === 'aktif');

        root.innerHTML = `
        <div class="stack">
            <section class="hero">
                <span class="hero__tag">🌸 Freshly made everyday · UMKM lokal</span>
                <h1 class="hero__title">Maniskan harimu dengan sajian spesial ara'Sweet</h1>
                <p class="hero__text">Dessert box, kue lembut, pudding segar, sampai hampers cantik dari penjual UMKM terverifikasi. Pilih produk, masukkan keranjang, lalu checkout dalam satu alur.</p>
                <div class="hero__stats">
                    <div class="hero__stat"><strong>${products.length}</strong><span>Produk aktif</span></div>
                    <div class="hero__stat"><strong>${stores.length}</strong><span>Toko terverifikasi</span></div>
                    <div class="hero__stat"><strong>${Data.orders().length}</strong><span>Total pesanan</span></div>
                </div>
            </section>

            <section class="filterbar">
                <div class="filterbar__row">
                    <div class="search">
                        ${UI.icon('search')}
                        <input class="input" id="buyer-search" placeholder="Cari dessert, minuman, rasa, atau toko…" value="${UI.esc(state.q)}" oninput="BuyerView.setFilter('q', this.value)">
                    </div>
                    <select class="select" id="buyer-store" onchange="BuyerView.setFilter('toko', this.value)">
                        <option value="Semua">Semua toko</option>
                        ${stores.map((s) => `<option value="${UI.esc(s.nama)}" ${state.toko === s.nama ? 'selected' : ''}>${UI.esc(s.nama)}</option>`).join('')}
                    </select>
                    <select class="select" id="buyer-sort" onchange="BuyerView.setFilter('sort', this.value)">
                        <option value="default" ${state.sort === 'default' ? 'selected' : ''}>Terbaru</option>
                        <option value="featured" ${state.sort === 'featured' ? 'selected' : ''}>Unggulan dahulu</option>
                        <option value="price-asc" ${state.sort === 'price-asc' ? 'selected' : ''}>Harga terendah</option>
                        <option value="price-desc" ${state.sort === 'price-desc' ? 'selected' : ''}>Harga tertinggi</option>
                        <option value="name-asc" ${state.sort === 'name-asc' ? 'selected' : ''}>Nama A–Z</option>
                    </select>
                    <label class="check" style="white-space:nowrap;font-weight:700">
                        <input type="checkbox" ${state.unggulan ? 'checked' : ''} onchange="BuyerView.setFilter('unggulan', this.checked)">
                        ⭐ Unggulan
                    </label>
                </div>
                <div class="pills" id="category-pills">
                    ${['Semua', ...categories.map((c) => c.nama)].map((cat) => `
                        <button class="pill ${state.kategori === cat ? 'is-active' : ''}" onclick="BuyerView.setFilter('kategori','${UI.esc(cat)}')">${UI.esc(cat)}</button>`).join('')}
                </div>
            </section>

            <div class="row row--between" style="padding:0 4px">
                <p class="small muted" id="catalog-count"></p>
                <button class="btn btn--link" onclick="BuyerView.resetFilter()">Reset filter</button>
            </div>

            <section id="catalog-grid" class="product-grid"></section>
        </div>`;

        renderGrid();
    }

    function setFilter(key, value) {
        state[key] = value;
        if (key === 'kategori') {
            document.querySelectorAll('#category-pills .pill').forEach((p) => {
                p.classList.toggle('is-active', p.textContent.trim() === value);
            });
        }
        renderGrid();
    }

    function resetFilter() {
        Object.assign(state, { q: '', kategori: 'Semua', toko: 'Semua', sort: 'default', unggulan: false });
        document.querySelectorAll('#category-pills .pill').forEach((p) => p.classList.toggle('is-active', p.textContent.trim() === 'Semua'));
        const q = document.getElementById('buyer-search');
        if (q) q.value = '';
        const store = document.getElementById('buyer-store');
        if (store) store.value = 'Semua';
        const sort = document.getElementById('buyer-sort');
        if (sort) sort.value = 'default';
        const feat = document.querySelector('.filterbar .check input');
        if (feat) feat.checked = false;
        renderGrid();
    }

    function filtered() {
        const q = state.q.trim().toLowerCase();
        let list = available().filter((p) => {
            const store = activeStore(p);
            const hay = [p.nama, p.deskripsi, p.kategori, store ? store.nama : ''].join(' ').toLowerCase();
            return (!q || hay.includes(q)) &&
                (state.kategori === 'Semua' || p.kategori === state.kategori) &&
                (state.toko === 'Semua' || (store && store.nama === state.toko)) &&
                (!state.unggulan || p.unggulan);
        });
        if (state.sort === 'price-asc') list.sort((a, b) => a.harga - b.harga);
        else if (state.sort === 'price-desc') list.sort((a, b) => b.harga - a.harga);
        else if (state.sort === 'name-asc') list.sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
        else if (state.sort === 'featured') list.sort((a, b) => Number(b.unggulan) - Number(a.unggulan));
        else list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return list;
    }

    function renderGrid() {
        const grid = document.getElementById('catalog-grid');
        const count = document.getElementById('catalog-count');
        if (!grid) return;
        const list = filtered();
        if (count) count.textContent = `Menampilkan ${list.length} produk dari ${available().length} produk aktif`;
        if (!list.length) {
            grid.innerHTML = `<div style="grid-column:1/-1">${UI.empty({
                title: 'Produk tidak ditemukan',
                desc: 'Coba kata kunci lain atau pilih kategori yang berbeda.',
                action: `<button class="btn btn--primary" onclick="BuyerView.resetFilter()">Tampilkan semua</button>`
            })}</div>`;
            return;
        }
        grid.innerHTML = list.map((p) => {
            const store = activeStore(p);
            const out = Number(p.stok) <= 0;
            const closed = store && !store.buka;
            return `<article class="product">
                <div class="product__media" role="button" tabindex="0" style="cursor:pointer" onclick="BuyerView.detail('${p.id}')" aria-label="Lihat ${UI.esc(p.nama)}">
                    <img src="${p.imageUrl || Data.PRESETS['strawberry-milk']}" alt="${UI.esc(p.nama)}" loading="lazy">
                    <div class="product__badges">
                        <span class="tag-soft">${UI.esc(p.kategori)}</span>
                        ${p.unggulan ? '<span class="tag-star">⭐ Unggulan</span>' : ''}
                    </div>
                    ${out ? '<div class="product__soldout"><span>Stok habis</span></div>' : ''}
                </div>
                <div class="product__body">
                    <p class="product__store">${UI.icon('store')} ${UI.esc(store.nama)} ${closed ? '<span class="badge badge--amber" style="margin-left:auto">Tutup</span>' : ''}</p>
                    <h3 class="product__name">${UI.esc(p.nama)}</h3>
                    <p class="product__desc">${UI.esc(p.deskripsi || '-')}</p>
                    <div class="product__foot">
                        <div class="product__meta">
                            <span class="product__price">${UI.rupiah(p.harga)}</span>
                            <span class="stock ${out ? 'stock--out' : Number(p.stok) <= 5 ? 'stock--low' : ''}">${out ? 'Habis' : 'Stok ' + p.stok}</span>
                        </div>
                        <div class="product__actions">
                            <button class="btn btn--ghost btn--sm" onclick="BuyerView.detail('${p.id}')">Detail</button>
                            <button class="btn btn--primary btn--sm" ${out ? 'disabled' : ''} onclick="BuyerView.add('${p.id}')">${UI.icon('cart')} Tambah</button>
                        </div>
                    </div>
                </div>
            </article>`;
        }).join('');
    }

    function detail(productId) {
        const p = Data.product(productId);
        if (!p) return;
        const store = Data.store(p.storeId);
        const out = Number(p.stok) <= 0;
        UI.modal({
            title: p.nama,
            subtitle: `${store ? store.nama : '-'} · ${p.kategori}`,
            size: 'lg',
            body: `
                <img src="${p.imageUrl}" alt="${UI.esc(p.nama)}" style="width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:16px;border:1px solid var(--line)">
                <div class="row row--between" style="margin-top:14px">
                    <p class="product__price" style="font-size:22px">${UI.rupiah(p.harga)}</p>
                    ${UI.badge(out ? 'dibatalkan' : 'aktif', out ? 'Stok habis' : 'Stok ' + p.stok)}
                </div>
                <p class="small muted" style="margin-top:10px;line-height:1.7">${UI.esc(p.deskripsi || 'Belum ada deskripsi produk.')}</p>
                <div class="form-section" style="margin-top:14px">
                    <p class="form-section__title">Informasi Toko</p>
                    <p class="bold">${UI.esc(store ? store.nama : '-')}</p>
                    <p class="small muted">${UI.esc(store ? store.kota : '')} ${store && !store.buka ? '· Toko sedang tutup' : ''}</p>
                    <p class="small muted" style="margin-top:3px">WA: +${UI.esc(store ? store.wa : '-')}</p>
                </div>
                <div class="row" style="margin-top:16px;gap:9px">
                    <div class="stepper">
                        <button onclick="BuyerView.qty(-1)" aria-label="Kurangi">−</button>
                        <span id="detail-qty">1</span>
                        <button onclick="BuyerView.qty(1)" aria-label="Tambah">+</button>
                    </div>
                    <button class="btn btn--primary" style="flex:1" ${out || (store && !store.buka) ? 'disabled' : ''} onclick="BuyerView.add('${p.id}', true)">
                        ${UI.icon('cart')} Tambah ke keranjang
                    </button>
                </div>
                <button class="btn btn--ghost btn--block" style="margin-top:9px" ${out ? 'disabled' : ''} onclick="BuyerView.wa('${p.id}')">
                    ${UI.icon('whatsapp')} Tanya / pesan via WhatsApp toko
                </button>`,
            footer: `<button class="btn btn--ghost" onclick="UI.closeModal()">Tutup</button>`
        });
        window._detailQty = 1;
        window._detailMax = Number(p.stok);
    }

    function qty(delta) {
        const max = window._detailMax || 1;
        window._detailQty = Math.min(max, Math.max(1, (window._detailQty || 1) + delta));
        const el = document.getElementById('detail-qty');
        if (el) el.textContent = window._detailQty;
    }

    function add(productId, fromModal) {
        const user = Auth.current();
        if (!user || user.role !== 'pembeli') { UI.toast('Masuk sebagai pembeli untuk berbelanja.', 'error'); return; }
        const p = Data.product(productId);
        if (!p) return;
        const store = Data.store(p.storeId);
        if (store && !store.buka) { UI.toast('Toko sedang tutup. Coba lagi nanti.', 'error'); return; }
        const addQty = fromModal ? (window._detailQty || 1) : 1;
        const cart = Data.cart(user.id);
        const found = cart.find((i) => i.productId === productId);
        const currentQty = found ? found.qty : 0;
        if (currentQty + addQty > Number(p.stok)) {
            UI.toast(`Stok tersisa ${p.stok}. Tidak bisa menambah lagi.`, 'error');
            return;
        }
        if (found) found.qty += addQty;
        else cart.push({ productId, qty: addQty, sellerId: p.sellerId });
        Data.setCart(user.id, cart);
        UI.toast(`${p.nama} ditambahkan ke keranjang.`);
        if (fromModal) UI.closeModal();
        App.render();
    }

    function wa(productId) {
        const p = Data.product(productId);
        const store = p ? Data.store(p.storeId) : null;
        if (!p || !store) return;
        const qty = window._detailQty || 1;
        const msg = [
            `Halo ${store.nama}! Saya ingin memesan:`,
            '',
            `• Produk: *${p.nama}*`,
            `• Kategori: ${p.kategori}`,
            `• Harga: ${UI.rupiah(p.harga)}`,
            `• Jumlah: ${qty}`,
            `• Estimasi total: *${UI.rupiah(p.harga * qty)}*`,
            '',
            'Apakah stok tersedia? Terima kasih!'
        ].join('\n');
        window.open(`https://wa.me/${store.wa}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    }

    /* ================= KERANJANG ================= */
    function keranjang(root, user) {
        me = user;
        const items = cartDetails(user);
        const settings = Data.settings();
        const ongkir = Number(settings.ongkir) || 0;

        if (!items.length) {
            root.innerHTML = `<div class="card"><div class="card__body">${UI.empty({
                iconName: 'cart',
                title: 'Keranjang masih kosong',
                desc: 'Yuk pilih dessert dan minuman favoritmu dari katalog ara\'Sweet.',
                action: `<button class="btn btn--primary" onclick="App.go('/pembeli/katalog')">Jelajahi katalog</button>`
            })}</div></div>`;
            return;
        }

        const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);

        root.innerHTML = `
        <div class="grid-2">
            <div class="stack">
                <div class="card">
                    <div class="card__head">
                        <h2 class="card__title">${UI.icon('cart')} Produk di keranjang</h2>
                        <span class="badge badge--pink">${items.reduce((s, i) => s + i.qty, 0)} item</span>
                    </div>
                    <div class="card__body" id="cart-list">
                        ${items.map((i) => `
                        <div class="cart-item">
                            <img src="${i.product.imageUrl}" alt="">
                            <div>
                                <p class="cart-item__name">${UI.esc(i.product.nama)}</p>
                                <p class="cart-item__meta">${UI.esc(i.store ? i.store.nama : '-')} · ${UI.rupiah(i.product.harga)}</p>
                                <p class="cart-item__meta" style="margin-top:5px">
                                    <button class="btn--link" onclick="BuyerView.removeItem('${i.product.id}')">Hapus</button>
                                </p>
                            </div>
                            <div class="cart-item__right">
                                <div class="stepper">
                                    <button onclick="BuyerView.cartQty('${i.product.id}', -1)" ${i.qty <= 1 ? 'disabled' : ''}>−</button>
                                    <span>${i.qty}</span>
                                    <button onclick="BuyerView.cartQty('${i.product.id}', 1)" ${i.qty >= i.product.stok ? 'disabled' : ''}>+</button>
                                </div>
                                <p class="bold">${UI.rupiah(i.lineTotal)}</p>
                            </div>
                        </div>`).join('')}
                    </div>
                </div>

                <div class="card">
                    <div class="card__head"><h2 class="card__title">${UI.icon('truck')} Data pengiriman</h2></div>
                    <div class="card__body">
                        <form id="checkout-form" onsubmit="BuyerView.checkout(event)" class="stack--sm" style="display:flex;flex-direction:column;gap:12px">
                            <div class="form-grid">
                                <div class="field">
                                    <label for="co-nama">Nama penerima <span class="req">*</span></label>
                                    <input class="input" id="co-nama" value="${UI.esc(user.nama)}" required>
                                </div>
                                <div class="field">
                                    <label for="co-telepon">No. WhatsApp <span class="req">*</span></label>
                                    <input class="input" id="co-telepon" value="${UI.esc(user.telepon || '')}" placeholder="08xxxxxxxxxx" required>
                                </div>
                            </div>
                            <div class="field">
                                <label for="co-alamat">Alamat lengkap <span class="req">*</span></label>
                                <textarea class="textarea" id="co-alamat" rows="2" placeholder="Jalan, nomor rumah, kelurahan, kota" required>${UI.esc(user.alamat || '')}</textarea>
                            </div>
                            <div class="field">
                                <label for="co-catatan">Catatan untuk penjual</label>
                                <input class="input" id="co-catatan" placeholder="Contoh: tanpa kacang, kirim sore hari">
                            </div>
                            <div class="form-grid">
                                <div class="field">
                                    <label>Metode pengiriman</label>
                                    <select class="select" id="co-pengiriman" onchange="BuyerView.updateSummary()">
                                        <option value="Kurir lokal">Kurir lokal · ${UI.rupiah(ongkir)}</option>
                                        <option value="Ambil di toko">Ambil di toko · Gratis</option>
                                    </select>
                                </div>
                                <div class="field">
                                    <label>Metode pembayaran</label>
                                    <select class="select" id="co-pembayaran">
                                        <option>COD</option>
                                        <option>Transfer Bank</option>
                                        <option>Bayar di tempat</option>
                                        <option>QRIS</option>
                                    </select>
                                </div>
                            </div>
                            <div class="notice notice--info" style="margin-top:2px">
                                ${UI.icon('alert')}
                                <div><strong>Pesanan dipecah otomatis per toko</strong>Setiap toko memproses dan mengirim pesanannya sendiri dengan ongkir terpisah.</div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <aside class="card" style="position:sticky;top:82px">
                <div class="card__head"><h2 class="card__title">Ringkasan pesanan</h2></div>
                <div class="card__body">
                    <div id="cart-summary">
                        <div class="summary-row"><span>Subtotal (${items.length} produk)</span><span>${UI.rupiah(subtotal)}</span></div>
                        <div class="summary-row"><span>Ongkos kirim</span><span id="sum-ongkir">${UI.rupiah(ongkir)}</span></div>
                        <div class="summary-row summary-row--total"><span>Total</span><span id="sum-total">${UI.rupiah(subtotal + ongkir)}</span></div>
                    </div>
                    <button class="btn btn--primary btn--block" style="margin-top:14px" onclick="BuyerView.checkout()">Buat Pesanan ${UI.icon('arrowRight')}</button>
                    <button class="btn btn--ghost btn--block" style="margin-top:8px" onclick="App.go('/pembeli/katalog')">Lanjut belanja</button>
                    <p class="tiny muted" style="margin-top:12px;line-height:1.6">Stok akan dikurangi setelah pesanan dibuat. Pembeli dapat membatalkan selama status masih “Pesanan Baru”.</p>
                </div>
            </aside>
        </div>`;

        window._cartSubtotal = subtotal;
        window._cartItems = items;
    }

    function cartQty(productId, delta) {
        const user = Auth.current();
        const cart = Data.cart(user.id);
        const item = cart.find((i) => i.productId === productId);
        if (!item) return;
        const p = Data.product(productId);
        const next = item.qty + delta;
        if (next < 1) return;
        if (p && next > Number(p.stok)) { UI.toast(`Stok tersisa ${p.stok}.`, 'error'); return; }
        item.qty = next;
        Data.setCart(user.id, cart);
        App.render();
    }

    function removeItem(productId) {
        const user = Auth.current();
        Data.setCart(user.id, Data.cart(user.id).filter((i) => i.productId !== productId));
        UI.toast('Produk dihapus dari keranjang.', 'info');
        App.render();
    }

    function updateSummary() {
        const items = window._cartItems || [];
        const subtotal = window._cartSubtotal || 0;
        const method = document.getElementById('co-pengiriman');
        const ongkir = method && method.value === 'Ambil di toko' ? 0 : (Number(Data.settings().ongkir) || 0);
        const storeCount = new Set(items.map((i) => i.product.sellerId)).size;
        const totalKirim = ongkir * Math.max(storeCount, 1);
        const sumOngkir = document.getElementById('sum-ongkir');
        const sumTotal = document.getElementById('sum-total');
        if (sumOngkir) sumOngkir.textContent = UI.rupiah(totalKirim);
        if (sumTotal) sumTotal.textContent = UI.rupiah(subtotal + totalKirim);
    }

    async function checkout(event) {
        if (event) event.preventDefault();
        const user = Auth.current();
        const items = cartDetails(user);
        if (!items.length) { UI.toast('Keranjang kosong.', 'error'); return; }

        const nama = document.getElementById('co-nama').value.trim();
        const telepon = document.getElementById('co-telepon').value.trim();
        const alamat = document.getElementById('co-alamat').value.trim();
        const catatan = document.getElementById('co-catatan').value.trim();
        const pengiriman = document.getElementById('co-pengiriman').value;
        const pembayaran = document.getElementById('co-pembayaran').value;

        if (nama.length < 3) { UI.toast('Nama penerima minimal 3 karakter.', 'error'); return; }
        if (!/^[0-9+\s-]{8,20}$/.test(telepon)) { UI.toast('Nomor WhatsApp tidak valid.', 'error'); return; }
        if (alamat.length < 10) { UI.toast('Alamat terlalu singkat, mohon lengkapi.', 'error'); return; }

        for (const i of items) {
            if (Number(i.product.stok) < i.qty) {
                UI.toast(`Stok ${i.product.nama} tinggal ${i.product.stok}. Sesuaikan jumlahnya.`, 'error');
                return;
            }
        }

        const ok = await UI.confirm({
            title: 'Buat pesanan sekarang?',
            message: `${items.reduce((s, i) => s + i.qty, 0)} item dari ${new Set(items.map((i) => i.product.sellerId)).size} toko akan dipesan.`,
            confirmText: 'Ya, buat pesanan'
        });
        if (!ok) return;

        const settings = Data.settings();
        const ongkirPerStore = pengiriman === 'Ambil di toko' ? 0 : Number(settings.ongkir) || 0;
        const groups = {};
        items.forEach((i) => {
            (groups[i.product.sellerId] = groups[i.product.sellerId] || []).push(i);
        });

        const codes = [];
        Object.keys(groups).forEach((sellerId) => {
            const group = groups[sellerId];
            const product0 = group[0].product;
            const store = Data.store(product0.storeId);
            const subtotal = group.reduce((s, i) => s + i.lineTotal, 0);
            const now = new Date().toISOString();
            const order = {
                id: DB.uid('ord'),
                kode: 'AS-' + now.slice(2, 10).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000),
                buyerId: user.id,
                buyerName: nama,
                sellerId,
                storeId: store.id,
                storeName: store.nama,
                items: group.map((i) => ({
                    productId: i.product.id,
                    nama: i.product.nama,
                    harga: i.product.harga,
                    qty: i.qty,
                    imageUrl: i.product.imageUrl,
                    kategori: i.product.kategori
                })),
                subtotal,
                ongkir: ongkirPerStore,
                total: subtotal + ongkirPerStore,
                pengiriman,
                pembayaran,
                catatan,
                status: 'baru',
                alamat,
                telepon,
                createdAt: now,
                updatedAt: now,
                restocked: false,
                timeline: [{ status: 'baru', at: now, note: 'Pesanan dibuat pembeli' }]
            };
            Data.saveOrder(order);
            codes.push(order.kode);
            Data.addLog(user, 'Buat pesanan', `${order.kode} · ${store.nama} · ${UI.rupiah(order.total)}`);
        });

        items.forEach((i) => {
            const p = Data.product(i.product.id);
            if (!p) return;
            Data.updateProduct(p.id, {
                stok: Math.max(0, Number(p.stok) - i.qty),
                sold: Number(p.sold || 0) + i.qty
            });
        });

        Data.updateUser(user.id, { telepon, alamat });
        Data.clearCart(user.id);

        UI.toast(`Pesanan dibuat: ${codes.join(', ')}`);
        UI.modal({
            title: 'Pesanan berhasil dibuat 🎉',
            body: `<p class="small muted" style="line-height:1.7">Terima kasih, <strong>${UI.esc(nama)}</strong>! Pesanan Anda sudah diteruskan ke penjual. Pantau statusnya di halaman Pesanan Saya.</p>
                <div class="form-section" style="margin-top:12px"><p class="form-section__title">Kode pesanan</p>
                ${codes.map((c) => `<p class="mono bold" style="font-size:13px">${c}</p>`).join('')}</div>`,
            footer: `<button class="btn btn--primary" onclick="UI.closeModal(); App.go('/pembeli/pesanan')">Lihat pesanan saya</button>`
        });
    }

    /* ================= PESANAN ================= */
    function pesanan(root, user) {
        me = user;
        const all = Data.ordersByBuyer(user.id);
        const filter = window._buyerOrderFilter || 'semua';
        const list = filter === 'semua' ? all : all.filter((o) => o.status === filter);

        root.innerHTML = `
        <div class="stack">
            <div class="page-head">
                <div>
                    <h1 class="page-head__title">Pesanan Saya</h1>
                    <p class="page-head__sub">Lacak status pesanan, lihat rincian, atau pesan ulang produk favoritmu.</p>
                </div>
                <button class="btn btn--primary" onclick="App.go('/pembeli/katalog')">${UI.icon('plus')} Pesan lagi</button>
            </div>
            <div class="pills">
                ${[['semua', 'Semua'], ['baru', 'Baru'], ['diproses', 'Diproses'], ['dikirim', 'Dikirim'], ['selesai', 'Selesai'], ['dibatalkan', 'Dibatalkan']].map(([key, label]) => `
                    <button class="pill ${filter === key ? 'is-active' : ''}" onclick="BuyerView.filterOrders('${key}')">${label}${key === 'semua' ? ` (${all.length})` : ''}</button>`).join('')}
            </div>
            <div class="stack--sm">
                ${list.length ? list.map(orderCard).join('') : `<div class="card"><div class="card__body">${UI.empty({
                    iconName: 'receipt',
                    title: 'Belum ada pesanan',
                    desc: filter === 'semua' ? 'Pesanan yang kamu buat akan muncul di sini.' : 'Tidak ada pesanan dengan status ini.'
                })}</div></div>`}
            </div>
        </div>`;
    }

    function orderCard(o) {
        return `<article class="order-card">
            <div class="order-card__head">
                <div>
                    <p class="mono bold" style="font-size:12px">${o.kode}</p>
                    <p class="tiny muted">${UI.dateTime(o.createdAt)} · ${UI.esc(o.storeName)}</p>
                </div>
                ${UI.badge(o.status)}
            </div>
            <div class="order-card__body">
                ${o.items.map((i) => `<div class="order-line">
                    <img src="${i.imageUrl}" alt="">
                    <div style="flex:1;min-width:0"><p class="bold">${UI.esc(i.nama)}</p><p class="tiny muted">${i.qty} × ${UI.rupiah(i.harga)}</p></div>
                    <p class="bold nowrap">${UI.rupiah(i.harga * i.qty)}</p>
                </div>`).join('')}
            </div>
            <div class="order-card__foot">
                <div><span class="tiny muted">Total bayar</span> <strong style="color:var(--pink-700);font-size:14px">${UI.rupiah(o.total)}</strong></div>
                <div class="row">
                    <button class="btn btn--ghost btn--sm" onclick="Actions.viewOrder('${o.id}')">Detail</button>
                    ${o.status === 'baru' ? `<button class="btn btn--danger-soft btn--sm" onclick="Actions.cancelOrder('${o.id}')">Batalkan</button>` : ''}
                    ${o.status === 'selesai' ? `<button class="btn btn--primary btn--sm" onclick="Actions.reorder('${o.id}')">Pesan lagi</button>` : ''}
                </div>
            </div>
        </article>`;
    }

    function filterOrders(status) {
        window._buyerOrderFilter = status;
        App.render();
    }

    /* ================= PROFIL ================= */
    function profil(root, user) {
        me = user;
        const orders = Data.ordersByBuyer(user.id);
        const spent = orders.filter((o) => o.status === 'selesai').reduce((s, o) => s + o.total, 0);
        const store = null;

        root.innerHTML = `
        <div class="stack">
            <div class="profile-head">
                ${UI.avatar(user.nama, 'avatar--lg avatar--pink')}
                <div style="flex:1">
                    <h2>${UI.esc(user.nama)}</h2>
                    <p>${UI.esc(user.email)} · Bergabung ${UI.date(user.createdAt)}</p>
                </div>
                <div class="row">
                    ${UI.badge('pembeli')}
                    ${UI.badge(user.status === 'aktif' ? 'aktif' : 'nonaktif')}
                </div>
            </div>

            <div class="kpi-grid">
                <div class="kpi"><div class="kpi__ico kpi__ico--pink">${UI.icon('receipt')}</div><div><p class="kpi__label">Total pesanan</p><p class="kpi__value">${orders.length}</p></div></div>
                <div class="kpi"><div class="kpi__ico kpi__ico--green">${UI.icon('bag')}</div><div><p class="kpi__label">Belanja selesai</p><p class="kpi__value">${UI.rupiah(spent)}</p></div></div>
                <div class="kpi"><div class="kpi__ico kpi__ico--violet">${UI.icon('pin')}</div><div><p class="kpi__label">Kota</p><p class="kpi__value" style="font-size:17px">${UI.esc(user.kota || 'Belum diisi')}</p></div></div>
            </div>

            <div class="grid-2--even">
                <div class="card">
                    <div class="card__head"><h2 class="card__title">${UI.icon('users')} Data diri & alamat</h2></div>
                    <div class="card__body">
                        <form onsubmit="BuyerView.saveProfile(event)" style="display:flex;flex-direction:column;gap:12px">
                            <div class="field"><label>Nama lengkap</label><input class="input" id="pf-nama" value="${UI.esc(user.nama)}" required></div>
                            <div class="field"><label>Email</label><input class="input" value="${UI.esc(user.email)}" disabled></div>
                            <div class="form-grid">
                                <div class="field"><label>No. WhatsApp</label><input class="input" id="pf-telepon" value="${UI.esc(user.telepon || '')}" placeholder="08xxxxxxxxxx"></div>
                                <div class="field"><label>Kota</label><input class="input" id="pf-kota" value="${UI.esc(user.kota || '')}" placeholder="Bandung"></div>
                            </div>
                            <div class="field"><label>Alamat pengiriman</label><textarea class="textarea" id="pf-alamat" rows="2">${UI.esc(user.alamat || '')}</textarea></div>
                            <button class="btn btn--primary" style="align-self:flex-start">Simpan perubahan</button>
                        </form>
                    </div>
                </div>

                <div class="stack">
                    <div class="card">
                        <div class="card__head"><h2 class="card__title">${UI.icon('lock')} Ubah password</h2></div>
                        <div class="card__body">
                            <form onsubmit="BuyerView.changePassword(event)" style="display:flex;flex-direction:column;gap:12px">
                                <div class="field"><label>Password lama</label><input class="input" type="password" id="pw-old" required></div>
                                <div class="field"><label>Password baru</label><input class="input" type="password" id="pw-new" placeholder="Minimal 6 karakter" required></div>
                                <div class="field"><label>Konfirmasi password baru</label><input class="input" type="password" id="pw-confirm" required></div>
                                <button class="btn btn--dark" style="align-self:flex-start">Perbarui password</button>
                            </form>
                        </div>
                    </div>
                    <div class="card"><div class="card__body">
                        <div class="notice notice--info">${UI.icon('shield')}<div><strong>Akun demo</strong>Password awal akun pembeli demo adalah <span class="mono">pembeli123</span>.</div></div>
                    </div></div>
                </div>
            </div>
        </div>`;
    }

    function saveProfile(event) {
        event.preventDefault();
        const user = Auth.current();
        const nama = document.getElementById('pf-nama').value.trim();
        if (nama.length < 3) { UI.toast('Nama minimal 3 karakter.', 'error'); return; }
        Auth.updateProfile(user, {
            nama,
            telepon: document.getElementById('pf-telepon').value.trim(),
            kota: document.getElementById('pf-kota').value.trim(),
            alamat: document.getElementById('pf-alamat').value.trim()
        });
        UI.toast('Profil berhasil disimpan.');
        App.render();
    }

    function changePassword(event) {
        event.preventDefault();
        const user = Auth.current();
        const res = Auth.changePassword(user,
            document.getElementById('pw-old').value,
            document.getElementById('pw-new').value,
            document.getElementById('pw-confirm').value);
        if (!res.ok) { UI.toast(res.message, 'error'); return; }
        UI.toast('Password berhasil diperbarui.');
        event.target.reset();
    }

    return {
        katalog, setFilter, resetFilter, renderGrid, detail, qty, add, wa,
        keranjang, cartQty, removeItem, updateSummary, checkout,
        pesanan, filterOrders, profil, saveProfile, changePassword,
        available, cartDetails
    };
})();

Object.assign(Actions, {
    reorder(orderId) {
        const user = Auth.current();
        const order = Data.order(orderId);
        if (!order || !user) return;
        const cart = Data.cart(user.id);
        let added = 0;
        order.items.forEach((item) => {
            const p = Data.product(item.productId);
            if (!p || p.status !== 'aktif' || Number(p.stok) <= 0) return;
            const found = cart.find((c) => c.productId === p.id);
            const qty = Math.min(item.qty, Number(p.stok));
            if (found) found.qty = Math.min(Number(p.stok), found.qty + qty);
            else cart.push({ productId: p.id, qty, sellerId: p.sellerId });
            added++;
        });
        Data.setCart(user.id, cart);
        if (added) {
            UI.closeModal();
            UI.toast(`${added} produk dimasukkan ke keranjang.`);
            App.go('/pembeli/keranjang');
        } else {
            UI.toast('Produk pada pesanan ini sudah tidak tersedia.', 'error');
        }
    },

    orderWa(orderId) {
        const order = Data.order(orderId);
        if (!order) return;
        const store = Data.store(order.storeId);
        if (!store) return;
        const msg = [
            `Halo ${store.nama}, saya ingin menanyakan pesanan ${order.kode}.`,
            '',
            ...order.items.map((i) => `• ${i.nama} × ${i.qty}`),
            '',
            `Total: ${UI.rupiah(order.total)}`,
            `Status saat ini: ${order.status}`
        ].join('\n');
        window.open(`https://wa.me/${store.wa}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    }
});

window.BuyerView = BuyerView;
