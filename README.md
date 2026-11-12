# doqa.io Portfolio

A responsive portfolio website built with HTML, CSS, and JavaScript to showcase open-source projects from the [doqa-io](https://github.com/doqa-io) GitHub profile, with links to their live demos hosted on [doqa.io](https://doqa.io).

## Features
- Responsive design for desktop and mobile
- Dynamic project grid that fetches repositories from the doqa-io GitHub user
- Excludes specific repositories from the featured list
- Links to both GitHub and live demo for each project
- Simple, modern UI

## Getting Started

1. **Clone this repository:**
   ```bash
   git clone https://github.com/doqa-io/doqa-io-portfolio.git
   cd doqa-io-portfolio
   ```
2. **Open `index.html` in your browser** to view the portfolio.

## Customization
- To exclude or feature specific repositories, edit the `excludedRepos` array in `main.js`.
- Update styles in `styles.css` for branding or layout changes.
- Edit `index.html` to modify sections or add new content.

## Project Structure
```
index.html        # Main HTML file
styles.css        # Stylesheet for the site
main.js           # JavaScript for dynamic content and interactivity
src/              # Images and assets
```

## License
MIT

## Tests

Suite de non-régression [Playwright](https://playwright.dev/) (Chromium, bureau et mobile) :

```bash
npm ci
npx playwright install chromium
npm test              # site servi en local, API GitHub et polices interceptées (aucun réseau)
npm run test:report   # ouvrir le rapport HTML
npm run test:live     # hors CI : vérifie les liens « Live Demo » en production
```

- `tests/portfolio.spec.js` : chargement, cartes projets, échec de l'API GitHub, thème, menu mobile, accessibilité (axe, WCAG A/AA).
- `tests/live-links.spec.js` : liens « Live Demo » de la production (tag `@live`).
- `tests/fixtures/github-repos.json` : réponse figée de l'API GitHub (12/11/2026).
- Les tests marqués `test.fail()` documentent un défaut connu (numéro du constat de recette). Quand le défaut est corrigé, la suite échoue en « passed unexpectedly » : retirer alors le `test.fail()`.

La CI (`.github/workflows/tests.yml`) lance la suite sur chaque pull request et chaque push sur `main`, et publie le rapport HTML en artefact.
