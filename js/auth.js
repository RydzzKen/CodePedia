/**
 * AUTH.JS - Manajemen Autentikasi via Backend Session
 */

// ============================================
// 1. FUNGSI UTAMA
// ============================================

async function checkAuthStatus() {
    try {
        const response = await fetch('/api/me', {
            cache: 'no-cache', // Tambahkan ini
            headers: { 'Cache-Control': 'no-cache' }
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error checking auth:', error);
        return { loggedIn: false, user: null };
    }
}

async function loginUser(email, password) {
    console.log('🟢 loginUser dipanggil:', { email, password: '***' });
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            },
            body: JSON.stringify({ email, password })
        });
        
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
            // Paksa update UI
            await updateAuthUI();
        }
        
        return data;
    } catch (error) {
        console.error('Login error:', error);
        return { 
            success: false, 
            message: 'Terjadi kesalahan koneksi ke server.' 
        };
    }
}

async function registerUser(name, email, password) {
    console.log('🟢 registerUser dipanggil:', { name, email, password: '***' });
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        console.log('Register response:', data);
        return data;
    } catch (error) {
        console.error('Register error:', error);
        return { 
            success: false, 
            message: 'Terjadi kesalahan koneksi ke server.' 
        };
    }
}

async function logoutUser() {
    try {
        const response = await fetch('/api/logout', { 
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        const data = await response.json();
        if (data.success) {
            // Paksa update UI
            await updateAuthUI();
            window.location.href = '/login.html';
        }
        return data;
    } catch (error) {
        console.error('Logout error:', error);
        return { success: false };
    }
}

// ============================================
// 2. UPDATE NAVBAR (Lebih Agresif)
// ============================================

async function updateAuthUI() {
    console.log('🔄 UpdateAuthUI dipanggil');
    
    const status = await checkAuthStatus();
    const isLoggedIn = status.loggedIn;
    const user = status.user;
    
    console.log('Status login:', isLoggedIn, user);
    
    // Cari semua elemen navbar di halaman
    const navMenus = document.querySelectorAll('#navMenu, .nav-menu, nav ul');
    
    navMenus.forEach(navMenu => {
        if (!navMenu) return;
        
        // Cari link Login, Register, Dashboard
        let loginLink = navMenu.querySelector('a[href="/login.html"], a[href="login.html"]');
        let registerLink = navMenu.querySelector('a[href="/register.html"], a[href="register.html"]');
        let dashboardLink = navMenu.querySelector('a[href="/dashboard.html"], a[href="dashboard.html"]');
        
        // Jika tidak ditemukan, cari berdasarkan teks
        if (!loginLink) {
            const allLinks = navMenu.querySelectorAll('a');
            allLinks.forEach(link => {
                if (link.textContent.trim() === 'Login' && !loginLink) {
                    loginLink = link;
                }
                if (link.textContent.trim() === 'Daftar' && !registerLink) {
                    registerLink = link;
                }
                if (link.textContent.trim() === 'Dashboard' && !dashboardLink) {
                    dashboardLink = link;
                }
            });
        }
        
        console.log('Found links:', { loginLink, registerLink, dashboardLink });
        
        if (isLoggedIn && user) {
            // Ubah Login jadi Logout
            if (loginLink) {
                loginLink.textContent = `👤 ${user.name || 'User'}`;
                loginLink.href = '#';
                loginLink.className = 'btn-nav btn-logout';
                loginLink.style.background = '#ef4444';
                loginLink.style.color = 'white';
                loginLink.onclick = (e) => {
                    e.preventDefault();
                    logoutUser();
                };
            }
            
            // Sembunyikan Register
            if (registerLink) {
                registerLink.style.display = 'none';
            }
            
            // Tampilkan Dashboard
            if (dashboardLink) {
                dashboardLink.style.display = 'block';
            }
            
        } else {
            // Tampilkan Login
            if (loginLink) {
                loginLink.textContent = 'Login';
                loginLink.href = '/login.html';
                loginLink.className = 'btn-nav';
                loginLink.style.background = '';
                loginLink.style.color = '';
                loginLink.onclick = null;
            }
            
            // Tampilkan Register
            if (registerLink) {
                registerLink.style.display = 'block';
            }
            
            // Sembunyikan Dashboard
            if (dashboardLink) {
                dashboardLink.style.display = 'none';
            }
        }
    });
}

async function requireAuth(redirectUrl = '/login.html') {
    const status = await checkAuthStatus();
    if (!status.loggedIn) {
        window.location.href = redirectUrl;
        return false;
    }
    return true;
}

// ============================================
// 3. AUTO INIT SAAT DOM READY DAN SETIAP NAVIGASI
// ============================================

function initAuth() {
    const protectedPages = ['/dashboard.html'];
    const currentPage = window.location.pathname;
    
    if (protectedPages.includes(currentPage)) {
        requireAuth();
    }
    
    // Selalu update UI
    updateAuthUI();
}

// Jalankan saat DOM siap
document.addEventListener('DOMContentLoaded', initAuth);

// Jalankan ulang setiap kali ada perubahan URL (SPA)
if (window.history && window.history.pushState) {
    const originalPushState = history.pushState;
    history.pushState = function() {
        originalPushState.apply(this, arguments);
        setTimeout(initAuth, 200);
    };
    
    window.addEventListener('popstate', () => {
        setTimeout(initAuth, 200);
    });
}

// ============================================
// 4. EXPOSE KE GLOBAL
// ============================================
window.loginUser = loginUser;
window.registerUser = registerUser;
window.logoutUser = logoutUser;
window.checkAuthStatus = checkAuthStatus;
window.updateAuthUI = updateAuthUI;
window.requireAuth = requireAuth;
window.initAuth = initAuth;

console.log('📦 auth.js loaded!');