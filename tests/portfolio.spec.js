// Non-régression du portfolio doqa.io, servi en local, sans réseau.
// Les tests marqués test.fail() documentent un défaut connu (numéro du constat de recette,
// fil Buzz « Revue du portfolio doqa-io », 12/11/2026). Quand le défaut est corrigé,
// le test « passe de manière inattendue » et la suite échoue : retirer alors le test.fail().
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { isolate, realCards, cardFor, revealAll, repos, shownRepos, EXCLUDED } from './helpers.js';

const isMobile = (testInfo) => testInfo.project.name === 'mobile';
const FAILED = 'Failed to load projects. Please try again later.';

test.describe('Chargement', () => {
  test('la page se charge sans erreur de console ni exception', async ({ page }) => {
    const errors = [];
    page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
    page.on('pageerror', (err) => errors.push(err.message));
    await isolate(page);
    await page.goto('/');
    await expect(realCards(page)).toHaveCount(shownRepos.length);
    expect(errors).toEqual([]);
  });

  test("titre, h1 et année du pied de page", async ({ page }) => {
    await isolate(page);
    await page.goto('/');
    await expect(page).toHaveTitle('Portfolio - doqa.io');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Building Open-Source Tools & Demos');
    await expect(page.locator('#year')).toHaveText(String(new Date().getFullYear()));
  });

  test("constat #6 : aucune requête vers un tiers autre que l'API GitHub", async ({ page }) => {
    test.fail(true, 'Constat #6 : Google Fonts chargé depuis fonts.googleapis.com / fonts.gstatic.com');
    const thirdParty = await isolate(page);
    await page.goto('/');
    await expect(realCards(page)).toHaveCount(shownRepos.length);
    expect([...new Set(thirdParty)].filter((h) => h !== 'api.github.com')).toEqual([]);
  });
});

test.describe('Cartes projets', () => {
  test('une carte par dépôt public, hors dépôts exclus', async ({ page }) => {
    await isolate(page);
    await page.goto('/');
    await expect(realCards(page)).toHaveCount(shownRepos.length);
    await expect(page.locator('.skeleton-card')).toHaveCount(0);
    const titles = await page.locator('#project-grid .project-title').allTextContents();
    expect(titles).toEqual(shownRepos.map((r) => r.name));
    for (const name of EXCLUDED) expect(titles).not.toContain(name);
  });

  test('une carte affiche langue, description et liens corrects', async ({ page }) => {
    await isolate(page);
    await page.goto('/');
    const repo = shownRepos.find((r) => r.language && r.description);
    const card = cardFor(page, repo.name);
    await expect(card.locator('.language-badge')).toHaveText(repo.language);
    await expect(card.locator('.project-desc')).toHaveText(repo.description);
    await expect(card.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', repo.html_url);
    await expect(card.getByRole('link', { name: 'Live Demo' })).toHaveAttribute('href', `https://doqa.io/${repo.name}`);
    for (const link of await card.getByRole('link').all()) {
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', /noopener/);
    }
  });

  test('description absente : texte de remplacement', async ({ page }) => {
    const repo = shownRepos.find((r) => !r.description);
    test.skip(!repo, 'aucun dépôt sans description dans la fixture');
    await isolate(page);
    await page.goto('/');
    await expect(cardFor(page, repo.name).locator('.project-desc')).toHaveText('No description provided.');
  });

  test("le contenu des dépôts est échappé (pas d'injection HTML)", async ({ page }) => {
    const evil = [{ ...repos[0], name: 'evil', description: '<img src=x onerror="window.__xss=1">' }];
    await isolate(page, { github: (route) => route.fulfill({ json: evil }) });
    await page.goto('/');
    await expect(realCards(page)).toHaveCount(1);
    await expect(realCards(page).locator('.project-desc')).toHaveText(evil[0].description);
    await expect(realCards(page).locator('img')).toHaveCount(0);
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
  });

  test('liste vide : message « No projects found. »', async ({ page }) => {
    await isolate(page, { github: (route) => route.fulfill({ json: [] }) });
    await page.goto('/');
    await expect(page.locator('#project-grid')).toHaveText('No projects found.');
  });
});

test.describe('API GitHub en échec', () => {
  test("quota dépassé (403) : message d'échec affiché", async ({ page }) => {
    await isolate(page, {
      github: (route) => route.fulfill({ status: 403, json: { message: 'API rate limit exceeded' } }),
    });
    await page.goto('/');
    await expect(page.locator('#project-grid')).toHaveText(FAILED);
  });

  test("réseau coupé : message d'échec affiché", async ({ page }) => {
    await isolate(page, { github: (route) => route.abort('internetdisconnected') });
    await page.goto('/');
    await expect(page.locator('#project-grid')).toHaveText(FAILED);
  });

  test("constat #4 : les projets restent visibles sans l'API GitHub", async ({ page }) => {
    test.fail(true, "Constat #4 : aucun repli statique, la section dépend entièrement de l'API GitHub");
    await isolate(page, { github: (route) => route.abort('internetdisconnected') });
    await page.goto('/');
    await expect(realCards(page).first()).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Thème', () => {
  test('le thème sombre est conservé après rechargement', async ({ page }) => {
    await isolate(page);
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    const html = page.locator('html');
    const toggle = page.getByRole('button', { name: 'Toggle dark mode' });
    await expect(html).not.toHaveAttribute('data-theme', 'dark');
    await toggle.click();
    await expect(html).toHaveAttribute('data-theme', 'dark');
    await expect(toggle).toHaveText('☀️');
    await page.reload();
    await expect(html).toHaveAttribute('data-theme', 'dark');
    await expect(toggle).toHaveText('☀️');
    await toggle.click();
    await expect(html).toHaveAttribute('data-theme', 'light');
    await page.reload();
    await expect(html).not.toHaveAttribute('data-theme', 'dark');
  });

  test('préférence système sombre appliquée au premier chargement', async ({ page }) => {
    await isolate(page);
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('constat #7 : le bouton de thème expose son état (aria-pressed)', async ({ page }) => {
    test.fail(true, "Constat #7 : pas d'aria-pressed sur le bouton de thème");
    await isolate(page);
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Toggle dark mode' });
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true', { timeout: 2000 });
  });
});

test.describe('Navigation', () => {
  test('bureau : liens de navigation visibles, bouton menu masqué', async ({ page }, testInfo) => {
    test.skip(isMobile(testInfo), 'bureau uniquement');
    await isolate(page);
    await page.goto('/');
    await expect(page.locator('.nav-links')).toBeVisible();
    await expect(page.locator('.menu-toggle')).toBeHidden();
  });

  test("mobile : le menu s'ouvre, puis se ferme au clic sur un lien", async ({ page }, testInfo) => {
    test.skip(!isMobile(testInfo), 'mobile uniquement');
    await isolate(page);
    await page.goto('/');
    const menu = page.locator('.nav-links');
    await expect(menu).toBeHidden();
    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(menu).toBeVisible();
    await menu.getByRole('link', { name: 'About' }).click();
    await expect(menu).toBeHidden();
    await expect(page).toHaveURL(/#about$/);
  });

  test('mobile : constat #7 : le bouton menu expose aria-expanded et aria-controls', async ({ page }, testInfo) => {
    test.skip(!isMobile(testInfo), 'mobile uniquement');
    test.fail(true, 'Constat #7 : ni aria-expanded ni aria-controls sur .menu-toggle');
    await isolate(page);
    await page.goto('/');
    const toggle = page.locator('.menu-toggle');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false', { timeout: 2000 });
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true', { timeout: 2000 });
    await expect(toggle).toHaveAttribute('aria-controls', /.+/, { timeout: 2000 });
  });

  test('mobile : constat #7 : la touche Échap referme le menu', async ({ page }, testInfo) => {
    test.skip(!isMobile(testInfo), 'mobile uniquement');
    test.fail(true, 'Constat #7 : Échap ne referme pas le menu');
    await isolate(page);
    await page.goto('/');
    await page.locator('.menu-toggle').click();
    await expect(page.locator('.nav-links')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.nav-links')).toBeHidden({ timeout: 2000 });
  });

  test("mobile : constat #10 : le titre de section reste visible sous l'en-tête après un clic sur une ancre", async ({ page }, testInfo) => {
    test.skip(!isMobile(testInfo), 'mobile uniquement');
    test.fail(true, "Constat #10 : pas de scroll-margin-top, l'en-tête fixe masque le titre");
    await isolate(page);
    await page.goto('/');
    await page.getByRole('link', { name: 'View Projects ↓' }).click();
    await expect(page).toHaveURL(/#projects$/);
    await page.waitForTimeout(1000); // fin du défilement doux
    const navBottom = await page.locator('.navbar').evaluate((el) => el.getBoundingClientRect().bottom);
    const titleTop = await page.locator('#projects h2').evaluate((el) => el.getBoundingClientRect().top);
    expect(titleTop).toBeGreaterThanOrEqual(navBottom);
  });
});

test.describe('Accessibilité', () => {
  const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
  const SCHEMES = { light: 'clair', dark: 'sombre' };

  const scan = async (page, scheme) => {
    await page.emulateMedia({ colorScheme: scheme });
    await isolate(page);
    await page.goto('/');
    await expect(realCards(page)).toHaveCount(shownRepos.length);
    await revealAll(page);
    return new AxeBuilder({ page }).withTags(WCAG);
  };

  for (const [scheme, label] of Object.entries(SCHEMES)) {
    test(`axe WCAG A/AA hors contraste : aucune violation (thème ${label})`, async ({ page }) => {
      const { violations } = await (await scan(page, scheme)).disableRules(['color-contrast']).analyze();
      expect(violations.map((v) => `${v.id} (${v.nodes.length})`)).toEqual([]);
    });

    test(`constat #8 : contraste des couleurs conforme AA (thème ${label})`, async ({ page }) => {
      test.fail(true, 'Constat #8 : liens des cartes et sous-titre du bandeau sous 4,5:1');
      const { violations } = await (await scan(page, scheme)).withRules(['color-contrast']).analyze();
      expect(violations.flatMap((v) => v.nodes.map((n) => n.target.join(' ')))).toEqual([]);
    });
  }

  test("constat #9 : contenu visible sans défilement si l'utilisateur réduit les animations", async ({ page }) => {
    test.fail(true, "Constat #9 : .reveal à opacity 0 tant qu'on ne fait pas défiler, pas de prefers-reduced-motion");
    await isolate(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator('#about p')).toHaveCSS('opacity', '1', { timeout: 2000 });
  });

  test('les images ont un texte alternatif', async ({ page }) => {
    await isolate(page);
    await page.goto('/');
    for (const img of await page.locator('img').all()) {
      await expect(img).toHaveAttribute('alt', /\S/);
    }
  });
});
