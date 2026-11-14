// main.js - Portfolio logic for doqa.io

// Language colors (GitHub convention)
const LANG_COLORS = {
    JavaScript: '#f1e05a',
    TypeScript: '#3178c6',
    Python: '#3572A5',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Java: '#b07219',
    'C++': '#f34b7d',
    C: '#555555',
    Shell: '#89e051',
    Go: '#00ADD8',
    Rust: '#dea584',
    Ruby: '#701516',
    PHP: '#4F5D95',
    Jupyter: '#DA5B0B',
    'Jupyter Notebook': '#DA5B0B',
};

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
    // ── Mobile nav toggle (smooth) ──
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
    // Close mobile menu when a link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => navLinks.classList.remove('active'));
    });

    // ── Dark mode toggle ──
    const themeToggle = document.querySelector('.theme-toggle');
    const themeIcon = themeToggle.querySelector('.theme-icon');
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeIcon.textContent = '☀️';
    }
    themeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
        themeIcon.textContent = isDark ? '🌙' : '☀️';
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
    });

    // ── Dynamic footer year ──
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // ── Active nav highlighting on scroll ──
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('[data-nav]');
    const navObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navItems.forEach(a => a.classList.remove('active'));
                const active = document.querySelector(`[data-nav][href="#${entry.target.id}"]`);
                if (active) active.classList.add('active');
            }
        });
    }, { threshold: 0.35 });
    sections.forEach(sec => navObserver.observe(sec));

    // ── Scroll reveal animations ──
    const reveals = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    reveals.forEach(el => revealObserver.observe(el));

    // ── Fetch and display repos ──
    fetchRepos();
});

// Projects are curated by hand in projects.json (same origin, no third-party API).
async function fetchRepos() {
    const grid = document.getElementById('project-grid');
    try {
        const res = await fetch('projects.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const projects = await res.json();
        grid.innerHTML = '';

        if (!Array.isArray(projects) || projects.length === 0) {
            grid.innerHTML = '<p>No projects found.</p>';
            return;
        }

        projects.forEach((project, i) => {
            const lang = project.language || '';
            const langColor = LANG_COLORS[lang] || '#888';
            const links = [
                ['GitHub', project.repo],
                ['Tests', project.tests],
                ['Live Demo', project.demo],
            ].filter(([, url]) => url)
                .map(([label, url]) => `<a href="${escapeHTML(url)}" target="_blank" rel="noopener">${label}</a>`)
                .join('\n                    ');
            const card = document.createElement('div');
            card.className = 'project-card reveal';
            card.style.transitionDelay = `${i * 0.07}s`;
            card.innerHTML = `
                <div class="project-header">
                    <div class="project-title">${escapeHTML(project.name)}</div>
                    ${lang ? `<span class="language-badge"><span class="language-dot" style="background:${langColor}"></span>${escapeHTML(lang)}</span>` : ''}
                </div>
                <div class="project-desc">${escapeHTML(project.description || 'No description provided.')}</div>
                ${project.category ? `<div class="project-meta"><span class="meta-item">${escapeHTML(project.category)}</span></div>` : ''}
                <div class="project-links">
                    ${links}
                </div>
            `;
            grid.appendChild(card);
        });

        // Observe newly added cards for reveal animation
        const revealObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        grid.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    } catch (e) {
        grid.innerHTML = '<p>Failed to load projects. Please try again later.</p>';
    }
}
