/**
 * Back-compat shim — majors identity now comes from Coinbase+Binance catalog.
 * Prefer importing from `@/lib/majors-catalog`.
 */

export type {
  MajorCatalogEntry as MajorAlias,
  MajorPreferredContract,
} from "@/lib/majors-catalog";

export {
  resolveMajorSync as resolveMajorAlias,
  resolveMajor,
  getMajorsCatalog,
  isCanonicalMajorGeckoId as isCanonicalMajorId,
  majorByGeckoId as majorById,
  majorFamilySymbols,
  isKnownFamilyContract,
} from "@/lib/majors-catalog";
