import fs from 'fs/promises';
import fssync from 'fs';
import path from 'path';

export function dbService({ filePath }) {
  const abs = path.resolve(filePath);
  let lock = Promise.resolve();

  async function ensureDir() {
    await fs.mkdir(path.dirname(abs), { recursive: true });
  }

  async function readRaw() {
    try {
      const buf = await fs.readFile(abs, 'utf8');
      return JSON.parse(buf);
    } catch (e) {
      if (e.code === 'ENOENT') return null;
      throw e;
    }
  }

  async function writeRaw(data) {
    const tmp = abs + '.tmp';
    const json = JSON.stringify(data, null, 2);
    await fs.writeFile(tmp, json, 'utf8');
    // Atomic rename on POSIX; best-effort on others
    await fs.rename(tmp, abs);
    // fsync directory for extra safety
    try {
      const dirfd = fssync.openSync(path.dirname(abs), 'r');
      fssync.fsyncSync(dirfd);
      fssync.closeSync(dirfd);
    } catch {}
  }

  async function init() {
    await ensureDir();
    const cur = await readRaw();
    if (!cur) {
      const fresh = { users: [], itemsByUserId: {} };
      await writeRaw(fresh);
    }
  }

  function withLock(fn) {
    lock = lock.then(() => fn()).catch((e) => { throw e; });
    return lock;
  }

  async function read() {
    const data = await readRaw();
    if (!data) return { users: [], itemsByUserId: {} };
    return data;
  }

  async function write(mutator) {
    return withLock(async () => {
      const cur = (await readRaw()) || { users: [], itemsByUserId: {} };
      const next = await mutator(structuredClone(cur));
      await writeRaw(next);
      return next;
    });
  }

  return { init, read, write };
}
