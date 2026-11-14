// @live : interroge la PRODUCTION (GitHub et https://doqa.io). Hors CI : `npm run test:live`.
// Vérifie que chaque lien de projects.json mène à une vraie page :
// ni erreur HTTP, ni redirection vers la connexion YunoHost.
import { test, expect } from '@playwright/test';
import { projects } from './helpers.js';

const links = projects.flatMap((p) =>
  ['repo', 'tests', 'demo'].filter((key) => p[key]).map((key) => ({ name: p.name, key, url: p[key] })),
);

test.describe('@live liens des cartes projets en production', () => {
  for (const { name, key, url } of links) {
    test(`@live ${name} (${key})`, async ({ request }) => {
      const res = await request.get(url, { maxRedirects: 10, timeout: 45_000 });
      expect(res.status(), `statut HTTP de ${res.url()}`).toBeLessThan(400);
      expect(res.url(), 'redirection vers la connexion YunoHost').not.toContain('/yunohost/sso');
    });
  }
});
