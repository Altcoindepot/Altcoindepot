/**
 * True only while `next build` is prerendering.
 *
 * Do not read `process.env.NEXT_PHASE` as a static property — bundlers can
 * inline the build-time value into the server runtime, which would skip
 * CoinGecko on every Vercel request and freeze the dashboard on mocks.
 *
 * `VERCEL_REGION` is set on serverless invocations, never during `next build`.
 */
export function isProductionBuild(): boolean {
  if (process.env.VERCEL_REGION) return false;
  try {
    const key = ["NEXT", "PHASE"].join("_");
    return process.env[key] === "phase-production-build";
  } catch {
    return false;
  }
}
