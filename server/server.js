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
  preferences: { type: [String], default: [] },
  favorites: { type: [mongoose.Schema.Types.Mixed], default: [] },
   profilePic: { type: String, default: "" }
});

const User = mongoose.model("User", userSchema);

const JWT_SECRET = "your_jwt_secret";

// -------------- AUTH MIDDLEWARE ------------
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.userId);
    if (!req.user) throw new Error("User not found");
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// -------------- REGISTER -------------
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: "All fields required" });
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "User already exists" });
    const hashed = await bcrypt.hash(password, 10);
    await User.create({ username, email, password: hashed });
    res.json({ message: "Registration successful" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// -------------- LOGIN: always send 'favourites' field -------------
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid credentials" });
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({
      token,
      user: {
        username: user.username,
        email: user.email,
        preferences: user.preferences,
        favourites: user.favorites // << always return as 'favourites'
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// -------------- PROFILE: always send 'favourites' field -------------
app.get("/profile", authenticate, (req, res) => {
  res.json({
    username: req.user.username,
    email: req.user.email,
    preferences: req.user.preferences,
    favourites: req.user.favorites, // << always return as 'favourites'
     profilePic: req.user.profilePic
  });
});

// -------------- PATCH PREFERENCES -------------
app.patch("/preferences", authenticate, async (req, res) => {
  try {
    req.user.preferences = req.body.preferences;
    await req.user.save();
    res.json({ preferences: req.user.preferences });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /profile
// PATCH /profile
app.patch("/profile", authenticate, async (req, res) => {
  try {
    if (req.body.username) req.user.username = req.body.username;
    if (req.body.profilePic) req.user.profilePic = req.body.profilePic;
    if (req.body.interests) req.user.preferences = req.body.interests; // <-- Map interests to preferences
    await req.user.save();
    res.json({
      username: req.user.username,
      profilePic: req.user.profilePic,
      preferences: req.user.preferences,
      email: req.user.email,
      favourites: req.user.favorites,
    });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});



// -------------- GET FAVOURITES -------------
app.get("/favourites", authenticate, (req, res) => {
  res.json(req.user.favorites || []);
});

// -------------- ADD FAVOURITE (no duplicates) -------------
app.post("/favorites", authenticate, async (req, res) => {
  try {
    const newPlace = req.body.place;
    if (!newPlace?.place_id) return res.status(400).json({ error: "place required" });
    const exists = req.user.favorites.some(f => f.place_id === newPlace.place_id);
    if (!exists) {
      req.user.favorites.push(newPlace);
      await req.user.save();
    }
    res.json(req.user.favorites);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// -------------- DELETE FAVOURITE -------------
app.delete("/favorites/:placeId", authenticate, async (req, res) => {
  try {
    req.user.favorites = (req.user.favorites || []).filter(
      fav => fav.place_id !== req.params.placeId
    );
    await req.user.save();
    res.json(req.user.favorites);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(3001, () => console.log("Server running on port 3001"));
