
---

### `docs/teilprojekt-1.2-datenmodell-prisma-schema.md`

```md
# LeadRadar2025f – Teilprojekt 1.2: Datenmodell & Prisma-Schema (Forms & Leads)

## 1. Ziel des Teilprojekts

In diesem Teilprojekt wurde das Kern-Datenmodell für LeadRadar definiert und in Prisma abgebildet.  
Ziel ist ein **pragmatisches, aber erweiterbares** Modell für:

- Formulare (Admin-konfigurierbar)
- Formularfelder
- Leads (erfasste Kontakte)
- Lead-Werte (Feldwerte je Lead)
- optional: Events (Messen), an denen Leads erfasst werden

Das Modell dient als stabile Grundlage für:

- den späteren Formbuilder im Admin,
- die Lead-Erfassung (Web & Mobile),
- Auswertungen und Exporte.

---

## 2. Models & Beziehungen (Domainmodell)

### 2.1 Übersicht

**Entitäten:**

- `Form`
- `FormField`
- `Lead`
- `LeadValue`
- `Event` (optional, bereits modelliert)
- `User` (minimal, aus Teilprojekt 1.1, um Relation zu Leads ergänzt)

### 2.2 Beziehungen (Text/UML-artig)

```text
Event 1 --- * Lead
Form  1 --- * FormField
Form  1 --- * Lead
Lead  1 --- * LeadValue
FormField 1 --- * LeadValue

User 1 --- * Lead (über capturedByUserId)
