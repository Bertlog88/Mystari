// Import dependencies
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
require("dotenv").config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON requests
app.use(session({ secret: "secret", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("🔥 Connected to MongoDB!"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

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

// OAuth with Google
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

// Get all players
app.get("/api/players", async (req, res) => {
  try {
    const players = await Player.find();
    res.json(players);
  } catch (err) {
    console.error("❌ Error fetching players:", err);
    res.status(500).json({ error: "Failed to fetch players" });
  }
});

// Update player (Fixed)
app.put("/api/players/:id", async (req, res) => {
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

