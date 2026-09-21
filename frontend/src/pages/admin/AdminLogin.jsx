import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiLock, FiMail, FiShield, FiEye, FiEyeOff } from "react-icons/fi";

import { supabase } from "../../services/supabase";
import { useAuth } from "../../context/AuthContext";

import "./AdminLogin.css";

function AdminLogin() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("idrisshassandjibrine42@gmail.com");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [error, setError] = useState("");

  /*
  ============================================================
  VÉRIFICATION DE L'UTILISATEUR DÉJÀ CONNECTÉ
  ============================================================
  */

  useEffect(() => {
    const checkAdmin = async () => {
      // On attend que AuthContext termine de charger
      if (authLoading) {
        return;
      }

      // Aucun utilisateur connecté
      if (!user) {
        setCheckingAdmin(false);
        return;
      }

      try {
        /*
        IMPORTANT :
        Ici on NE FAIT PAS signInWithPassword().

        L'utilisateur est déjà connecté.
        On vérifie simplement son rôle dans profiles.
        */

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        console.log("========== VÉRIFICATION ADMIN ==========");
        console.log("USER :", user);
        console.log("PROFILE :", profile);
        console.log("PROFILE ERROR :", profileError);
        console.log("ROLE :", profile?.role);
        console.log("=========================================");

        if (!profileError && profile?.role === "admin") {
          navigate("/admin", { replace: true });
          return;
        }

        /*
        L'utilisateur est connecté mais n'est pas admin.
        On le déconnecte.
        */

        await supabase.auth.signOut();

        setError(
          "Accès refusé. Ce compte ne possède pas les droits administrateur.",
        );
      } catch (err) {
        console.error("Erreur vérification admin :", err);

        setError(
          err.message || "Impossible de vérifier les droits administrateur.",
        );
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkAdmin();
  }, [user, authLoading, navigate]);

  /*
  ============================================================
  CONNEXION ADMINISTRATEUR
  ============================================================
  */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    /*
    Validation
    */

    if (!email.trim() || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    setLoading(true);

    try {
      /*
      ========================================================
      1. CONNEXION SUPABASE
      ========================================================
      */

      const { data: loginData, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      /*
      Logs pour diagnostiquer l'erreur 400
      */

      console.log("========== SUPABASE LOGIN ==========");
      console.log("EMAIL :", email.trim());
      console.log("LOGIN DATA :", loginData);
      console.log("LOGIN ERROR :", loginError);
      console.log("ERROR MESSAGE :", loginError?.message);
      console.log("ERROR CODE :", loginError?.code);
      console.log("ERROR STATUS :", loginError?.status);
      console.log("====================================");

      /*
      Si Supabase refuse la connexion
      */

      if (loginError) {
        throw loginError;
      }

      /*
      Vérification de l'utilisateur
      */

      if (!loginData?.user) {
        throw new Error("Authentification impossible.");
      }

      /*
      ========================================================
      2. VÉRIFICATION DU PROFIL ADMIN
      ========================================================
      */

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", loginData.user.id)
        .single();

      console.log("========== PROFIL ADMIN ==========");
      console.log("PROFILE :", profile);
      console.log("PROFILE ERROR :", profileError);
      console.log("ROLE :", profile?.role);
      console.log("==================================");

      /*
      Le profil n'existe pas
      */

      if (profileError) {
        await supabase.auth.signOut();

        throw new Error("Le profil de cet utilisateur est introuvable.");
      }

      /*
      Le compte existe mais n'est pas admin
      */

      if (profile.role !== "admin") {
        await supabase.auth.signOut();

        throw new Error("Accès refusé. Ce compte n'est pas administrateur.");
      }

      /*
      ========================================================
      3. CONNEXION ADMIN RÉUSSIE
      ========================================================
      */

      console.log("✅ Connexion administrateur réussie.");

      navigate("/admin", { replace: true });
    } catch (err) {
      console.error("❌ ERREUR CONNEXION ADMIN :", err);

      /*
      Afficher le véritable message Supabase
      */

      setError(
        err?.message ||
          "Identifiants incorrects ou accès administrateur refusé.",
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  ============================================================
  ÉCRAN DE CHARGEMENT
  ============================================================
  */

  if (authLoading || checkingAdmin) {
    return (
      <div className="admin-login-loading">
        <div className="admin-spinner"></div>

        <p>Vérification de l'accès administrateur...</p>
      </div>
    );
  }

  /*
  ============================================================
  PAGE LOGIN
  ============================================================
  */

  return (
    <div className="admin-login-page">
      {/* Background */}
      <div className="admin-login-background"></div>

      {/* Card */}
      <div className="admin-login-card">
        {/* Icône */}
        <div className="admin-login-icon">
          <FiShield />
        </div>

        {/* Header */}
        <div className="admin-login-header">
          <h1>Cloud Vault</h1>

          <h2>Espace administrateur</h2>

          <p>Connectez-vous pour accéder à la gestion de la plateforme.</p>
        </div>

        {/* Message erreur */}
        {error && <div className="admin-login-error">{error}</div>}

        {/* Formulaire */}
        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="admin-form-group">
            <label htmlFor="admin-email">Email administrateur</label>

            <div className="admin-input-wrapper">
              <FiMail />

              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cloudvault@gmail.com"
                autoComplete="username"
                disabled={loading}
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div className="admin-form-group">
            <label htmlFor="admin-password">Mot de passe</label>

            <div className="admin-input-wrapper">
              <FiLock />

              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                autoComplete="current-password"
                disabled={loading}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((previous) => !previous)}
                disabled={loading}
                aria-label={
                  showPassword
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
                }
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          {/* Bouton connexion */}
          <button
            type="submit"
            className="admin-login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="button-spinner"></span>
                Connexion...
              </>
            ) : (
              <>
                <FiShield />
                Se connecter
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="admin-login-footer">
          <span>🔒</span>

          <span>Accès réservé à l'administration</span>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
