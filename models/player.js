const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  energy: { type: Number, default: 100 },
  health: { type: Number, default: 100 },
  faction: { type: String, default: "None" },
  rarity: { type: String, enum: ["Common", "Uncommon", "Rare", "Epic", "Legendary"], default: "Common" },
  type: { type: String, enum: ["Fire", "Water", "Ice", "Electric", "Earth"], required: true },
}, { timestamps: true });

const Player = mongoose.model("Player", playerSchema);
module.exports = Player;
