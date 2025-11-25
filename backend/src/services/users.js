import { nanoid } from "nanoid";

export function usersServiceFactory({ db, crypto }) {
  async function findByUsername(username) {
    const { users } = await db.read();
    return users.find(
      (u) => u.username.toLowerCase() === String(username).toLowerCase()
    );
  }
  async function findById(id) {
    const { users } = await db.read();
    return users.find((u) => u.id === id);
  }

  async function createSignup({ username, password }) {
    username = String(username || "").trim();
    if (!username)
      throw Object.assign(new Error("username required"), {
        status: 400,
        expose: true,
      });
    if (!password)
      throw Object.assign(new Error("password required"), {
        status: 400,
        expose: true,
      });
    const exists = await findByUsername(username);
    if (exists)
      throw Object.assign(new Error("Username taken"), {
        status: 400,
        expose: true,
      });

    const passwordHash = await crypto.hash(password);
    await db.write(async (data) => {
      data.users.push({
        id: nanoid(),
        username,
        passwordHash,
        role: "user",
        validated: false,
        signedUpAt: new Date().toISOString(),
      });
      return data;
    });
  }

  async function changePassword({ id, currentPassword, newPassword }) {
    if (!currentPassword || !newPassword)
      throw Object.assign(
        new Error("currentPassword and newPassword required"),
        { status: 400, expose: true }
      );
    await db.write(async (data) => {
      const u = data.users.find((x) => x.id === id);
      if (!u)
        throw Object.assign(new Error("User not found"), {
          status: 404,
          expose: true,
        });
      const ok = await crypto.compare(currentPassword, u.passwordHash);
      if (!ok)
        throw Object.assign(new Error("Wrong password"), {
          status: 400,
          expose: true,
        });
      u.passwordHash = await crypto.hash(newPassword);
      return data;
    });
  }

  async function listSafe() {
    const { users } = await db.read();
    return users.map((u) => ({
      id: u.id,
      username: u.username,
      validated: !!u.validated,
    }));
  }

  async function adminAddUser({ username, password }) {
    username = String(username || "").trim();
    if (!username)
      throw Object.assign(new Error("username required"), {
        status: 400,
        expose: true,
      });
    if (username.toLowerCase() === "admin")
      throw Object.assign(new Error("Cannot add admin user"), {
        status: 400,
        expose: true,
      });
    const exists = await findByUsername(username);
    if (exists)
      throw Object.assign(new Error("Username taken"), {
        status: 400,
        expose: true,
      });
    const passwordHash = await crypto.hash(password || nanoid(8));
    let created;
    await db.write(async (data) => {
      created = {
        id: nanoid(),
        username,
        passwordHash,
        role: "user",
        validated: false,
        signedUpAt: new Date().toISOString(),
      };
      data.users.push(created);
      return data;
    });
    return created;
  }

  async function adminUpdateUser({ id, username, validated }) {
    let updated;
    await db.write(async (data) => {
      const u = data.users.find((x) => x.id === id);
      if (!u)
        throw Object.assign(new Error("User not found"), {
          status: 404,
          expose: true,
        });
      if (u.username.toLowerCase() === "admin")
        throw Object.assign(new Error("Cannot modify admin"), {
          status: 400,
          expose: true,
        });
      if (typeof username === "string" && username.trim()) {
        if (username.toLowerCase() === "admin")
          throw Object.assign(new Error("Username admin not allowed"), {
            status: 400,
            expose: true,
          });
        const taken = data.users.find(
          (x) =>
            x.username.toLowerCase() === username.toLowerCase() && x.id !== id
        );
        if (taken)
          throw Object.assign(new Error("Username taken"), {
            status: 400,
            expose: true,
          });
        u.username = username.trim();
      }
      if (typeof validated === "boolean") u.validated = validated;
      updated = u;
      return data;
    });
    return updated;
  }

  async function adminDeleteUser(id) {
    let ok = false;
    await db.write(async (data) => {
      const u = data.users.find((x) => x.id === id);
      if (!u || u.username.toLowerCase() === "admin") return data; // cannot delete admin
      data.users = data.users.filter((x) => x.id !== id);
      delete data.itemsByUserId[id];
      ok = true;
      return data;
    });
    return ok;
  }

  async function adminResetPassword({ id, tempPassword }) {
    await db.write(async (data) => {
      const u = data.users.find((x) => x.id === id);
      if (!u)
        throw Object.assign(new Error("User not found"), {
          status: 404,
          expose: true,
        });
      if (u.username.toLowerCase() === "admin" && !tempPassword)
        throw Object.assign(new Error("Temp password required for admin"), {
          status: 400,
          expose: true,
        });
      u.passwordHash = await crypto.hash(tempPassword || nanoid(8));
      return data;
    });
  }

  async function adminSetValidated(id, flag) {
    await db.write(async (data) => {
      const u = data.users.find((x) => x.id === id);
      if (!u)
        throw Object.assign(new Error("User not found"), {
          status: 404,
          expose: true,
        });
      if (u.username.toLowerCase() === "admin" && flag === false)
        throw Object.assign(new Error("Cannot freeze admin"), {
          status: 400,
          expose: true,
        });
      u.validated = !!flag;
      return data;
    });
  }

  async function seedAdmin({ adminPassword }) {
    await db.write(async (data) => {
      const exists = data.users.find(
        (u) => u.username.toLowerCase() === "admin"
      );
      if (exists) return data;
      const pwd = adminPassword || nanoid(12);
      const hash = await crypto.hash(pwd);
      const admin = {
        id: nanoid(),
        username: "admin",
        passwordHash: hash,
        role: "admin",
        validated: true,
        signedUpAt: new Date().toISOString(),
      };
      data.users.push(admin);
      console.log(`[seed] admin user created with password: ${pwd}`);
      return data;
    });
  }

  async function seedSampleUser(sampleUsers = []) {
    if (!Array.isArray(sampleUsers) || sampleUsers.length === 0) return;

    await db.write(async (data) => {
      const existing = new Set(data.users.map((u) => u.username.toLowerCase()));

      for (const entry of sampleUsers) {
        const username = String(entry?.username || "").trim();
        const password = String(entry?.password || "");

        // skip invalid entries, admin, or already-existing users
        if (!username || !password) continue;
        if (username.toLowerCase() === "admin") continue;
        if (existing.has(username.toLowerCase())) continue;

        const hash = await crypto.hash(password);
        const usr = {
          id: nanoid(),
          username,
          passwordHash: hash,
          role: "user",
          validated: true,
          signedUpAt: new Date().toISOString(),
        };
        data.users.push(usr);
        data.itemsByUserId[usr.id] = [
          { id: nanoid(), text: "Welcome to your list" },
        ];
        existing.add(username.toLowerCase());
      }
      return data;
    });
  }

  return {
    findByUsername,
    findById,
    createSignup,
    changePassword,
    listSafe,
    adminAddUser,
    adminUpdateUser,
    adminDeleteUser,
    adminResetPassword,
    adminSetValidated,
    seedAdmin,
    seedSampleUser,
  };
}
