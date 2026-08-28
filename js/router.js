/**
 * ========================================
 * ROUTER.JS - Navigasi Single Page Application
 * ========================================
 * Fungsi:
 * 1. Handle navigasi tanpa refresh halaman
 * 2. Load konten dinamis
 * 3. History API (back/forward)
 * 4. Route protection
 */

// ============================================
// 1. KONFIGURASI ROUTE
// ============================================
const ROUTES = {
    '/': {
        title: 'CodePedia - Belajar Coding',
        template: 'pages/home.html',
        protected: false
    },
    '/tutorials': {
        title: 'Semua Tutorial - CodePedia',
        template: 'pages/tutorials.html',
        protected: false
    },
    '/tutorial/:id': {
        title: 'Detail Tutorial - CodePedia',
        template: 'pages/tutorial-detail.html',
        protected: false
    },
    '/playground': {
        title: 'Playground - CodePedia',
        template: 'pages/playground.html',
        protected: false
    },
    '/dashboard': {
        title: 'Dashboard - CodePedia',
        template: 'pages/dashboard.html',
        protected: true
    },
    '/login': {
        title: 'Login - CodePedia',
        template: 'pages/login.html',
        protected: false,
        redirectIfLoggedIn: true
    },
    '/register': {
        title: 'Daftar - CodePedia',
        template: 'pages/register.html',
        protected: false,
        redirectIfLoggedIn: true
    }
};

// ============================================
// 2. VARIABEL GLOBAL
// ============================================
let currentRoute = window.location.pathname;
let isLoading = false;

// ============================================
// 3. FUNGSI UTAMA
// ============================================

/**
 * Navigasi ke route tertentu
 * @param {string} path - Path tujuan (contoh: '/tutorials')
 * @param {boolean} pushState - Tambahkan ke history (default: true)
 */
function navigateTo(path, pushState = true) {
    // Normalize path
    path = path || '/';
    if (!path.startsWith('/')) path = '/' + path;
    
    // Cek apakah route ada di konfigurasi
    let route = findMatchingRoute(path);
    
    if (!route) {
        // Route tidak ditemukan, redirect ke 404
        show404();
        return;
    }
    
    // Cek proteksi route
    if (route.protected && !isUserLoggedIn()) {
        localStorage.setItem('redirect_after_login', path);
        navigateTo('/login');
        return;
    }
    
    // Redirect jika sudah login (untuk login/register)
    if (route.redirectIfLoggedIn && isUserLoggedIn()) {
        navigateTo('/dashboard');
        return;
    }
    
    // Update URL
    if (pushState) {
        window.history.pushState({ path }, '', path);
    }
    
    // Load konten
    loadContent(route, path);
    
    // Update active link di navbar
    updateActiveLink(path);
    
    // Update current route
    currentRoute = path;
}

/**
 * Mencari route yang cocok (termasuk dynamic route seperti /tutorial/:id)
 * @param {string} path - Path yang dicari
 * @returns {Object|null} - Route config atau null
 */
function findMatchingRoute(path) {
    // Cek exact match
    if (ROUTES[path]) {
        return ROUTES[path];
    }
    
    // Cek dynamic route (contoh: /tutorial/1 → /tutorial/:id)
    for (const [routePath, config] of Object.entries(ROUTES)) {
        if (routePath.includes(':')) {
            // Ubah pattern route menjadi regex
            const pattern = routePath.replace(/:[^\s/]+/g, '([^/]+)');
            const regex = new RegExp(`^${pattern}$`);
            if (regex.test(path)) {
                // Extract params
                const paramNames = routePath.match(/:[^\s/]+/g) || [];
                const values = path.match(regex) || [];
                const params = {};
                paramNames.forEach((name, index) => {
                    params[name.substring(1)] = values[index + 1];
                });
                return { ...config, params };
            }
        }
    }
    
    return null;
}

/**
 * Load konten dari template
 * @param {Object} route - Konfigurasi route
 * @param {string} path - Path saat ini
 */
async function loadContent(route, path) {
    if (isLoading) return;
    isLoading = true;
    
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;
    
    try {
        // Tampilkan loading
        mainContent.innerHTML = `
            <div class="text-center" style="padding: 60px 20px;">
                <div style="font-size: 40px; margin-bottom: 16px;">⏳</div>
                <h3>Memuat konten...</h3>
            </div>
        `;
        
        // Update title
        document.title = route.title || 'CodePedia';
        
        // Load template (jika ada)
        if (route.template) {
            const response = await fetch(route.template);
            if (response.ok) {
                let html = await response.text();
                
                // Inject params ke HTML (jika ada)
                if (route.params) {
                    for (const [key, value] of Object.entries(route.params)) {
                        html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
                    }
                }
                
                mainContent.innerHTML = html;
            } else {
                show404(mainContent);
            }
        } else {
            // Jika tidak ada template, gunakan default
            mainContent.innerHTML = `
                <div class="container" style="padding: 40px 0;">
                    <h1>${route.title || 'Halaman'}</h1>
                    <p>Konten sedang dalam pengembangan.</p>
                </div>
            `;
        }
        
        // Execute script tags di dalam content
        executeScripts(mainContent);
        
        // Trigger event setelah konten dimuat
        window.dispatchEvent(new CustomEvent('contentLoaded', { 
            detail: { path, route } 
        }));
        
    } catch (error) {
        console.error('Error loading content:', error);
        mainContent.innerHTML = `
            <div class="container" style="padding: 40px 0;">
                <div class="card" style="text-align: center; padding: 40px;">
                    <h2 style="color: #ef4444;">❌ Gagal Memuat Konten</h2>
                    <p class="text-muted">${error.message}</p>
                    <button class="btn-primary mt-20" onclick="location.reload()">Muat Ulang</button>
                </div>
            </div>
        `;
    }
    
    isLoading = false;
}

/**
 * Execute script tags yang baru dimuat
 * @param {HTMLElement} container - Container yang berisi konten baru
 */
function executeScripts(container) {
    const scripts = container.querySelectorAll('script');
    scripts.forEach(oldScript => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
        });
        newScript.textContent = oldScript.textContent;
        oldScript.parentNode.replaceChild(newScript, oldScript);
    });
}

/**
 * Tampilkan halaman 404
 * @param {HTMLElement} container - Container untuk menampilkan 404
 */
function show404(container) {
    const target = container || document.getElementById('mainContent');
    if (!target) return;
    
    target.innerHTML = `
        <div class="container" style="padding: 60px 0; text-align: center;">
            <div style="font-size: 80px;">🔍</div>
            <h1 style="font-size: 48px; margin: 16px 0;">404</h1>
            <h2>Halaman Tidak Ditemukan</h2>
            <p class="text-muted" style="margin: 12px 0 24px;">Maaf, halaman yang Anda cari tidak tersedia.</p>
            <a href="/" class="btn-primary">Kembali ke Home</a>
        </div>
    `;
}

/**
 * Update active link di navbar
 * @param {string} path - Path saat ini
 */
function updateActiveLink(path) {
    const navLinks = document.querySelectorAll('#navMenu a:not(.btn-nav)');
    navLinks.forEach(link => {
        const href = link.getAttribute('href') || '';
        const isActive = href === path || (path.startsWith(href) && href !== '/');
        link.classList.toggle('active', isActive);
    });
}

// ============================================
// 4. EVENT LISTENER
// ============================================

// Handle popstate (back/forward browser)
window.addEventListener('popstate', (event) => {
    const path = event.state?.path || window.location.pathname;
    navigateTo(path, false);
});

// Handle klik link di dalam aplikasi
document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;
    
    const href = link.getAttribute('href');
    if (!href) return;
    
    // Skip jika link eksternal atau file statis
    if (href.startsWith('http') || href.startsWith('#') || href.includes('.')) return;
    
    e.preventDefault();
    navigateTo(href);
});

// ============================================
// 5. INISIALISASI ROUTER
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Ambil path saat ini
    const path = window.location.pathname;
    navigateTo(path, false);
});

// ============================================
// 6. EXPORT (untuk penggunaan di file lain)
// ============================================
// Jika menggunakan module, uncomment:
// export {
//     navigateTo,
//     findMatchingRoute,
//     ROUTES,
//     currentRoute
// };
