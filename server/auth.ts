import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends User {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "super-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax', // Allow cross-site cookies in production
      httpOnly: true
    },
    rolling: true, // Refresh the cookie on each request
    name: 'od_tracker_session', // Custom session name
    unset: 'destroy'
  };

  // Configure trust proxy for Netlify
  app.set("trust proxy", process.env.NODE_ENV === "production" ? 1 : false);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({
      usernameField: 'registrationNumber',
      passwordField: 'password'
    }, async (registrationNumber, password, done) => {
      try {
        const user = await storage.getUserByRegistrationNumber(registrationNumber);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        }
        
        // For students, check if they're approved
        if (user.role === "student" && !user.isApproved) {
          return done(null, false, { message: "Your account is pending approval" });
        }
        
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByRegistrationNumber(req.body.registrationNumber);
      if (existingUser) {
        return res.status(400).json({ message: "Registration number already exists" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      res.status(201).json({ 
        id: user.id,
        registrationNumber: user.registrationNumber,
        name: user.name,
        role: "student",
        isApproved: user.isApproved
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("Authentication error:", err);
        // Check for database connection errors
        if (err.code === 'ETIMEDOUT' || err.message?.includes('timeout') || 
            err.message?.includes('connection') || err.message?.includes('WebSocket')) {
          return res.status(503).json({ 
            message: "Database connection error. Please try again in a moment.",
            retryable: true
          });
        }
        return res.status(500).json({ message: "Internal server error during login" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("Session login error:", loginErr);
          return res.status(500).json({ message: "Failed to establish session" });
        }
        return res.status(200).json({
          id: user.id,
          registrationNumber: user.registrationNumber,
          name: user.name,
          role: user.role,
          isApproved: user.isApproved
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as User;
    res.json({
      id: user.id,
      registrationNumber: user.registrationNumber,
      name: user.name,
      role: user.role,
      isApproved: user.isApproved
    });
  });

  // Admin-only middleware
  app.use("/api/admin/*", (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = req.user as User;
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  });
}
