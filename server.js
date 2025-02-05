// Import dependencies
const express = require("express");
const cors = require("cors");
const mongoose = require('mongoose');
const passport = require("passport");
const session = require("express-session");
const cookieParser = require("cookie-parser"); // Import cookie-parser
const GoogleStrategy = require("passport-google-oauth20").Strategy;
require("dotenv").config();

// Import MongoDB connection function
const connectDB = require("./config/db"); // Import the connectDB function
const authRoutes = require("./routes/auth"); // Import the auth routes
const authMiddleware = require("./middleware/authMiddleware"); // Import the authentication middleware

// Initialize Express app
const app = express();

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON requests
app.use(cookieParser()); // Use cookie-parser to parse cookies in requests
app.use(session({ secret: "secret", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Connect to MongoDB
connectDB(); // Use the connectDB function to connect to MongoDB

// Define Player schema and model
const playerSchema = new mongoose.Schema({
  username: String,
  level: Number,
  xp: Number,
  energy: Number,
  health: Number,
  faction: String,
  rarity: String,
  type: String,
});

const Player = mongoose.model("Player", playerSchema);

// OAuth with Google (You can keep this part if needed)
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      return done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect("/");
  }
);

// Test route
app.get("/", (req, res) => {
  res.send("Mystari API is running");
});

// Register the authentication routes
app.use('/api/auth', authRoutes); // Register the auth routes here

// Get all players (Protected route)
app.get("/api/players", authMiddleware, async (req, res) => {
  try {
    const players = await Player.find();
    res.json(players);
  } catch (err) {
    console.error("❌ Error fetching players:", err);
    res.status(500).json({ error: "Failed to fetch players" });
  }
});

// Update player (Protected route)
app.put("/api/players/:id", authMiddleware, async (req, res) => {
  try {
    const playerId = req.params.id.trim(); // Trim any extra spaces or newlines

    console.log("🛠 Updating Player ID:", playerId);
    console.log("🛠 Update Data:", req.body);

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(playerId)) {
      return res.status(400).json({ error: "Invalid player ID" });
    }

    const updatedPlayer = await Player.findByIdAndUpdate(
      playerId,
      req.body,
      { new: true } // Returns the updated player
    );

    if (!updatedPlayer) {
      return res.status(404).json({ error: "Player not found" });
    }

    res.json(updatedPlayer);
  } catch (err) {
    console.error("❌ Error updating player:", err);
    res.status(500).json({ error: "Failed to update player" });
  }
});

// Define port
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
