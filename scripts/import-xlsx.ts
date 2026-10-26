// Imports the "Horas Investidas na Vida" spreadsheet: pnpm db:import <file.xlsx> [--include-future]
import { config } from "dotenv";
import { and, count, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import ExcelJS from "exceljs";
import { categories, entries, routines } from "../src/db/schema";
import { todayISO } from "../src/lib/dates";
import { CATEGORY_COLORS } from "../src/lib/format";

config({ path: [".env.local", ".env"] });

const FIXED_CATEGORIES = ["trabalho clt"];
const WEEKDAY_COLUMNS = [
  { header: "Seg - Sex", days: [1, 2, 3, 4, 5] },
  { header: "Sábado", days: [6] },
  { header: "Domingo", days: [0] },
];

type Cell = ExcelJS.CellValue;

function text(value: Cell): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object" && "result" in value) return text(value.result as Cell);
  if (typeof value === "object" && "richText" in value) return value.richText.map((part) => part.text).join("");
  return String(value).trim();
}

function num(value: Cell): number {
  if (typeof value === "object" && value && "result" in value) return num(value.result as Cell);
  return Number(value);
}

function isoDate(value: Cell): string | null {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object" && value && "result" in value) return isoDate(value.result as Cell);
  return null;
}

function rowsOf(sheet: ExcelJS.Worksheet) {
  const rows: Cell[][] = [];
  sheet.eachRow((row) => rows.push((row.values as Cell[]).slice(1)));
  return rows;
}

async function main() {
  const file = process.argv[2];
  const includeFuture = process.argv.includes("--include-future");
  if (!file) throw new Error("Uso: pnpm db:import <arquivo.xlsx> [--include-future]");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada");

  const db = drizzle(process.env.DATABASE_URL);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(file);
  const today = todayISO();

  const categoryIds = new Map<string, string>();
  async function ensureCategory(name: string, description: string | null = null) {
    const key = name.toLowerCase();
    if (categoryIds.has(key)) return categoryIds.get(key)!;
    const [existing] = await db.select().from(categories).where(eq(categories.name, name));
    const id =
      existing?.id ??
      (
        await db
          .insert(categories)
          .values({ name, description, color: CATEGORY_COLORS[categoryIds.size % CATEGORY_COLORS.length], isFixed: FIXED_CATEGORIES.includes(key) })
          .returning()
      )[0].id;
    categoryIds.set(key, id);
    return id;
  }

  const categorySheet = workbook.getWorksheet("Categorias");
  if (categorySheet) {
    for (const [name, description] of rowsOf(categorySheet).slice(1)) {
      if (text(name)) await ensureCategory(text(name), text(description) || null);
    }
  }
  console.log(`Categorias: ${categoryIds.size}`);

  let created = 0;
  let skipped = 0;
  let future = 0;
  const seenInFile = new Map<string, number>();
  const entrySheet = workbook.getWorksheet("Registro de Horas");
  if (entrySheet) {
    for (const [dateCell, activityCell, categoryCell, hoursCell, notesCell] of rowsOf(entrySheet).slice(1)) {
      const date = isoDate(dateCell);
      const activity = text(activityCell);
      const hours = num(hoursCell);
      if (!date || !activity || !text(categoryCell) || !(hours > 0)) continue;
      if (!includeFuture && date > today) {
        future += 1;
        continue;
      }
      const categoryId = await ensureCategory(text(categoryCell));
      // Identical rows can be legitimate (two sessions), so compare counts instead of existence.
      const key = `${date}|${activity}|${categoryId}|${hours}`;
      seenInFile.set(key, (seenInFile.get(key) ?? 0) + 1);
      const [{ value: inDb }] = await db
        .select({ value: count() })
        .from(entries)
        .where(and(eq(entries.date, date), eq(entries.activity, activity), eq(entries.categoryId, categoryId), eq(entries.hours, hours)));
      if (inDb >= seenInFile.get(key)!) {
        skipped += 1;
        continue;
      }
      await db.insert(entries).values({ date, activity, categoryId, hours, notes: text(notesCell) || null });
      created += 1;
    }
  }
  console.log(`Registros: ${created} importados, ${skipped} já existiam, ${future} futuros ignorados${future ? " (use --include-future)" : ""}`);

  const routineSheet = workbook.getWorksheet("Rotinas Recorrentes");
  if (routineSheet) {
    const rows = rowsOf(routineSheet);
    const headerIndex = rows.findIndex((row) => row.some((cell) => text(cell) === "Horas / Dia"));
    if (headerIndex >= 0) {
      const header = rows[headerIndex].map(text);
      const col = (name: string) => header.indexOf(name);
      let count = 0;
      for (const row of rows.slice(headerIndex + 1)) {
        const activity = text(row[col("Atividade")]);
        const categoryName = text(row[col("Tag / Categoria")]);
        const hours = num(row[col("Horas / Dia")]);
        if (!activity || !categoryName || !(hours > 0)) continue;
        const weekdays = WEEKDAY_COLUMNS.filter((c) => row[col(c.header)] === true).flatMap((c) => c.days);
        const categoryId = await ensureCategory(categoryName);
        const [existing] = await db.select({ id: routines.id }).from(routines).where(eq(routines.activity, activity));
        if (existing) continue;
        await db.insert(routines).values({ activity, categoryId, hours, weekdays, notes: text(row[col("Observações")]) || null, active: weekdays.length > 0 });
        count += 1;
      }
      console.log(`Rotinas: ${count} importadas`);
    }
  }

  await db.$client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
