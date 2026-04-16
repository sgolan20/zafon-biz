/**
 * Converts a Firestore JSON dump (as returned by the Firebase MCP
 * firestore_list_documents tool, which uses the REST API shape where each
 * field is an object like { stringValue: "..." } / { timestampValue: "..." }
 * / { arrayValue: { values: [...] } }) into a flat UTF-8 BOM CSV.
 *
 * Used once to hand-export the full businesses collection without needing
 * ADC on the local machine — the MCP tool authenticated via firebase-tools
 * and saved its oversized response to disk, and this just reshapes it.
 *
 *   npx tsx scripts/convert-firestore-dump-to-csv.ts <input.json> <output.csv>
 */

import { readFileSync, writeFileSync } from "node:fs";

function unwrap(field: unknown): unknown {
  if (field === null || field === undefined) return "";
  if (typeof field !== "object") return field;
  const f = field as Record<string, unknown>;
  if ("stringValue" in f) return f.stringValue;
  if ("integerValue" in f) return f.integerValue;
  if ("doubleValue" in f) return f.doubleValue;
  if ("booleanValue" in f) return f.booleanValue;
  if ("timestampValue" in f) return f.timestampValue;
  if ("nullValue" in f) return "";
  if ("arrayValue" in f) {
    const values = (f.arrayValue as { values?: unknown[] })?.values ?? [];
    return values.map(unwrap);
  }
  if ("mapValue" in f) {
    const fields = (f.mapValue as { fields?: Record<string, unknown> })?.fields ?? {};
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(fields)) out[k] = unwrap(v);
    return out;
  }
  return "";
}

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  let s: string;
  if (Array.isArray(v)) s = v.join("; ");
  else if (typeof v === "object") s = JSON.stringify(v);
  else s = String(v);
  s = s.replace(/\r?\n/g, " ").trim();
  if (s.includes(",") || s.includes('"') || s.includes(";")) {
    s = `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function main() {
  const [, , inputPath, outputPath] = process.argv;
  if (!inputPath || !outputPath) {
    console.error("usage: npx tsx scripts/convert-firestore-dump-to-csv.ts <input.json> <output.csv>");
    process.exit(1);
  }

  const raw = readFileSync(inputPath, "utf8");
  const parsed = JSON.parse(raw) as { documents: Array<{ name: string; fields?: Record<string, unknown> }> };
  const docs = parsed.documents ?? [];
  console.log(`→ parsing ${docs.length} documents`);

  const rows = docs.map((doc) => {
    const id = doc.name.split("/").pop() ?? "";
    const fields = doc.fields ?? {};
    const out: Record<string, unknown> = { id };
    for (const [key, value] of Object.entries(fields)) {
      out[key] = unwrap(value);
    }
    return out;
  });

  const columns = [
    "id",
    "status",
    "name",
    "slug",
    "category",
    "subCategory",
    "tags",
    "town",
    "region",
    "address",
    "contactName",
    "phone",
    "whatsapp",
    "email",
    "website",
    "facebook",
    "instagram",
    "openingHours",
    "shortDescription",
    "description",
    "createdAt",
    "approvedAt",
    "approvedBy",
    "shuffleSeed",
  ];

  const header = columns.join(",");
  const body = rows
    .map((r) => columns.map((c) => csvEscape(r[c])).join(","))
    .join("\n");

  const BOM = "\uFEFF";
  writeFileSync(outputPath, BOM + header + "\n" + body, "utf8");

  const byStatus = rows.reduce<Record<string, number>>((acc, r) => {
    const s = String(r.status ?? "unknown");
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`✓ wrote ${outputPath} (${rows.length} rows)`);
  for (const [s, n] of Object.entries(byStatus)) console.log(`  ${s}: ${n}`);
}

main();
