# Mohamed Aiman’s Developer Portfolio

Personal portfolio website for Mohamed Aiman (Darkguyaiman), a full-stack developer based in Malaysia.

**[Visit the live portfolio → darkguyaiman.com](https://darkguyaiman.com/)**

The site brings together my web development projects, experience, skills, and contact information. Featured work includes **Tuitix**, a tuition management system, and **Rosterly**, a scheduling and time management system.

## Technology

- TypeScript and Node.js with Express for the backend.
- Eta templates for server-rendered pages.
- MySQL for portfolio content.
- HTML, CSS, and JavaScript for the frontend.

## Explore the project

### November 2026 portfolio additions

The portfolio includes NEEM Stack Setup, WhatsAppSharp, the MUST T-Shirt Design Viewer, and the Tuition Management System demo, plus all 10 certificates listed on [LinkedIn](https://www.linkedin.com/in/darkguyaiman/details/certifications/) as of 14 November 2026.

For an **existing database**, run `npm run db:update-portfolio` with the usual `DB_*` environment configuration, then build and restart the app. This applies the portfolio additions and screenshot/order migrations in `database/migrations/0002_add_certifications_and_projects.sql` and `0003_rank_projects_and_add_screenshots.sql` and is safe to rerun. It preserves existing projects, descriptions, and screenshots while applying the requested showcase order. `database/schema.sql` also includes the additions for fresh installations; do not import that file over an existing database.

Certificate titles, issuers, issue dates, and available credential IDs were transcribed from LinkedIn. Sololearn links directly to its public credential; the other entries link to their certificate attachment on LinkedIn and may require sign-in. Project information was verified against the supplied repositories and demo sites. The T-shirt and tuition source repositories are private, so the public portfolio links to their deployed sites only. WhatsAppSharp and the tuition system are explicitly labelled as testing demos; the tuition credentials are shown only on its detail page.

Technology icons are defined in `utils/technologies.js`. The vendor build derives its icon subset from that same map and rejects missing glyphs, keeping project cards and project detail pages consistent. The Specialities section retains its original 15 entries and markup.

- `server.ts`: Express application entry point.
- `routes/`, `controllers/`, and `models/`: request handling and data access.
- `views/`: public website and admin templates.
- `public/`: frontend assets.
- `example.env`: environment configuration reference.

Browse the source here, or see the finished website and project case studies at **[darkguyaiman.com](https://darkguyaiman.com/)**.

<div align="center">
  <a href="https://github.com/Darkguyaiman/Darkguyaiman">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Darkguyaiman/Darkguyaiman/main/dark_mode.svg?v=30736296871">
      <img alt="Mohamed Aiman's GitHub Profile README" src="https://raw.githubusercontent.com/Darkguyaiman/Darkguyaiman/main/light_mode.svg?v=30736296871">
    </picture>
  </a>

  <br /><br />

  <a href="https://ko-fi.com/darkguyaiman" target="_blank">
    <img src="https://img.shields.io/badge/Ko--fi-FF5E5B?style=for-the-badge&logo=ko-fi&logoColor=white" alt="Ko-fi" />
  </a>
  &nbsp;&nbsp;
  <a href="https://paypal.me/thedarkguyaiman" target="_blank">
    <img src="https://img.shields.io/badge/Donate%20via%20PayPal-003087?style=for-the-badge&logo=paypal&logoColor=white" alt="PayPal" />
  </a>

  ☕ If my projects or tools have helped you, consider supporting my work
</div>

### Ai-man Groq keys

Configure the chat assistant in `.env` with `GROQ_API_KEY` and as many fallback keys as you need:

```dotenv
GROQ_API_KEY=your-first-groq-api-key
GROQ_API_KEY_2=your-second-groq-api-key
GROQ_API_KEY_3=your-third-groq-api-key
```

Numbered keys are tried in numeric order; numbering gaps are allowed and there is no key-count limit. You can also use a comma-separated `GROQ_API_KEYS` list. Blank entries are ignored and duplicate keys are tried only once.

For each chat request, Ai-man tries the next key if Groq returns an error (including rate limits), the connection fails, the request exceeds 15 seconds, or the response is unusable. It stops at the first usable reply and shows the sleepy message only when all configured keys fail. The existing per-visitor message limit still applies. Restart the server after updating `.env`.

### Project screenshots and showcase order

Tuition Management, WhatsAppSharp, and NEEM lead the showcase, followed by the pharmacy ERP, logistics analytics dashboard, and other work. The homepage features the first three entries. Screenshots include the tuition dashboard and schedule, WhatsAppSharp’s public sign-in page, the T-shirt viewer’s front/back views, and three genuine NEEM terminal captures from the creator’s LinkedIn post. No messages or demonstration records were created for the screenshots.

WhatsAppSharp gallery images use lossless WebP from the original local launch screenshots with fictional demo conversations. Project icons keep their brand hover colours when visible; black marks, PowerShell, and Bash use the red hover fallback in dark mode; other coloured brands retain their originals. EJS retains its lettermark and orange hover colour.
