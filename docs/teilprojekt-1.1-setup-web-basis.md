# LeadRadar – Teilprojekt 1.1: Projekt-Setup & Web-Basis

**Datum:** 29.11.2025  
**Status:** Abgeschlossen (technische Basis steht, Git eingerichtet)

---

## 1. Ziel dieses Teilprojekts

- Technische Grundlage für das LeadRadar-Webprojekt schaffen.
- Next.js (App Router, TypeScript, ESLint) im Unterordner `web` initialisieren.
- Tailwind CSS v4 integrieren.
- Erste Admin-Struktur unter `/admin` aufbauen.
- Prisma 7 + SQLite initial einrichten (Schema, Config, Migration).
- Git-Setup definiert (zentrales Repo im Projekt-Root).
- Dokumentationsbasis erstellen.

Dieses Teilprojekt bietet das **Skelett** für spätere Features wie Formbuilder, Events, Leads und Mobile-App-Anbindung.

---

## 2. Projektstruktur (Stand nach Teilprojekt 1.1)

```text
C:\dev\leadradar2025f
├─ web
│  ├─ app
│  │  ├─ layout.tsx
│  │  ├─ page.tsx
│  │  ├─ globals.css
│  │  └─ (admin)
│  │     └─ admin
│  │        ├─ layout.tsx
│  │        └─ page.tsx
│  ├─ lib
│  │  └─ prisma.ts
│  ├─ prisma
│  │  ├─ schema.prisma
│  │  ├─ migrations/
│  │  └─ dev.db
│  ├─ public
│  │  └─ leadradar-logo.png
│  ├─ postcss.config.mjs
│  ├─ prisma.config.ts
│  ├─ package.json
│  └─ ...
├─ docs
│  ├─ PROJECT_OVERVIEW.md
│  └─ teilprojekt-1.1-setup-web-basis.md
└─ .gitignore
