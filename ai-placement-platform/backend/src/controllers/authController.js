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

    const token = signToken(user);

    // ✅ Remove password before sending response
    delete user.password;

    return res.status(201).json({
      message: "User registered successfully",
      token,
      user,
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    console.error("Signup Error:", {
      message: err.message,
      code: err.code || null,
    });
    return res.status(500).json({
      message: "Server error during signup",
    });
  }
};

// 🔐 LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = email?.trim().toLowerCase();

    // ✅ Basic validation
    if (!normalizedEmail || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // ✅ Check user
    const user = await authService.getUserByEmail(normalizedEmail);
    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // ✅ Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // ✅ Generate JWT
    const token = signToken(user);

    // ✅ Remove password
    delete user.password;

    return res.status(200).json({
      message: "Login successful",
      token,
      user,
    });
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({
      message: "Server error during login",
    });
  }
};

module.exports = {
  signup,
  login,
};
