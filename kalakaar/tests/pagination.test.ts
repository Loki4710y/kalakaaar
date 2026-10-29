import { describe, it, expect } from "vitest";
import { pageRange, makePaged, isRangeError } from "../src/repositories/utils";
import { buildHref, pageParam, textParam, choiceParam } from "../src/lib/listParams";

describe("server-side pagination helpers", () => {
  it("turns a page number into a row range", () => {
    expect(pageRange(1, 12)).toMatchObject({ page: 1, size: 12, from: 0, to: 11 });
    expect(pageRange(3, 12)).toMatchObject({ page: 3, from: 24, to: 35 });
  });

  it("clamps bad pages and oversized page sizes", () => {
    expect(pageRange(0, 12).page).toBe(1);
    expect(pageRange(-5, 12).page).toBe(1);
    expect(pageRange(NaN as any, 12).page).toBe(1);
    expect(pageRange(1, 100000, 60).size).toBe(60);
    expect(pageRange(1, 100000, 60).to).toBe(59);
  });

  it("reports total pages (at least 1)", () => {
    const r = pageRange(2, 12);
    expect(makePaged([1], 30, r).totalPages).toBe(3);
    expect(makePaged([], 0, r).totalPages).toBe(1);
    expect(makePaged([], 24, pageRange(1, 12)).totalPages).toBe(2);
  });

  it("recognises PostgREST 'range not satisfiable' as an empty page", () => {
    expect(isRangeError({ code: "PGRST103" })).toBe(true);
    expect(isRangeError({ message: "Requested range not satisfiable" })).toBe(true);
    expect(isRangeError({ code: "42501", message: "permission denied" })).toBe(false);
    expect(isRangeError(null)).toBe(false);
  });
});

describe("URL list params", () => {
  it("reads page safely", () => {
    expect(pageParam({ page: "2" })).toBe(2);
    expect(pageParam({ page: "abc" })).toBe(1);
    expect(pageParam({ page: "-3" })).toBe(1);
    expect(pageParam({ page: "999999" })).toBe(500);
    expect(pageParam({})).toBe(1);
  });

  it("cleans text and enforces allowed choices", () => {
    expect(textParam({ q: "  fish   art " }, "q")).toBe("fish art");
    expect(textParam({ q: "x".repeat(200) }, "q", 10)).toHaveLength(10);
    expect(choiceParam({ sort: "price_asc" }, "sort", ["newest", "price_asc"] as const, "newest")).toBe("price_asc");
    expect(choiceParam({ sort: "drop table" }, "sort", ["newest", "price_asc"] as const, "newest")).toBe("newest");
  });

  it("builds clean links: no empty values, no ?page=1", () => {
    expect(buildHref("/explore", { page: 1 })).toBe("/explore");
    expect(buildHref("/explore", { category: "Warli", page: 2 })).toBe("/explore?category=Warli&page=2");
    expect(buildHref("/explore", { q: "", category: null })).toBe("/explore");
  });
});
