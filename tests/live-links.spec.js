// @live : interroge la PRODUCTION (https://doqa.io). Hors CI : `npm run test:live`.
// Vérifie que chaque lien « Live Demo » construit par main.js mène à une vraie page :
// ni erreur HTTP, ni redirection vers la connexion YunoHost.
import { test, expect } from '@playwright/test';
import { shownRepos } from './helpers.js';

const KNOWN = {
  'pricing-plan-design': 'Constat #1 : la démo renvoie 404',
  'Event-Flyer-Page': 'Constat #2 : la démo redirige vers la connexion YunoHost',
};

test.describe('@live liens « Live Demo » en production', () => {
  for (const { name } of shownRepos) {
    test(`@live ${name}`, async ({ request }) => {
      if (KNOWN[name]) test.fail(true, KNOWN[name]);
      const res = await request.get(`https://doqa.io/${encodeURIComponent(name)}`, { maxRedirects: 10, timeout: 45_000 });
      expect(res.status(), `statut HTTP de ${res.url()}`).toBeLessThan(400);
      expect(res.url(), 'redirection vers la connexion YunoHost').not.toContain('/yunohost/sso');
    });
  }
});
