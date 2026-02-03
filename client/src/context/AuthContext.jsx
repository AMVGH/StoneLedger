import { createContext, useContext, useMemo, useState } from "react";

const AuthCtx = createContext(null);

const USERS_KEY = "users_db";
const SESSION_KEY = "session_user";
const ATTEMPTS_PREFIX = "attempts_";

function loadUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
  catch { return []; }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null; }
    catch { return null; }
  });

  const api = useMemo(() => ({
    user,
    isAuthed: !!user,

    signup({ firstName, lastName, username, role, password }) {
      const users = loadUsers();
      if (users.some(u => u.username === username)) {
        throw new Error("Username already exists.");
      }
      users.push({
        firstName,
        lastName,
        username,
        role, // ADMIN | MANAGER | ACCOUNTANT
        password, // demo only
        suspended: false
      });
      saveUsers(users);
    },

    login({ username, password }) {
      const users = loadUsers();
      const u = users.find(x => x.username === username);

      // Don't reveal whether user exists
      if (!u) throw new Error("INVALID");

      if (u.suspended) throw new Error("SUSPENDED");

      const key = `${ATTEMPTS_PREFIX}${username}`;
      const attempts = Number(localStorage.getItem(key) || "0");

      if (u.password !== password) {
        const next = attempts + 1;
        localStorage.setItem(key, String(next));

        if (next >= 3) {
          u.suspended = true;
          saveUsers(users);
          throw new Error("SUSPENDED");
        }
        throw new Error("INVALID");
      }

      // success
      localStorage.removeItem(key);
      const session = { username: u.username, role: u.role };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      setUser(session);
    },

    logout() {
      localStorage.removeItem(SESSION_KEY);
      setUser(null);
    }
  }), [user]);

  return <AuthCtx.Provider value={api}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}
