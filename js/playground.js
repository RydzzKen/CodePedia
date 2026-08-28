/**
 * ========================================
 * PLAYGROUND.JS - Code Editor Interaktif
 * ========================================
 */

// ============================================
// 1. KONFIGURASI
// ============================================
const CONFIG = {
    STORAGE_KEY: 'playground_code',
    TEMPLATE_KEY: 'playground_template',
    AUTO_SAVE_DELAY: 500,
    DEFAULT_CODE: `<!-- Tulis kode HTML, CSS, atau JavaScript di sini -->

<h1>Halo, CodePedia! 🚀</h1>
<p>Selamat mencoba playground ini</p>

<style>
  h1 { 
    color: #2563eb; 
    text-align: center;
    margin-top: 20px;
  }
  p { 
    font-size: 18px; 
    text-align: center;
    color: #475569;
  }
</style>

<script>
  console.log('Hello from CodePedia Playground!');
<\/script>`
};

// ============================================
// 2. TEMPLATE
// ============================================
const TEMPLATES = {
    blank: `<!-- Tulis kode di sini -->`,
    hello: `<h1 style="color: #2563eb; text-align: center; margin-top: 40px; font-size: 48px;">
  Hello, World! 🌍
</h1>
<p style="text-align: center; font-size: 20px; color: #475569;">
  Selamat datang di CodePedia Playground
</p>`,
    button: `<button id="myBtn" style="padding: 14px 32px; background: #2563eb; color: white; border: none; border-radius: 8px; font-size: 18px; cursor: pointer;">
  Klik Aku!
</button>
<p id="message" style="margin-top: 20px; text-align: center; font-size: 18px; color: #475569;"></p>

<script>
  let count = 0;
  document.getElementById('myBtn').addEventListener('click', function() {
    count++;
    document.getElementById('message').textContent = '✨ Diklik ' + count + ' kali!';
  });
<\/script>`,
    card: `<div style="max-width: 340px; margin: 30px auto; padding: 32px 24px; border-radius: 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.12); text-align: center; background: white;">
  <div style="font-size: 56px;">🚀</div>
  <h3 style="margin: 12px 0 6px;">Kartu Keren</h3>
  <p style="color: #64748b;">Card sederhana dengan efek hover</p>
</div>`,
    todo: `<div style="max-width: 400px; margin: 20px auto; padding: 24px; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
  <h2 style="text-align: center;">📋 To-Do List</h2>
  <div style="display: flex; gap: 8px; margin-bottom: 16px;">
    <input id="todoInput" type="text" placeholder="Tambah tugas..." style="flex: 1; padding: 10px 16px; border: 2px solid #e2e8f0; border-radius: 8px;">
    <button id="addTodo" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer;">Tambah</button>
  </div>
  <ul id="todoList" style="list-style: none; padding: 0;"></ul>
</div>

<script>
  const input = document.getElementById('todoInput');
  const list = document.getElementById('todoList');
  document.getElementById('addTodo').addEventListener('click', function() {
    const text = input.value.trim();
    if (!text) return;
    const li = document.createElement('li');
    li.style.cssText = 'display: flex; justify-content: space-between; padding: 8px 12px; margin-bottom: 4px; background: #f8fafc; border-radius: 6px;';
    li.innerHTML = \`<span>\${text}</span><button onclick="this.parentElement.remove()" style="background: #ef4444; color: white; border: none; border-radius: 4px; padding: 2px 8px; cursor: pointer;">Hapus</button>\`;
    list.appendChild(li);
    input.value = '';
  });
  input.addEventListener('keypress', (e) => e.key === 'Enter' && document.getElementById('addTodo').click());
<\/script>`
};

// ============================================
// 3. STATE
// ============================================
let editor = null;
let output = null;
let autoSaveTimer = null;

// ============================================
// 4. FUNGSI UTAMA
// ============================================

function initPlayground() {
    editor = document.getElementById('codeEditor');
    output = document.getElementById('outputFrame');
    
    if (!editor || !output) {
        console.error('❌ Elemen playground tidak ditemukan!');
        return;
    }
    
    loadSavedCode();
    setupEventListeners();
    runCode();
    console.log('✅ Playground siap!');
}

function setupEventListeners() {
    // Auto-run & auto-save
    editor.addEventListener('input', () => {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(() => {
            saveCode();
            runCode();
        }, CONFIG.AUTO_SAVE_DELAY);
    });
    
    // Tab = 2 spasi
    editor.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = editor.selectionStart;
            const end = editor.selectionEnd;
            editor.value = editor.value.substring(0, start) + '  ' + editor.value.substring(end);
            editor.selectionStart = editor.selectionEnd = start + 2;
        }
    });
    
    // Template
    document.getElementById('templateSelect')?.addEventListener('change', function() {
        loadTemplate(this.value);
    });
    
    // Clear (Fix: benar-benar hapus kode)
    document.getElementById('clearBtn')?.addEventListener('click', function() {
        if (confirm('Yakin mau menghapus semua kode?')) {
            editor.value = ''; // Kosongkan
            saveCode();
            runCode();
            updateStatus('🗑️ Dihapus', '#ef4444');
        }
    });
    
    // Download (Fix: download source code)
    document.getElementById('downloadBtn')?.addEventListener('click', downloadSourceCode);
    
    // Fullscreen
    document.getElementById('fullscreenBtn')?.addEventListener('click', toggleFullscreen);
    document.getElementById('closeFullscreenBtn')?.addEventListener('click', exitFullscreen);
}

function loadSavedCode() {
    const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
    const savedTemplate = localStorage.getItem(CONFIG.TEMPLATE_KEY);
    
    if (saved && saved.trim() !== '') {
        editor.value = saved;
        if (savedTemplate) {
            const select = document.getElementById('templateSelect');
            if (select) select.value = savedTemplate;
        }
    } else {
        editor.value = CONFIG.DEFAULT_CODE;
    }
}

function saveCode() {
    if (editor) {
        localStorage.setItem(CONFIG.STORAGE_KEY, editor.value);
        const select = document.getElementById('templateSelect');
        if (select) localStorage.setItem(CONFIG.TEMPLATE_KEY, select.value);
    }
}

function loadTemplate(templateName) {
    if (TEMPLATES[templateName] !== undefined) {
        editor.value = TEMPLATES[templateName];
        saveCode();
        runCode();
        updateStatus('✅ Template dimuat', '#16a34a');
    }
}

function runCode() {
    if (!editor || !output) return;
    
    const code = editor.value;
    const iframe = output;
    
    try {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: system-ui, sans-serif; margin: 16px; padding: 0; background: white; color: #0f172a; }
                    * { box-sizing: border-box; }
                </style>
            </head>
            <body>
                ${code}
            </body>
            </html>
        `);
        doc.close();
        updateStatus('✅ Running', '#16a34a');
    } catch (error) {
        console.error('Error:', error);
        const doc = output.contentDocument || output.contentWindow.document;
        doc.open();
        doc.write(`
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family: monospace; padding: 20px; color: #dc2626; background: #fef2f2;">
                <h3>❌ Error</h3>
                <pre style="background: #fee2e2; padding: 12px; border-radius: 8px; overflow: auto;">${error.message}</pre>
            </body>
            </html>
        `);
        doc.close();
        updateStatus('❌ Error', '#dc2626');
    }
}

// ============================================
// 5. CLEAR (Fix)
// ============================================
function clearCode() {
    if (confirm('Yakin mau menghapus semua kode?')) {
        editor.value = '';
        saveCode();
        runCode();
        updateStatus('🗑️ Dihapus', '#ef4444');
    }
}

// ============================================
// 6. DOWNLOAD SOURCE CODE (Fix)
// ============================================
function downloadSourceCode() {
    const code = editor.value;
    if (!code.trim()) {
        alert('Tidak ada kode untuk di-download!');
        return;
    }
    
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `playground-source-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    updateStatus('⬇️ Download berhasil', '#16a34a');
}

// ============================================
// 7. FULLSCREEN (Dengan Tombol X)
// ============================================
function toggleFullscreen() {
    const container = document.getElementById('playgroundContainer');
    const closeBtn = document.getElementById('closeFullscreenBtn');
    const btn = document.getElementById('fullscreenBtn');
    
    if (!container) return;
    
    if (container.classList.contains('fullscreen')) {
        exitFullscreen();
    } else {
        container.classList.add('fullscreen');
        document.body.style.overflow = 'hidden';
        closeBtn.classList.add('visible');
        if (btn) btn.textContent = '⛶ Keluar';
    }
    setTimeout(runCode, 200);
}

function exitFullscreen() {
    const container = document.getElementById('playgroundContainer');
    const closeBtn = document.getElementById('closeFullscreenBtn');
    const btn = document.getElementById('fullscreenBtn');
    
    if (!container) return;
    
    container.classList.remove('fullscreen');
    document.body.style.overflow = '';
    closeBtn.classList.remove('visible');
    if (btn) btn.textContent = '⛶ Fullscreen';
    setTimeout(runCode, 200);
}

// ============================================
// 8. STATUS INDICATOR
// ============================================
function updateStatus(text, color = '#64748b') {
    const indicator = document.getElementById('statusIndicator');
    if (indicator) {
        indicator.textContent = text;
        indicator.style.color = color;
        setTimeout(() => {
            indicator.textContent = '💾 Auto-save';
            indicator.style.color = '#64748b';
        }, 2000);
    }
}

// ============================================
// 9. EXPOSE KE GLOBAL
// ============================================
window.initPlayground = initPlayground;
window.runCode = runCode;
window.clearCode = clearCode;
window.downloadSourceCode = downloadSourceCode;
window.toggleFullscreen = toggleFullscreen;
window.exitFullscreen = exitFullscreen;
window.loadTemplate = loadTemplate;

// ============================================
// 10. AUTO INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initPlayground, 100);
});

console.log('📦 playground.js loaded!');