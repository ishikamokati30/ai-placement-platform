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

<<<<<<< HEAD
    console.log(`[SIGNUP SUCCESS] User created: ${user.email}`);

=======
>>>>>>> 412487494f6ea411007e0aa6e5c1367233ee236a
    const token = signToken(user);

    // ✅ Remove password before sending response
    delete user.password;

    return res.status(201).json({
<<<<<<< HEAD
      success: true,
=======
>>>>>>> 412487494f6ea411007e0aa6e5c1367233ee236a
      message: "User registered successfully",
      token,
      user,
    });
  } catch (err) {
<<<<<<< HEAD
    console.error("❌ Signup Error Detail:", {
      message: err.message,
      code: err.code || null,
      detail: err.detail || null,
      stack: err.stack
    });

    if (err.code === "23505") {
      return res.status(400).json({
        success: false,
=======
    if (err.code === "23505") {
      return res.status(400).json({
>>>>>>> 412487494f6ea411007e0aa6e5c1367233ee236a
        message: "Email already registered",
      });
    }

<<<<<<< HEAD
    if (err.code === "42P01") {
      return res.status(500).json({
        success: false,
        message: "Database error: Users table not found. Please run setup script.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error during signup: " + (err.message || ""),
=======
    console.error("Signup Error:", {
      message: err.message,
      code: err.code || null,
    });
    return res.status(500).json({
      message: "Server error during signup",
>>>>>>> 412487494f6ea411007e0aa6e5c1367233ee236a
    });
  }
};

<<<<<<< HEAD

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
=======
// 🔐 LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = email?.trim().toLowerCase();

    // ✅ Basic validation
    if (!normalizedEmail || !password) {
      return res.status(400).json({
>>>>>>> 412487494f6ea411007e0aa6e5c1367233ee236a
        message: "Email and password are required",
      });
    }

    // ✅ Check user
    const user = await authService.getUserByEmail(normalizedEmail);
    if (!user) {
<<<<<<< HEAD
      console.warn(`[LOGIN FAILED] User not found: ${normalizedEmail}`);
      return res.status(401).json({
        success: false,
=======
      return res.status(401).json({
>>>>>>> 412487494f6ea411007e0aa6e5c1367233ee236a
        message: "Invalid email or password",
      });
    }

    // ✅ Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
<<<<<<< HEAD
      console.warn(`[LOGIN FAILED] Incorrect password for: ${normalizedEmail}`);
      return res.status(401).json({
        success: false,
=======
      return res.status(401).json({
>>>>>>> 412487494f6ea411007e0aa6e5c1367233ee236a
        message: "Invalid email or password",
      });
    }

    // ✅ Generate JWT
<<<<<<< HEAD
    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET is missing from environment variables!");
      return res.status(500).json({
        success: false,
        message: "Server configuration error: JWT_SECRET missing",
      });
    }

=======
>>>>>>> 412487494f6ea411007e0aa6e5c1367233ee236a
    const token = signToken(user);

    // ✅ Remove password
    delete user.password;

<<<<<<< HEAD
    console.log(`[LOGIN SUCCESS] User: ${normalizedEmail}`);
    return res.status(200).json({
      success: true,
=======
    return res.status(200).json({
>>>>>>> 412487494f6ea411007e0aa6e5c1367233ee236a
      message: "Login successful",
      token,
      user,
    });
  } catch (err) {
<<<<<<< HEAD
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
=======
    console.error("Login Error:", err);
    return res.status(500).json({
      message: "Server error during login",
>>>>>>> 412487494f6ea411007e0aa6e5c1367233ee236a
    });
  }
};

module.exports = {
  signup,
  login,
};
