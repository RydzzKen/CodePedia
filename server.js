const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const app = express();
const PORT = 8050;

// ===== MIDDLEWARE =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

// ===== SESSION =====
app.use(session({
    store: new FileStore({
        path: './sessions',
        ttl: 86400 // 1 hari
    }),
    secret: 'codepedia-secret-key-2026',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// ===== FUNGSI BACA/TULIS FILE =====
const USERS_FILE = path.join(__dirname, 'data/users.json');
const TUTORIALS_FILE = path.join(__dirname, 'data/tutorials.json'); // ✅ DITAMBAHKAN
const PROGRESS_FILE = path.join(__dirname, 'data/progress.json');
const ACTIVITY_FILE = path.join(__dirname, 'data/activity.json');

function readJSON(filePath, defaultData = []) {
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
            return defaultData;
        }
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return defaultData;
    }
}

function writeJSON(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error);
        return false;
    }
}

function getUsers() { return readJSON(USERS_FILE, []); }
function getTutorials() { return readJSON(TUTORIALS_FILE, []); }
function getProgress() { return readJSON(PROGRESS_FILE, []); }
function getActivity() { return readJSON(ACTIVITY_FILE, []); }

function saveUsers(users) { return writeJSON(USERS_FILE, users); }
function saveProgress(progress) { return writeJSON(PROGRESS_FILE, progress); }
function saveActivity(activity) { return writeJSON(ACTIVITY_FILE, activity); }

// ===== MIDDLEWARE: CEK ADMIN =====
function isAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Akses ditolak. Admin only.' });
    }
}

// ============================================
// API: TUTORIALS (CRUD - ADMIN ONLY)
// ============================================

// GET semua tutorial (public)
app.get('/api/tutorials', (req, res) => {
    res.json(getTutorials());
});

// GET detail tutorial by ID (public)
app.get('/api/tutorials/:id', (req, res) => {
    const tutorials = getTutorials();
    const id = parseInt(req.params.id);
    const tutorial = tutorials.find(t => t.id === id);
    if (tutorial) {
        res.json(tutorial);
    } else {
        res.status(404).json({ message: 'Tutorial tidak ditemukan' });
    }
});

// POST tambah tutorial (ADMIN ONLY)
app.post('/api/admin/tutorials', isAdmin, (req, res) => {
    const { title, description, category, level, duration, content } = req.body;
    
    if (!title || !description || !category) {
        return res.status(400).json({ success: false, message: 'Data tidak lengkap' });
    }
    
    const tutorials = getTutorials();
    const newTutorial = {
        id: tutorials.length > 0 ? Math.max(...tutorials.map(t => t.id)) + 1 : 1,
        title: title.trim(),
        description: description.trim(),
        category,
        level: level || 'Pemula',
        duration: parseInt(duration) || 15,
        slug: title.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, ''),
        content: content || 'Konten sedang dalam pengembangan.',
        createdAt: new Date().toISOString()
    };
    
    tutorials.push(newTutorial);
    if (writeJSON(TUTORIALS_FILE, tutorials)) {
        res.json({ success: true, message: 'Tutorial berhasil ditambahkan!', data: newTutorial });
    } else {
        res.status(500).json({ success: false, message: 'Gagal menyimpan data' });
    }
});

// PUT edit tutorial (ADMIN ONLY)
app.put('/api/admin/tutorials/:id', isAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    const { title, description, category, level, duration, content } = req.body;
    const tutorials = getTutorials();
    const index = tutorials.findIndex(t => t.id === id);
    
    if (index === -1) {
        return res.status(404).json({ success: false, message: 'Tutorial tidak ditemukan' });
    }
    
    tutorials[index] = {
        ...tutorials[index],
        title: title || tutorials[index].title,
        description: description || tutorials[index].description,
        category: category || tutorials[index].category,
        level: level || tutorials[index].level,
        duration: parseInt(duration) || tutorials[index].duration,
        content: content || tutorials[index].content,
        updatedAt: new Date().toISOString()
    };
    
    if (writeJSON(TUTORIALS_FILE, tutorials)) {
        res.json({ success: true, message: 'Tutorial berhasil diperbarui!', data: tutorials[index] });
    } else {
        res.status(500).json({ success: false, message: 'Gagal menyimpan data' });
    }
});

// DELETE hapus tutorial (ADMIN ONLY)
app.delete('/api/admin/tutorials/:id', isAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    const tutorials = getTutorials();
    const filtered = tutorials.filter(t => t.id !== id);
    
    if (filtered.length === tutorials.length) {
        return res.status(404).json({ success: false, message: 'Tutorial tidak ditemukan' });
    }
    
    if (writeJSON(TUTORIALS_FILE, filtered)) {
        res.json({ success: true, message: 'Tutorial berhasil dihapus!' });
    } else {
        res.status(500).json({ success: false, message: 'Gagal menyimpan data' });
    }
});

// ============================================
// API: PROGRESS
// ============================================

// GET progress user
app.get('/api/progress/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const progress = getProgress().filter(p => p.userId === userId);
    res.json(progress);
});

// POST tandai selesai
app.post('/api/progress/complete', (req, res) => {
    const { userId, tutorialId } = req.body;
    if (!userId || !tutorialId) {
        return res.status(400).json({ success: false, message: 'Data tidak lengkap' });
    }
    
    let progress = getProgress();
    const existing = progress.find(p => p.userId === userId && p.tutorialId === tutorialId);
    
    if (existing) {
        existing.completed = true;
        existing.completedAt = new Date().toISOString();
    } else {
        progress.push({
            userId: userId,
            tutorialId: tutorialId,
            completed: true,
            completedAt: new Date().toISOString(),
            saved: false
        });
    }
    
    if (saveProgress(progress)) {
        addActivity(userId, `✅ Menyelesaikan tutorial ID ${tutorialId}`);
        res.json({ success: true, message: 'Tutorial ditandai selesai!' });
    } else {
        res.status(500).json({ success: false, message: 'Gagal menyimpan progress' });
    }
});

// POST simpan tutorial
app.post('/api/progress/save', (req, res) => {
    const { userId, tutorialId } = req.body;
    if (!userId || !tutorialId) {
        return res.status(400).json({ success: false, message: 'Data tidak lengkap' });
    }
    
    let progress = getProgress();
    const existing = progress.find(p => p.userId === userId && p.tutorialId === tutorialId);
    
    if (existing) {
        existing.saved = true;
        existing.savedAt = new Date().toISOString();
    } else {
        progress.push({
            userId: userId,
            tutorialId: tutorialId,
            completed: false,
            saved: true,
            savedAt: new Date().toISOString()
        });
    }
    
    if (saveProgress(progress)) {
        addActivity(userId, `💾 Menyimpan tutorial ID ${tutorialId}`);
        res.json({ success: true, message: 'Tutorial disimpan!' });
    } else {
        res.status(500).json({ success: false, message: 'Gagal menyimpan' });
    }
});

// ============================================
// API: ACTIVITY
// ============================================

// GET aktivitas user
app.get('/api/activity/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const activities = getActivity()
        .filter(a => a.userId === userId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);
    res.json(activities);
});

// Tambah aktivitas
function addActivity(userId, action) {
    const activity = getActivity();
    activity.push({
        userId: userId,
        action: action,
        timestamp: new Date().toISOString()
    });
    const filtered = activity.filter(a => a.userId === userId).slice(-50);
    const other = activity.filter(a => a.userId !== userId);
    saveActivity([...other, ...filtered]);
}

// ============================================
// API: AUTH
// ============================================

app.post('/api/register', (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 6) {
        return res.status(400).json({ 
            success: false, 
            message: 'Data tidak lengkap atau password terlalu pendek' 
        });
    }
    
    const users = getUsers();
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ success: false, message: 'Email sudah terdaftar!' });
    }
    
    const newUser = {
        id: users.length + 1,
        name, 
        email, 
        password,
        role: 'user', // ✅ Default user, bukan admin
        createdAt: new Date().toISOString()
    };
    users.push(newUser);
    
    if (saveUsers(users)) {
        addActivity(newUser.id, `📝 Mendaftar akun`);
        res.json({ success: true, message: 'Pendaftaran berhasil!' });
    } else {
        res.status(500).json({ success: false, message: 'Gagal menyimpan user' });
    }
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role || 'user' // ✅ Simpan role di session
        };
        addActivity(user.id, `🔐 Login`);
        res.json({ 
            success: true, 
            message: 'Login berhasil!', 
            user: req.session.user 
        });
    } else {
        res.status(401).json({ success: false, message: 'Email atau password salah!' });
    }
});

app.post('/api/logout', (req, res) => {
    if (req.session.user) {
        addActivity(req.session.user.id, `🔓 Logout`);
    }
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, message: 'Logout berhasil!' });
    });
});

app.get('/api/me', (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});

// ============================================
// ROUTING SPA
// ============================================

app.get('*path', (req, res) => {
    // File statis
    if (req.path.match(/\.(css|js|json|png|jpg|jpeg|gif|svg|ico|webp|ttf|woff|woff2|eot)$/)) {
        return;
    }
    
    // Halaman HTML
    const htmlPages = [
        '/tutorials.html', 
        '/login.html', 
        '/register.html', 
        '/dashboard.html', 
        '/playground.html', 
        '/tutorial-detail.html',
        '/admin.html',          // ✅ Tambahan
        '/admin-tutorials.html', // ✅ Tambahan
        '/admin-add.html'       // ✅ Tambahan
    ];
    
    if (htmlPages.includes(req.path)) {
        const filePath = path.join(__dirname, req.path);
        if (fs.existsSync(filePath)) {
            return res.sendFile(filePath);
        }
    }
    
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ============================================
// JALANKAN SERVER
// ============================================

app.listen(PORT, () => {
    console.log(`✅ Server berjalan di http://localhost:${PORT}`);
    console.log(`🔐 Login: admin@codepedia.com / admin123`);
    console.log(`📚 Tutorial: http://localhost:${PORT}/tutorials.html`);
    console.log(`👑 Admin: http://localhost:${PORT}/admin.html`);
});