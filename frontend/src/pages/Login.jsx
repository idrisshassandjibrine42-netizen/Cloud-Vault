import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Cloud, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!email || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await login(email, password);

      if (error) {
        setError("Email ou mot de passe incorrect.");
        return;
      }

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-icon">
            <Cloud size={24} />
          </div>

          <span>Cloud Vault</span>
        </div>

        <div className="auth-heading">
          <span className="section-label">BON RETOUR</span>

          <h1>
            Retrouvez votre
            <br />
            espace.
          </h1>

          <p>
            Connectez-vous pour retrouver vos fichiers, dossiers et documents.
          </p>
        </div>

        {error && <div className="auth-message error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Adresse email</label>

            <div className="input-wrapper">
              <Mail size={18} />

              <input
                type="email"
                placeholder="vous@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="password-label">
              <label>Mot de passe</label>

              <Link to="/forgot-password">Mot de passe oublié ?</Link>
            </div>

            <div className="input-wrapper">
              <Lock size={18} />

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button
                type="button"
                className="password-button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}

            {!loading && <ArrowRight size={19} />}
          </button>
        </form>

        <div className="auth-footer">
          <span>Vous n'avez pas encore de compte ?</span>

          <Link to="/register">Créer mon coffre-fort</Link>
        </div>
      </div>
    </main>
  );
}

export default Login;
