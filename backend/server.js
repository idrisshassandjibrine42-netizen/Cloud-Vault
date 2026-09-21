import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { supabaseAdmin } from "./config/supabase.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// ================================
// MIDDLEWARES
// ================================

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// ================================
// ROUTE TEST
// ================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Bienvenue sur l'API Cloud Vault 🚀",
  });
});

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "Backend Cloud Vault fonctionne correctement.",
  });
});

app.get("/api/supabase-test", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .limit(1);

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Erreur Supabase",
        error: error.message,
      });
    }

    res.json({
      success: true,
      message: "Connexion Supabase réussie",
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ================================
// SERVEUR
// ================================

app.listen(PORT, () => {
  console.log(`🚀 Serveur backend lancé sur le port ${PORT}`);
});
