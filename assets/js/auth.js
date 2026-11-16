/**
 * auth.js — sesi, login, registrasi pembeli/penjual, dan guard peran.
 */
const Auth = (() => {
    const SESSION_KEY = 'session';

    const session = () => DB.get(SESSION_KEY, null);

    function current() {
        const s = session();
        if (!s || !s.userId) return null;
        const user = Data.user(s.userId);
        if (!user) { clear(); return null; }
        return user;
    }

    function saveSession(user) {
        DB.set(SESSION_KEY, { userId: user.id, role: user.role, at: new Date().toISOString() });
    }

    function clear() {
        DB.set(SESSION_KEY, null);
    }

    function login(email, password) {
        const user = Data.userByEmail(String(email || '').trim());
        if (!user) return { ok: false, message: 'Email belum terdaftar. Periksa kembali atau daftar akun baru.' };
        if (user.passwordHash !== Data.hashPassword(password)) return { ok: false, message: 'Password salah. Silakan coba lagi.' };
        if (user.status === 'nonaktif') return { ok: false, message: 'Akun Anda dinonaktifkan. Hubungi admin platform untuk bantuan.' };
        if (user.status === 'pending') return { ok: false, message: 'Akun Anda masih menunggu verifikasi admin.' };
        saveSession(user);
        return { ok: true, user };
    }

    function register(form) {
        const nama = String(form.nama || '').trim();
        const email = String(form.email || '').trim().toLowerCase();
        const password = String(form.password || '');
        const role = form.role === 'seller' ? 'seller' : 'pembeli';

        if (nama.length < 3) return { ok: false, message: 'Nama lengkap minimal 3 karakter.' };
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, message: 'Format email tidak valid.' };
        if (password.length < 6) return { ok: false, message: 'Password minimal 6 karakter.' };
        if (Data.userByEmail(email)) return { ok: false, message: 'Email sudah digunakan. Silakan masuk atau gunakan email lain.' };
        if (role === 'seller' && String(form.storeName || '').trim().length < 3) {
            return { ok: false, message: 'Nama toko minimal 3 karakter.' };
        }

        const user = {
            id: DB.uid('usr'),
            nama,
            email,
            role,
            passwordHash: Data.hashPassword(password),
            telepon: String(form.telepon || '').trim(),
            kota: String(form.kota || '').trim(),
            alamat: String(form.alamat || '').trim(),
            status: 'aktif',
            createdAt: new Date().toISOString()
        };
        Data.saveUser(user);

        if (role === 'seller') {
            Data.saveStore({
                id: DB.uid('str'),
                ownerId: user.id,
                nama: String(form.storeName || '').trim(),
                deskripsi: '',
                wa: String(form.telepon || '').replace(/^0/, '62'),
                kota: user.kota,
                alamat: user.alamat,
                status: 'pending',
                buka: true,
                rating: 0,
                createdAt: new Date().toISOString()
            });
            Data.addLog(user, 'Daftar penjual', `Toko "${String(form.storeName || '').trim()}" menunggu verifikasi admin.`);
        } else {
            Data.addLog(user, 'Daftar pembeli', `Akun pembeli baru: ${nama}.`);
        }

        saveSession(user);
        return { ok: true, user };
    }

    function updateProfile(user, patch) {
        const next = Data.updateUser(user.id, patch);

        if (next.role === 'seller') {
            const store = Data.storeByOwner(next.id);
            if (store) {
                Data.updateStore(store.id, {
                    kota: next.kota || store.kota,
                    alamat: next.alamat || store.alamat,
                    wa: (patch.storeWa || store.wa),
                    nama: patch.storeName || store.nama,
                    deskripsi: patch.storeDesc != null ? patch.storeDesc : store.deskripsi
                });
            }
        }
        return next;
    }

    function changePassword(user, oldPw, newPw, confirmPw) {
        if (user.passwordHash !== Data.hashPassword(oldPw)) return { ok: false, message: 'Password lama tidak sesuai.' };
        if (String(newPw).length < 6) return { ok: false, message: 'Password baru minimal 6 karakter.' };
        if (newPw !== confirmPw) return { ok: false, message: 'Konfirmasi password tidak sama.' };
        Data.updateUser(user.id, { passwordHash: Data.hashPassword(newPw) });
        return { ok: true };
    }

    function logout() {
        clear();
        sessionStorage.removeItem('arasweet.flash');
    }

    return { session, current, saveSession, login, register, updateProfile, changePassword, logout, clear };
})();
