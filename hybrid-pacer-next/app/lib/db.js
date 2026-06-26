import { sql } from "@vercel/postgres";

export const FORMATS = ["open", "pro", "doubles"];
export const GENDERS = ["men", "women", "mixed"];
export const SEG_COUNT = 16;

export function dbConfigured() {
  return !!(process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING);
}

const SEG_COLS = Array.from({ length: SEG_COUNT }, (_, i) => `seg${i}`);

let ensured = false;
async function ensureTable() {
  if (ensured) return;
  const cols = SEG_COLS.map((c) => `${c} integer not null`).join(", ");
  await sql.query(
    `create table if not exists results (
       id bigserial primary key,
       fmt text not null,
       gender text not null,
       finish integer not null,
       rox integer not null,
       ${cols},
       created_at timestamptz not null default now()
     )`
  );
  ensured = true;
}

export async function insertResult(r) {
  await ensureTable();
  const values = [r.fmt, r.gender, r.finish, r.rox, ...r.segs];
  const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
  await sql.query(
    `insert into results (fmt, gender, finish, rox, ${SEG_COLS.join(", ")}) values (${placeholders})`,
    values
  );
}

export async function countResults(fmt, gender) {
  await ensureTable();
  const { rows } = await sql.query(
    `select count(*)::int as n from results where fmt = $1 and gender = $2`,
    [fmt, gender]
  );
  return rows[0]?.n || 0;
}

export async function getBenchmarks(fmt, gender) {
  await ensureTable();
  const medianCols = SEG_COLS
    .map((c, i) => `percentile_cont(0.5) within group (order by ${c}) as m${i}`)
    .join(", ");
  const { rows } = await sql.query(
    `select count(*)::int as n,
        percentile_cont(0.5) within group (order by finish) as med_finish,
        percentile_cont(0.5) within group (order by rox) as med_rox,
        ${medianCols}
     from results where fmt = $1 and gender = $2`,
    [fmt, gender]
  );
  const row = rows[0] || {};
  const n = row.n || 0;
  if (!n) return { n: 0 };
  const medians = SEG_COLS.map((_, i) => Number(row[`m${i}`]));
  return {
    n,
    medFinish: Number(row.med_finish),
    medRox: Number(row.med_rox),
    medians,
  };
}
