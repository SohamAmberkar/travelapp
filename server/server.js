const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect("mongodb+srv://soham:dbUserPassword@travelapp.gjhqn6l.mongodb.net/?retryWrites=true&w=majority&appName=travelapp");

const userSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  password: String,
  
});

const User = mongoose.model("User", userSchema);

const JWT_SECRET = "your_jwt_secret"; // Use env var in production

// Register
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: "All fields required" });

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ error: "User already exists" });

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ username, email, password: hashed });
  res.json({ message: "Registration successful" });
});

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: "Invalid credentials" });

  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { username: user.username, email: user.email } });
});

// Protected route example
app.get("/profile", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "No token" });
  try {
    const { userId } = jwt.verify(auth.split(" ")[1], JWT_SECRET);
    const user = await User.findById(userId).select("-password");
    res.json(user);
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

app.listen(3001, () => console.log("Server running on port 3001"));
