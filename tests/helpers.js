import { readFileSync } from 'node:fs';

export const repos = JSON.parse(
  readFileSync(new URL('./fixtures/github-repos.json', import.meta.url), 'utf8'),
);

// Dépôts exclus en dur dans main.js (fetchRepos).
export const EXCLUDED = ['SVM-custom1', 'skills-getting-started-with-github-copilot', 'sample-tailwind-project'];
export const shownRepos = repos.filter((r) => !EXCLUDED.includes(r.name));

export const GITHUB_API = 'https://api.github.com/users/doqa-io/repos**';

/**
 * Coupe le site de tout réseau extérieur : l'API GitHub répond avec la fixture
 * (ou la réponse fournie), Google Fonts avec une feuille vide.
 * Retourne la liste des hôtes tiers contactés par la page.
 */
export async function isolate(page, { github } = {}) {
  const thirdParty = [];
  page.on('request', (req) => {
    const host = new URL(req.url()).hostname;
    if (host !== '127.0.0.1' && host !== 'localhost') thirdParty.push(host);
  });
  await page.route(GITHUB_API, (route) =>
    github ? github(route) : route.fulfill({ json: repos }),
  );
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) =>
    route.fulfill({ status: 200, contentType: 'text/css', body: '' }),
  );
  return thirdParty;
}

export const realCards = (page) => page.locator('#project-grid .project-card:not(.skeleton-card)');

export const cardFor = (page, name) =>
  realCards(page).filter({ has: page.locator('.project-title', { hasText: new RegExp(`^${name}$`) }) });

/** Rend visibles les éléments .reveal sans animation (état « page entièrement parcourue »). */
export async function revealAll(page) {
  await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
  await page.evaluate(() => document.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible')));
}
