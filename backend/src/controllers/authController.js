const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authService = require("../services/authService");

const signToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    const normalizedEmail = email?.trim().toLowerCase();
    const trimmedName = name?.trim();

    if (!trimmedName || !normalizedEmail || !password) {
      return res.status(400).json({
        message: "All fields (name, email, password) are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const existingUser = await authService.getUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await authService.createUser(
      trimmedName,
      normalizedEmail,
      hashedPassword
    );

    console.log(`[SIGNUP SUCCESS] User created: ${user.email}`);

    const token = signToken(user);

    delete user.password;

    return res.status(201).json({
      message: "User registered successfully",
      token,
      user,
    });
  } catch (err) {
    console.error("❌ Signup Error Detail:", {
      message: err.message,
      code: err.code || null,
      detail: err.detail || null,
    });

    if (err.code === "23505") {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    if (err.code === "42P01") {
      return res.status(500).json({
        message: "Database error: Users table not found. Please run setup script.",
      });
    }

    return res.status(500).json({
      message: "Server error during signup: " + (err.message || ""),
    });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmail = email?.trim().toLowerCase();

  console.log(`[LOGIN ATTEMPT] Email: ${normalizedEmail}`);

  try {
    if (!normalizedEmail || !password) {
      console.warn(`[LOGIN FAILED] Missing credentials for: ${normalizedEmail}`);
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await authService.getUserByEmail(normalizedEmail);
    if (!user) {
      console.warn(`[LOGIN FAILED] User not found: ${normalizedEmail}`);
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn(`[LOGIN FAILED] Incorrect password for: ${normalizedEmail}`);
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET is missing from environment variables!");
      return res.status(500).json({
        message: "Server configuration error: JWT_SECRET missing",
      });
    }

    const token = signToken(user);

    delete user.password;

    console.log(`[LOGIN SUCCESS] User: ${normalizedEmail}`);
    return res.status(200).json({
      message: "Login successful",
      token,
      user,
    });
  } catch (err) {
    console.error("❌ Login Route Error:", {
      message: err.message,
      stack: err.stack,
    });

    if (err.code === "ECONNREFUSED") {
      return res.status(503).json({
        message: "Database connection refused. Please check if your DB is running.",
      });
    }

    return res.status(500).json({
      message: "Server error during login: " + err.message,
    });
  }
};

module.exports = {
  signup,
  login,
};
