/**
 * Read a fetch Response as JSON without throwing. Malformed bodies or parse
 * errors return null instead of rejecting (avoids noisy dev unhandled rejections).
 */
export async function readResponseJsonSafely(res: Response): Promise<unknown | null> {
  try {
    const text = await res.text();
    if (!text.trim()) return null;
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}
