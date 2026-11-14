# doqa.io Portfolio

A responsive portfolio website built with HTML, CSS, and JavaScript to showcase open-source projects from the [doqa-io](https://github.com/doqa-io) GitHub profile, with links to their live demos hosted on [doqa.io](https://doqa.io).

## Features
- Responsive design for desktop and mobile
- Curated project grid loaded from `projects.json` (no call to the GitHub API)
- Links to GitHub, tests and live demo when available
- Simple, modern UI

## Getting Started

1. **Clone this repository:**
   ```bash
   git clone https://github.com/doqa-io/doqa-io-portfolio.git
   cd doqa-io-portfolio
   ```
2. **Open `index.html` in your browser** to view the portfolio.

## Customization
- To change the featured projects, edit `projects.json`. Each entry has `name`, `description`, `language`, `category`, `repo`, and optional `tests` and `demo` URLs. Cards are shown in file order.
- Update styles in `styles.css` for branding or layout changes.
- Edit `index.html` to modify sections or add new content.

## Project Structure
```
index.html        # Main HTML file
styles.css        # Stylesheet for the site
main.js           # JavaScript for dynamic content and interactivity
projects.json     # Featured projects, curated by hand
src/              # Images and assets
```

## License
MIT

## Tests

Suite de non-régression [Playwright](https://playwright.dev/) (Chromium, bureau et mobile) :

```bash
npm ci
npx playwright install chromium
npm test              # site servi en local, polices interceptées, API GitHub bloquée (aucun réseau)
npm run test:report   # ouvrir le rapport HTML
npm run test:live     # hors CI : vérifie les liens des cartes (GitHub, tests, démo) en production
```

- `tests/portfolio.spec.js` : validité de `projects.json`, cartes projets, échec du chargement, thème, menu mobile, accessibilité (axe, WCAG A/AA).
- `tests/live-links.spec.js` : liens des cartes en production (tag `@live`).
- Les tests marqués `test.fail()` documentent un défaut connu (numéro du constat de recette). Quand le défaut est corrigé, la suite échoue en « passed unexpectedly » : retirer alors le `test.fail()`.

La CI (`.github/workflows/tests.yml`) lance la suite sur chaque pull request et chaque push sur `main`, et publie le rapport HTML en artefact.
