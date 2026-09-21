import { useEffect, useState } from "react";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiMail,
  FiMessageSquare,
  FiSend,
  FiUser,
} from "react-icons/fi";
import { Link } from "react-router-dom";

import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";

import "./Contact.css";

function Contact() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // ============================================================
  // INITIALISER LE FORMULAIRE
  // ============================================================

  useEffect(() => {
    if (!user) return;

    setForm((current) => ({
      ...current,
      name: user.user_metadata?.full_name || current.name || "",
      email: user.email || current.email || "",
    }));
  }, [user]);

  // ============================================================
  // MODIFICATION DU FORMULAIRE
  // ============================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // ============================================================
  // ENVOYER LE MESSAGE
  // ============================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!user) {
      setError("Vous devez être connecté pour envoyer un message.");
      return;
    }

    const name = form.name.trim();
    const email = form.email.trim();
    const subject = form.subject.trim();
    const message = form.message.trim();

    if (!name || !email || !subject || !message) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    if (message.length < 10) {
      setError("Votre message doit contenir au moins 10 caractères.");
      return;
    }

    try {
      setSending(true);

      const { error: insertError } = await supabase
        .from("contact_messages")
        .insert({
          user_id: user.id,
          name,
          email,
          subject,
          message,

          status: "unread",

          deleted_by_user: false,
          deleted_by_admin: false,

          reply_deleted_by_user: false,
          reply_deleted_by_admin: false,
        });

      if (insertError) {
        throw insertError;
      }

      setSuccess("Votre message a été envoyé avec succès.");

      setForm({
        name: user.user_metadata?.full_name || "",
        email: user.email || "",
        subject: "",
        message: "",
      });

      window.setTimeout(() => {
        setSuccess("");
      }, 4000);
    } catch (err) {
      console.error("Erreur envoi message :", err);

      setError("Impossible d'envoyer votre message. Veuillez réessayer.");
    } finally {
      setSending(false);
    }
  };

  // ============================================================
  // UTILISATEUR NON CONNECTÉ
  // ============================================================

  if (!user) {
    return (
      <div className="contact-page">
        <div className="contact-auth-required">
          <FiMessageSquare />

          <h2>Connexion requise</h2>

          <p>Vous devez être connecté pour contacter l'administration.</p>

          <Link to="/login" className="contact-submit-button">
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  // ============================================================
  // PAGE CONTACT
  // ============================================================

  return (
    <div className="contact-page">
      {/* ========================================================
          HEADER
      ======================================================== */}

      <header className="contact-header">
        {/* BOUTON RETOUR */}

        <Link to="/dashboard" className="contact-back-button">
          <FiArrowLeft />
          <span>Retour au tableau de bord</span>
        </Link>

        {/* TITRE */}

        <div className="contact-title">
          <div className="contact-title-icon">
            <FiMessageSquare />
          </div>

          <div>
            <h1>Contactez-nous</h1>

            <p>
              Une question ou un problème ? Notre équipe est là pour vous aider.
            </p>
          </div>
        </div>
      </header>

      {/* ========================================================
          CONTENU PRINCIPAL
      ======================================================== */}

      <main className="contact-container">
        <section className="contact-top-section">
          {/* ====================================================
              CARTE SUPPORT
          ==================================================== */}

          <div className="contact-info">
            <div className="contact-info-icon">
              <FiMessageSquare />
            </div>

            <span className="contact-info-label">SUPPORT CLOUD VAULT</span>

            <h2>Besoin d'aide ?</h2>

            <p className="contact-info-description">
              Notre équipe est disponible pour répondre à vos questions
              concernant votre espace Cloud Vault.
            </p>

            {/* EMAIL */}

            <div className="contact-info-item">
              <div className="contact-info-item-icon">
                <FiMail />
              </div>

              <div>
                <strong>Email</strong>

                <span>support@cloudvault.com</span>
              </div>
            </div>

            {/* SUPPORT */}

            <div className="contact-info-item">
              <div className="contact-info-item-icon">
                <FiClock />
              </div>

              <div>
                <strong>Support</strong>

                <span>Nous vous répondrons dans les meilleurs délais.</span>
              </div>
            </div>

            {/* UTILISATEUR CONNECTÉ */}

            <div className="contact-connected">
              <FiCheckCircle />

              <span>Vous êtes connecté à votre compte</span>
            </div>

            {/* MESSAGES */}

            <Link to="/messages" className="contact-messages-link">
              <FiMessageSquare />

              <span>Consulter mes messages</span>
            </Link>
          </div>

          {/* ====================================================
              FORMULAIRE
          ==================================================== */}

          <div className="contact-form-card">
            {/* HEADER FORMULAIRE */}

            <div className="contact-form-header">
              <div className="contact-form-icon">
                <FiSend />
              </div>

              <div>
                <h2>Envoyer un message</h2>

                <p>Décrivez votre problème ou votre demande.</p>
              </div>
            </div>

            {/* SUCCÈS */}

            {success && (
              <div className="contact-success">
                <FiCheckCircle />
                <span>{success}</span>
              </div>
            )}

            {/* ERREUR */}

            {error && (
              <div className="contact-error">
                <span>{error}</span>
              </div>
            )}

            {/* FORMULAIRE */}

            <form onSubmit={handleSubmit} className="contact-form">
              {/* NOM + EMAIL */}

              <div className="contact-form-row">
                {/* NOM */}

                <div className="contact-field">
                  <label htmlFor="name">Nom</label>

                  <div className="contact-input-wrapper">
                    <FiUser />

                    <input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Votre nom"
                      value={form.name}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* EMAIL */}

                <div className="contact-field">
                  <label htmlFor="email">E-mail</label>

                  <div className="contact-input-wrapper">
                    <FiMail />

                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={form.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* SUJET */}

              <div className="contact-field">
                <label htmlFor="subject">Sujet</label>

                <input
                  id="subject"
                  name="subject"
                  type="text"
                  placeholder="Sujet de votre message"
                  value={form.subject}
                  onChange={handleChange}
                />
              </div>

              {/* MESSAGE */}

              <div className="contact-field">
                <div className="contact-label-row">
                  <label htmlFor="message">Message</label>

                  <span>{form.message.length} caractères</span>
                </div>

                <textarea
                  id="message"
                  name="message"
                  rows="8"
                  placeholder="Écrivez votre message..."
                  value={form.message}
                  onChange={handleChange}
                />
              </div>

              {/* BOUTON ENVOYER */}

              <button
                type="submit"
                className="contact-submit-button"
                disabled={sending}
              >
                {sending ? (
                  <>
                    <span className="contact-spinner" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <FiSend />
                    Envoyer le message
                  </>
                )}
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Contact;
