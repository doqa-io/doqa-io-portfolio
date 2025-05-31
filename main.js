// main.js - Portfolio logic for doqa.io

document.addEventListener('DOMContentLoaded', () => {
    // Responsive nav menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    // Fetch and display doqa-io repos
    fetchRepos();
});

async function fetchRepos() {
    const grid = document.getElementById('project-grid');
    grid.innerHTML = '<p>Loading projects...</p>';
    // List of repo names to exclude
    const excludedRepos = [
        'SVM-custom1',
        'skills-getting-started-with-github-copilot',
        'sample-tailwind-project'
    ];
    try {
        const res = await fetch('https://api.github.com/users/doqa-io/repos?per_page=100');
        const repos = await res.json();
        grid.innerHTML = '';
        repos
            .filter(repo => !excludedRepos.includes(repo.name))
            .forEach(repo => {
                const demoUrl = `https://doqa.io/${repo.name}`;
                const card = document.createElement('div');
                card.className = 'project-card';
                card.innerHTML = `
                    <div class="project-title">${repo.name}</div>
                    <div class="project-desc">${repo.description || 'No description provided.'}</div>
                    <div class="project-links">
                        <a href="${repo.html_url}" target="_blank" rel="noopener">GitHub</a>
                        <a href="${demoUrl}" target="_blank" rel="noopener">Live Demo</a>
                    </div>
                `;
                grid.appendChild(card);
            });
        if (repos.filter(repo => !excludedRepos.includes(repo.name)).length === 0) {
            grid.innerHTML = '<p>No projects found.</p>';
        }
    } catch (e) {
        grid.innerHTML = '<p>Failed to load projects.</p>';
    }
}
