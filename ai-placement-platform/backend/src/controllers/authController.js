const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authService = require("../services/authService");

// 🔐 SIGNUP
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    const trimmedName = name?.trim();

    // ✅ Basic validation
    if (!trimmedName || !normalizedEmail || !password) {
      return res.status(400).json({
        message: "All fields (name, email, password) are required",
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

    // ✅ Remove password before sending response
    delete user.password;

    return res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (err) {
    console.error("Signup Error:", err.message);
    return res.status(500).json({
      message: "Server error during signup",
    });
  }
};

// 🔐 LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    // ✅ Basic validation
    if (!normalizedEmail || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("Login Error: JWT_SECRET is not configured");
      return res.status(500).json({
        message: "Server authentication is not configured",
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
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

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
