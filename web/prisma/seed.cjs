// web/prisma/seed.cjs
// Seed-Script für Prisma 7 + SQLite (CommonJS)

if (typeof process.loadEnvFile === 'function') {
  // Node 22+: lädt .env aus dem Projekt-Root (hier: /web/.env)
  process.loadEnvFile();
}

const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error(
    'DATABASE_URL is not set. Please define it in web/.env (z. B. DATABASE_URL="file:./prisma/dev.db").',
  );
  process.exit(1);
}

const adapter = new PrismaBetterSqlite3({
  url: dbUrl,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🔄 Seed: lösche bestehende Demo-Daten (falls vorhanden)…');

  // Reihenfolge wegen FK-Constraints:
  await prisma.leadValue.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.formField.deleteMany();
  await prisma.form.deleteMany();
  await prisma.event.deleteMany();

  console.log('🌱 Seed: erstelle Demo-Event & Formular…');

  const event = await prisma.event.create({
    data: {
      name: 'Demo Event 2025',
      startDate: new Date('2025-01-01T09:00:00.000Z'),
      endDate: new Date('2025-01-03T18:00:00.000Z'),
      location: 'Muster-Messehalle',
    },
  });

  // WICHTIG: Form hat KEIN eventId-Feld im Schema -> KEIN eventId hier!
  const form = await prisma.form.create({
    data: {
      name: 'Standard Messe-Lead-Formular',
      description:
        'Beispiel-Formular für Tests in Admin-Web-App und Mobile-App.',
      status: 'ACTIVE', // Prisma-Enum: FormStatus.ACTIVE
      fields: {
        create: [
          {
            key: 'firstName',
            label: 'Vorname',
            type: 'TEXT', // FieldType.TEXT
            order: 1,
            required: true,
          },
          {
            key: 'lastName',
            label: 'Nachname',
            type: 'TEXT',
            order: 2,
            required: true,
          },
          {
            key: 'company',
            label: 'Firma',
            type: 'TEXT',
            order: 3,
            required: false,
          },
          {
            key: 'email',
            label: 'E-Mail',
            type: 'EMAIL',
            order: 4,
            required: false,
          },
          {
            key: 'interest',
            label: 'Interesse',
            type: 'SINGLE_SELECT',
            order: 5,
            required: false,
            options: JSON.stringify([
              'Allgemeine Informationen',
              'Produktdemo',
              'Angebot gewünscht',
              'Partnerschaft',
            ]),
          },
          {
            key: 'notes',
            label: 'Notizen',
            type: 'TEXTAREA',
            order: 6,
            required: false,
          },
        ],
      },
    },
    include: {
      fields: true,
    },
  });

  console.log('✅ Seed fertig.');
  console.log('   Event-ID:', event.id);
  console.log('   Formular-ID:', form.id);
  console.log(
    '   Felder:',
    form.fields.map((f) => `${f.order}: ${f.label} (${f.key})`).join(', '),
  );
}

main()
  .catch((err) => {
    console.error('❌ Seed error:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
