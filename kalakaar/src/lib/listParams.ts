/** Helpers for list pages driven by the URL (?page=2&category=Warli&q=fish&sort=newest). */
export type RawParams = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined): string => (Array.isArray(v) ? v[0] : v) ?? "";

export function textParam(sp: RawParams, key: string, max = 60): string {
  return one(sp[key]).replace(/\s+/g, " ").trim().slice(0, max);
}

export function pageParam(sp: RawParams, key = "page"): number {
  const n = parseInt(one(sp[key]), 10);
  return Number.isFinite(n) && n >= 1 ? Math.min(n, 500) : 1;
}

export function choiceParam<T extends string>(sp: RawParams, key: string, allowed: readonly T[], fallback: T): T {
  const v = one(sp[key]) as T;
  return allowed.includes(v) ? v : fallback;
}

/** Builds "/explore?category=Warli&page=2", leaving out empty values and page 1. */
export function buildHref(base: string, params: Record<string, string | number | null | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === null || v === undefined || v === "") continue;
    if (k === "page" && Number(v) <= 1) continue;
    q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `${base}?${s}` : base;
}
