# LeadRadar2025f – Teilprojekt 3.1: Mobile-Kernflows – Review & Konsolidierung

## 1. Ziel & Scope

**Ziel von Teilprojekt 3.1:**

- Die Mobile-Kernflows für LeadRadar konzeptionell sauber festhalten.
- Einen klaren End-to-End-Flow dokumentieren:
  - Admin erstellt Formular → Mobile lädt Formular → Lead wird erfasst → Lead erscheint im Admin → Export/E-Mail funktionieren.
- UX- und Technik-Lücken identifizieren und als konkrete TODOs für zukünftige 3.x-Teilprojekte festhalten.
- Stand nach 3.1 in `docs/PROJECT_OVERVIEW.md` ergänzen.

**Wichtiger Hinweis zum Status:**

- Im Repo `leadradar2025f` existiert aktuell noch kein `/mobile`-Ordner.
- Teilprojekt 3.1 definiert daher die **Zielstruktur**, den **API-Contract** und die **Flows**, an denen sich die spätere Mobile-Implementierung orientieren soll.
- Eine tatsächliche Mobile-Codebasis wird in weiteren Teilprojekten (3.2 ff.) aufgebaut oder angebunden.

---

## 2. Mobile-Architektur & Navigation (Zielbild)

### 2.1 Basis

- **Framework:** Expo / React Native
- **Sprache:** TypeScript
- **Geplanter Einstiegspunkt:** `mobile/App.tsx`
  - Initialisiert `NavigationContainer`.
  - Rendert `AppTabs` als Hauptnavigation.

### 2.2 Geplante Ordnerstruktur

```text
mobile/
  App.tsx
  src/
    navigation/
      AppTabs.tsx
    screens/
      EventsScreen.tsx
      FormsScreen.tsx
      LeadCaptureScreen.tsx
      SettingsScreen.tsx
    api/
      client.ts
    types/
      api.ts
