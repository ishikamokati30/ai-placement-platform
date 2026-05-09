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
    { expiresIn: "1d" }
  );
};

// 🔐 SIGNUP
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    const normalizedEmail = email?.trim().toLowerCase();
    const trimmedName = name?.trim();

    // ✅ Basic validation
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

    // ✅ Check if user already exists
    const existingUser = await authService.getUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create user
    const user = await authService.createUser(
      trimmedName,
      normalizedEmail,
      hashedPassword
    );

    console.log(`[SIGNUP SUCCESS] User created: ${user.email}`);

    const token = signToken(user);

    // ✅ Remove password before sending response
    delete user.password;

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user,
    });
  } catch (err) {
    console.error("❌ Signup Error Detail:", {
      message: err.message,
      code: err.code || null,
      detail: err.detail || null,
      stack: err.stack
    });

    if (err.code === "23505") {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    if (err.code === "42P01") {
      return res.status(500).json({
        success: false,
        message: "Database error: Users table not found. Please run setup script.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error during signup: " + (err.message || ""),
    });
  }
};


// 🔐 LOGIN
const login = async (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmail = email?.trim().toLowerCase();

  console.log(`[LOGIN ATTEMPT] Email: ${normalizedEmail}`);

  try {
    // ✅ Basic validation
    if (!normalizedEmail || !password) {
      console.warn(`[LOGIN FAILED] Missing credentials for: ${normalizedEmail}`);
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // ✅ Check user
    const user = await authService.getUserByEmail(normalizedEmail);
    if (!user) {
      console.warn(`[LOGIN FAILED] User not found: ${normalizedEmail}`);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // ✅ Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn(`[LOGIN FAILED] Incorrect password for: ${normalizedEmail}`);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // ✅ Generate JWT
    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET is missing from environment variables!");
      return res.status(500).json({
        success: false,
        message: "Server configuration error: JWT_SECRET missing",
      });
    }

    const token = signToken(user);

    // ✅ Remove password
    delete user.password;

    console.log(`[LOGIN SUCCESS] User: ${normalizedEmail}`);
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user,
    });
  } catch (err) {
    console.error("❌ Login Route Error:", {
      message: err.message,
      stack: err.stack,
      email: normalizedEmail
    });

    // Check for specific DB errors
    if (err.code === "ECONNREFUSED") {
      return res.status(503).json({
        success: false,
        message: "Database connection refused. Please check if your DB is running.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error during login: " + err.message,
    });
  }
};

module.exports = {
  signup,
  login,
};
