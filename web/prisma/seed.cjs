/* eslint-disable @typescript-eslint/no-require-imports */

// prisma/seed.cjs
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with example form...');

  // Bestehende Daten für lokale Entwicklung leeren
  await prisma.leadValue.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.formField.deleteMany();
  await prisma.form.deleteMany();

  // Einfaches Beispiel-Formular mit drei Feldern
  const form = await prisma.form.create({
    data: {
      name: 'Beispiel-Formular',
      description: 'Seed-Formular für lokale Entwicklung',
      status: 'DRAFT',
      fields: {
        create: [
          {
            key: 'firstName',
            label: 'Vorname',
            type: 'TEXT',
            required: true,
            order: 1,
          },
          {
            key: 'lastName',
            label: 'Nachname',
            type: 'TEXT',
            required: true,
            order: 2,
          },
          {
            key: 'email',
            label: 'E-Mail',
            type: 'TEXT',
            required: false,
            order: 3,
          },
        ],
      },
    },
  });

  console.log(`Seed finished. Created form with id ${form.id}`);
}

main()
  .catch((e) => {
    console.error('Seed error', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
