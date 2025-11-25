import fs from 'fs/promises';
export function versionService() {
  let cache;
  async function get() {
    if (cache) return cache;
    try {
      const pkg = JSON.parse(await fs.readFile(new URL('../../package.json', import.meta.url)));
      cache = pkg.version || '0.0.0';
    } catch {
      cache = '0.0.0';
    }
    return cache;
  }
  return { get };
}
