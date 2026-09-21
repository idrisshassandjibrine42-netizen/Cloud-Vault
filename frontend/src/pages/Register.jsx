import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Cloud, User, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

import { useAuth } from "../context/AuthContext";

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (
      !form.fullName ||
      !form.email ||
      !form.password ||
      !form.confirmPassword
    ) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    if (form.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await register(
        form.email,
        form.password,
        form.fullName,
      );

      if (error) {
        setError(error.message);
        return;
      }

      if (data?.user && !data?.session) {
        setSuccess(
          "Compte créé. Vérifiez votre adresse email avant de vous connecter.",
        );
      } else {
        navigate("/dashboard");
      }
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
          <span className="section-label">VOTRE ESPACE PRIVÉ</span>

          <h1>
            Créez votre
            <br />
            coffre-fort.
          </h1>

          <p>
            Créez votre compte pour commencer à conserver vos fichiers en toute
            simplicité.
          </p>
        </div>

        {error && <div className="auth-message error">{error}</div>}

        {success && <div className="auth-message success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nom complet</label>

            <div className="input-wrapper">
              <User size={18} />

              <input
                type="text"
                name="fullName"
                placeholder="Votre nom complet"
                value={form.fullName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Adresse email</label>

            <div className="input-wrapper">
              <Mail size={18} />

              <input
                type="email"
                name="email"
                placeholder="vous@example.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Mot de passe</label>

            <div className="input-wrapper">
              <Lock size={18} />

              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Votre mot de passe"
                value={form.password}
                onChange={handleChange}
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

          <div className="form-group">
            <label>Confirmer le mot de passe</label>

            <div className="input-wrapper">
              <Lock size={18} />

              <input
                type={showConfirm ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirmez votre mot de passe"
                value={form.confirmPassword}
                onChange={handleChange}
              />

              <button
                type="button"
                className="password-button"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Création du compte..." : "Créer mon coffre-fort"}

            {!loading && <ArrowRight size={19} />}
          </button>
        </form>

        <div className="auth-footer">
          <span>Vous avez déjà un compte ?</span>

          <Link to="/login">Se connecter</Link>
        </div>
      </div>
    </main>
  );
}

export default Register;
