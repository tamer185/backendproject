import { nanoid } from 'nanoid';

export function itemsServiceFactory({ db }) {
  async function list(userId) {
    const { itemsByUserId } = await db.read();
    return itemsByUserId[userId] || [];
  }

  async function add(userId, text) {
    let created;
    await db.write(async (data) => {
      const arr = data.itemsByUserId[userId] || (data.itemsByUserId[userId] = []);
      created = { id: nanoid(), text };
      arr.push(created);
      return data;
    });
    return created;
  }

  async function update(userId, id, text) {
    let updated = null;
    await db.write(async (data) => {
      const arr = data.itemsByUserId[userId] || [];
      const it = arr.find(x => x.id === id);
      if (!it) return data;
      it.text = text;
      updated = it;
      return data;
    });
    return updated;
  }

  async function remove(userId, id) {
    let ok = false;
    await db.write(async (data) => {
      const arr = data.itemsByUserId[userId] || [];
      const len = arr.length;
      data.itemsByUserId[userId] = arr.filter(x => x.id !== id);
      ok = data.itemsByUserId[userId].length !== len;
      return data;
    });
    return ok;
  }

  return { list, add, update, remove };
}
