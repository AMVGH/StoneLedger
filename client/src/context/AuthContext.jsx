import { createContext, useContext, useMemo, useState } from "react";
import { generateUsername } from "../utils/usernameGenerator";
import { validatePassword, PASSWORD_POLICY_MESSAGE } from "../utils/validators";

const AuthCtx = createContext(null);

const USERS_KEY = "users_db";
const SESSION_KEY = "session_user";
const ATTEMPTS_PREFIX = "attempts_";
const REQUESTS_KEY = "access_requests_db";
const EMAILS_KEY = "email_outbox";

function loadUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
  catch { return []; }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function loadRequests() {
  try { return JSON.parse(localStorage.getItem(REQUESTS_KEY)) || []; }
  catch { return []; }
}

function saveRequests(requests) {
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
}

function loadEmails() {
  try { return JSON.parse(localStorage.getItem(EMAILS_KEY)) || []; }
  catch { return []; }
}

function saveEmails(emails) {
  localStorage.setItem(EMAILS_KEY, JSON.stringify(emails));
}

function queueEmail({ to, subject, body }) {
  const emails = loadEmails();
  emails.unshift({
    id: Date.now() + Math.floor(Math.random() * 1000),
    to,
    subject,
    body,
    sentAt: new Date().toISOString(),
  });
  saveEmails(emails);
}

function ensureUniqueUsername(baseUsername, users) {
  const safeBase = (baseUsername || "user").trim().toLowerCase() || "user";
  let candidate = safeBase;
  let i = 1;

  while (users.some((u) => u.username === candidate)) {
    candidate = `${safeBase}${i}`;
    i += 1;
  }

  return candidate;
}

function createTemporaryPassword() {
  const seed = Math.random().toString(36).slice(-6);
  return `Temp@${seed}`;
}

function normalizeSecurityAnswer(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function getUserSecurityQuestions(user) {
  if (Array.isArray(user?.securityQuestions) && user.securityQuestions.length > 0) {
    return user.securityQuestions;
  }

  const fallback = [];
  if (user?.dob) {
    fallback.push({
      id: "dob",
      question: "What is your date of birth (YYYY-MM-DD)?",
      answer: normalizeSecurityAnswer(user.dob),
    });
  }

  if (user?.address) {
    fallback.push({
      id: "address",
      question: "What address did you register with?",
      answer: normalizeSecurityAnswer(user.address),
    });
  }

  return fallback;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null; }
    catch { return null; }
  });

  const api = useMemo(() => ({
    user,
    isAuthed: !!user,

    requestAccess({ firstName, lastName, address, dob, email, password }) {
      const requests = loadRequests();
      const users = loadUsers();
      const normalizedEmail = String(email || "").trim().toLowerCase();
      const providedPassword = String(password || "");

      const { ok: passwordOk } = validatePassword(providedPassword);
      if (!passwordOk) {
        throw new Error(PASSWORD_POLICY_MESSAGE);
      }

      const duplicatePending = requests.some(
        (r) => r.email === normalizedEmail && r.status === "PENDING"
      );
      if (duplicatePending) {
        throw new Error("An access request is already pending for this email.");
      }

      const existingUser = users.some(
        (u) => String(u.email || "").trim().toLowerCase() === normalizedEmail
      );
      if (existingUser) {
        throw new Error("An account already exists for this email.");
      }

      const request = {
        id: Date.now(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        address: address.trim(),
        dob,
        email: normalizedEmail,
        password: providedPassword,
        status: "PENDING",
        createdAt: new Date().toISOString(),
      };

      requests.unshift(request);
      saveRequests(requests);

      queueEmail({
        to: "admin@stoneledger.local",
        subject: "New StoneLedger access request",
        body: `New request from ${request.firstName} ${request.lastName} (${request.email}). Review in the Admin dashboard.`,
      });
    },

    getAccessRequests() {
      return loadRequests();
    },

    getEmailOutbox() {
      return loadEmails();
    },

    getAllUsers() {
      const users = loadUsers();
      return users.map((u) => ({
        username: u.username,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email || "",
        role: u.role,
        suspended: !!u.suspended,
      }));
    },

    sendEmailToUser({ username, subject, body, from = "admin@stoneledger.local" }) {
      const users = loadUsers();
      const target = users.find((u) => u.username === String(username || "").trim());

      if (!target) {
        throw new Error("User not found.");
      }

      if (!target.email) {
        throw new Error("Selected user has no email address on file.");
      }

      const cleanSubject = String(subject || "").trim();
      const cleanBody = String(body || "").trim();

      if (!cleanSubject || !cleanBody) {
        throw new Error("Subject and message body are required.");
      }

      queueEmail({
        to: target.email,
        subject: cleanSubject,
        body: `From: ${from}\nTo user: ${target.username}\n\n${cleanBody}`,
      });
    },

    getSecurityQuestionsForReset({ username, email }) {
      const users = loadUsers();
      const normalizedUsername = String(username || "").trim();
      const normalizedEmail = String(email || "").trim().toLowerCase();
      const userRecord = users.find(
        (u) => u.username === normalizedUsername
          && String(u.email || "").trim().toLowerCase() === normalizedEmail
      );

      if (!userRecord) {
        throw new Error("User ID and email do not match our records.");
      }

      const securityQuestions = getUserSecurityQuestions(userRecord);
      if (securityQuestions.length === 0) {
        throw new Error("Security questions are not configured for this account. Contact administrator.");
      }

      return securityQuestions.map((q) => ({ id: q.id, question: q.question }));
    },

    verifySecurityAnswers({ username, email, answers }) {
      const users = loadUsers();
      const normalizedUsername = String(username || "").trim();
      const normalizedEmail = String(email || "").trim().toLowerCase();
      const userRecord = users.find(
        (u) => u.username === normalizedUsername
          && String(u.email || "").trim().toLowerCase() === normalizedEmail
      );

      if (!userRecord) {
        throw new Error("User ID and email do not match our records.");
      }

      const securityQuestions = getUserSecurityQuestions(userRecord);
      if (securityQuestions.length === 0) {
        throw new Error("Security questions are not configured for this account. Contact administrator.");
      }

      const allMatch = securityQuestions.every((q) => {
        const supplied = normalizeSecurityAnswer(answers?.[q.id]);
        return supplied && supplied === q.answer;
      });

      if (!allMatch) {
        throw new Error("Security answers did not match.");
      }

      return true;
    },

    resetPasswordBySecurity({ username, email, answers, newPassword }) {
      const users = loadUsers();
      const normalizedUsername = String(username || "").trim();
      const normalizedEmail = String(email || "").trim().toLowerCase();
      const userIndex = users.findIndex(
        (u) => u.username === normalizedUsername
          && String(u.email || "").trim().toLowerCase() === normalizedEmail
      );

      if (userIndex < 0) {
        throw new Error("User ID and email do not match our records.");
      }

      const userRecord = users[userIndex];
      const securityQuestions = getUserSecurityQuestions(userRecord);
      if (securityQuestions.length === 0) {
        throw new Error("Security questions are not configured for this account. Contact administrator.");
      }

      const allMatch = securityQuestions.every((q) => {
        const supplied = normalizeSecurityAnswer(answers?.[q.id]);
        return supplied && supplied === q.answer;
      });

      if (!allMatch) {
        throw new Error("Security answers did not match.");
      }

      users[userIndex] = {
        ...userRecord,
        password: newPassword,
        suspended: false,
      };
      saveUsers(users);
      localStorage.removeItem(`${ATTEMPTS_PREFIX}${normalizedUsername}`);

      queueEmail({
        to: normalizedEmail,
        subject: "StoneLedger password changed",
        body: "Your password was successfully changed. You can now login using your new password.",
      });
    },

    approveAccessRequest(requestId, approverUsername = "ADMIN") {
      const requests = loadRequests();
      const users = loadUsers();
      const req = requests.find((r) => r.id === requestId);

      if (!req) throw new Error("Request not found.");
      if (req.status !== "PENDING") throw new Error("Request already processed.");

      const base = generateUsername(req.firstName, req.lastName);
      const username = ensureUniqueUsername(base, users);
      const requestedPassword = String(req.password || "");
      const hasRequestedPassword = requestedPassword.length > 0;
      const initialPassword = hasRequestedPassword ? requestedPassword : createTemporaryPassword();

      users.push({
        firstName: req.firstName,
        lastName: req.lastName,
        username,
        role: "ACCOUNTANT",
        password: initialPassword,
        suspended: false,
        email: req.email,
        address: req.address,
        dob: req.dob,
        securityQuestions: [
          {
            id: "dob",
            question: "What is your date of birth (YYYY-MM-DD)?",
            answer: normalizeSecurityAnswer(req.dob),
          },
          {
            id: "address",
            question: "What address did you register with?",
            answer: normalizeSecurityAnswer(req.address),
          },
        ],
      });
      saveUsers(users);

      req.status = "APPROVED";
      req.decidedAt = new Date().toISOString();
      req.decidedBy = approverUsername;
      req.username = username;
      saveRequests(requests);

      queueEmail({
        to: req.email,
        subject: "StoneLedger access approved",
        body: hasRequestedPassword
          ? `Your access request has been approved. Login link: /login\nUsername: ${username}`
          : `Your access request has been approved. Login link: /login\nUsername: ${username}\nTemporary password: ${initialPassword}`,
      });
    },

    rejectAccessRequest(requestId, approverUsername = "ADMIN") {
      const requests = loadRequests();
      const req = requests.find((r) => r.id === requestId);

      if (!req) throw new Error("Request not found.");
      if (req.status !== "PENDING") throw new Error("Request already processed.");

      req.status = "REJECTED";
      req.decidedAt = new Date().toISOString();
      req.decidedBy = approverUsername;
      saveRequests(requests);

      queueEmail({
        to: req.email,
        subject: "StoneLedger access request decision",
        body: "Your access request was reviewed and was not approved at this time.",
      });
    },

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
