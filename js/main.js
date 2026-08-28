// Ambil data dari API
async function loadTutorials() {
    try {
        const response = await fetch('/api/tutorials');
        const data = await response.json();
        console.log('Tutorials:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}

loadTutorials();

// Mobile menu
document.addEventListener('DOMContentLoaded', () => {
    // Tambahin mobile menu kalo butuh
});
