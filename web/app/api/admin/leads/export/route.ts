import { prisma } from "@/lib/prisma";
import { toCsv, CsvPrimitive } from "@/lib/csv";

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const searchParams = url.searchParams;

  const formIdParam = searchParams.get("formId");
  let formIdFilter: number | undefined;

  if (formIdParam !== null) {
    const parsed = Number(formIdParam);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return new Response("Invalid formId", { status: 400 });
    }
    formIdFilter = parsed;
  }

  try {
    // Relevante Forms inkl. Fields laden (für Spaltenstruktur)
    const forms = await prisma.form.findMany({
      where: formIdFilter ? { id: formIdFilter } : {},
      include: {
        fields: true,
      },
    });

    // Relevante Leads inkl. Relationen laden
    const leads = await prisma.lead.findMany({
      where: formIdFilter ? { formId: formIdFilter } : {},
      include: {
        form: true,
        event: true,
        capturedBy: true, // <– Relation heisst capturedBy, nicht capturedByUser
        values: {
          include: {
            field: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Basis-Header
    const baseHeaders = [
      "Lead ID",           // lead.id
      "Form Name",         // lead.form.name
      "Event Name",        // lead.event?.name
      "Captured By",       // lead.capturedBy?.name
      "Captured By Email", // lead.capturedBy?.email
      "Created At",        // lead.createdAt (ISO-String)
    ];

    // Field-Definitionen aus allen relevanten Forms (unique by key)
    type FieldDef = {
      key: string;
      label: string;
    };

    const fieldMap = new Map<string, FieldDef>();

    for (const form of forms) {
      for (const field of form.fields) {
        if (!fieldMap.has(field.key)) {
          fieldMap.set(field.key, {
            key: field.key,
            label: field.label,
          });
        }
      }
    }

    const fieldDefs = Array.from(fieldMap.values()).sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
    );

    const fieldHeaders = fieldDefs.map(
      (f) => `${f.label} (${f.key})`
    );

    const headers = [...baseHeaders, ...fieldHeaders];

    const rows: CsvPrimitive[][] = [];

    for (const lead of leads) {
      // Map field.key -> value für diesen Lead
      const valueByKey: Record<string, string | null> = {};

      for (const v of lead.values) {
        const key = v.field.key;
        // Falls mehrere Werte für denselben Key existieren sollten:
        // erster Wert gewinnt, weitere ignorieren
        if (valueByKey[key] === undefined) {
          valueByKey[key] = v.value ?? "";
        }
      }

      const baseRow: CsvPrimitive[] = [
        lead.id,
        lead.form?.name ?? "",
        lead.event?.name ?? "",
        lead.capturedBy?.name ?? "",
        lead.capturedBy?.email ?? "",
        lead.createdAt.toISOString(), // ISO 8601 String, gut für Importe
      ];

      const fieldRow: CsvPrimitive[] = fieldDefs.map(
        (f) => valueByKey[f.key] ?? ""
      );

      rows.push([...baseRow, ...fieldRow]);
    }

    const csvString = toCsv(headers, rows);

    const filename = formIdFilter
      ? `leads-form-${formIdFilter}.csv`
      : "leads.csv";

    return new Response(csvString, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting leads CSV:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
