# guruITA.github.io

Personal portfolio of Gurpreet Singh — Software Engineering student and full-stack developer.

Live at [guruita.github.io](https://guruita.github.io).

## Stack

- React 19 + TypeScript
- Vite
- Sass modules

## Development

```bash
npm install
npm run dev
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local dev server |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build locally |

## Design

The design source of truth is the [guruITA Portfolio Website Design](https://www.figma.com/design/xJHJqFXaANKFvDOKB21CZC/guruITA-Portfolio-Website-Design) Figma file, which includes a token-based design system (colors, spacing, radius, typography) and a reusable component library (Button, Tag, Badge, Nav Link, Input, Project Card, Skill Card).

## Contact form

The contact form posts to an external form endpoint configured via `VITE_CONTACT_FORM_ENDPOINT` — see `.env.example`. For the live site, set it as a repository variable (Settings → Secrets and variables → Actions → Variables).

## Deployment

Every push to `main` runs `.github/workflows/deploy.yml`: it lints, builds with Vite and publishes `dist/` to GitHub Pages.
