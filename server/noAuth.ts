import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

const DEV_USER_ID = "dev-user-1";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || "dev-fallback-secret-change-in-prod",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  await storage.upsertUser({
    id: DEV_USER_ID,
    email: "dev@resumelogik.com",
    firstName: "Dev",
    lastName: "User",
    profileImageUrl: null,
    isAdmin: "true",
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  (req as any).user = {
    claims: {
      sub: DEV_USER_ID,
      email: "dev@resumelogik.com",
      first_name: "Dev",
      last_name: "User",
    },
  };
  next();
};
