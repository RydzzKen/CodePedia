# 📚 CodePedia - Belajar Coding dari Nol

Website tutorial coding gratis dengan HTML, CSS, JavaScript, Python, dan lainnya. Cocok untuk pemula yang ingin belajar programming.

## ✨ Fitur

- 📖 Tutorial lengkap dengan code block (copy-paste)
- 💻 Playground untuk uji kode langsung
- 👑 Admin panel untuk kelola tutorial
- 📊 Dashboard user dengan progress
- 🔐 Login & Register dengan session
- 📱 Responsive di HP & Desktop

- ```STRUCTURE FOLDER
- codepedia/
├── package.json
├── package-lock.json
├── server.js
├── README.md
│
├── index.html
├── tutorials.html
├── tutorial-detail.html
├── login.html
├── register.html
├── dashboard.html
├── playground.html
├── admin.html
├── admin-tutorials.html
├── admin-add.html
│
├── css/
│   ├── style.css
│   └── responsive.css
│
├── js/
│   ├── auth.js
│   ├── main.js
│   ├── playground.js
│   └── router.js
│
├── data/
│   ├── users.json
│   ├── tutorials.json
│   ├── progress.json
│   └── activity.json
│
├── sessions/ 
│
└── node_modules/

## 🚀 Cara Install & Jalankan

```bash
# Clone repository
git clone https://github.com/RydzzKen/codepedia.git
cd codepedia

# Install dependencies
npm install

# Jalankan server
node server.js

# Buka di browser
http://localhost:8050
