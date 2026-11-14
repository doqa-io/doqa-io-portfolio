import { readFileSync } from 'node:fs';

// Liste des projets affichés, tenue à la main à la racine du dépôt.
export const projects = JSON.parse(readFileSync(new URL('../projects.json', import.meta.url), 'utf8'));

/**
 * Coupe le site de tout réseau extérieur : l'API GitHub est bloquée (la page ne doit plus
 * l'appeler), Google Fonts répond avec une feuille vide. `projectsRoute` remplace la
 * réponse de projects.json. Retourne la liste des hôtes tiers contactés par la page.
 */
export async function isolate(page, { projectsRoute } = {}) {
  const thirdParty = [];
  page.on('request', (req) => {
    const host = new URL(req.url()).hostname;
    if (host !== '127.0.0.1' && host !== 'localhost') thirdParty.push(host);
  });
  await page.route(/^https:\/\/api\.github\.com\//, (route) => route.abort('blockedbyclient'));
  if (projectsRoute) await page.route('**/projects.json', projectsRoute);
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
