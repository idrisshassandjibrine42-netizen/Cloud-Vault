import { useEffect, useState } from "react";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiMail,
  FiMessageCircle,
  FiRefreshCw,
  FiTrash2,
  FiUser,
  FiX,
} from "react-icons/fi";
import { Link } from "react-router-dom";

import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";

import "./Messages.css";

function Messages() {
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [message, setMessage] = useState("");
  const [deleting, setDeleting] = useState(false);

  /* =====================================================
     CHARGER LES MESSAGES
  ===================================================== */

  const loadMessages = async (showRefresh = false) => {
    if (!user) return;

    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const { data, error } = await supabase
      .from("contact_messages")
      .select(
        `
        id,
        name,
        email,
        subject,
        message,
        status,
        admin_reply,
        replied_at,
        created_at,
        deleted_by_user,
        reply_deleted_by_user
        `,
      )
      .eq("user_id", user.id)
      .eq("deleted_by_user", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur chargement messages :", error);
      setMessage("Impossible de charger vos messages.");
      setMessages([]);
    } else {
      setMessages(data || []);
      setMessage("");
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadMessages();
  }, [user]);

  /* =====================================================
     FORMATAGE
  ===================================================== */

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatus = (item) => {
    if (item.admin_reply && !item.reply_deleted_by_user) {
      return {
        label: "Répondu",
        className: "status-replied",
        icon: <FiCheckCircle />,
      };
    }

    return {
      label: "En attente",
      className: "status-pending",
      icon: <FiClock />,
    };
  };

  /* =====================================================
     OUVRIR UN MESSAGE
  ===================================================== */

  const openMessage = (item) => {
    setSelectedMessage(item);
  };

  /* =====================================================
     FERMER LE MESSAGE
  ===================================================== */

  const closeMessage = () => {
    setSelectedMessage(null);
  };

  /* =====================================================
     SUPPRIMER LA CONVERSATION CÔTÉ UTILISATEUR
  ===================================================== */

  const handleDeleteMessage = async (id) => {
    const confirmDelete = window.confirm(
      "Voulez-vous supprimer cette conversation de vos messages ?",
    );

    if (!confirmDelete) return;

    setDeleting(true);

    const { error } = await supabase
      .from("contact_messages")
      .update({
        deleted_by_user: true,
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erreur suppression :", error);
      setMessage("Impossible de supprimer cette conversation.");
      setDeleting(false);
      return;
    }

    setMessages((prev) => prev.filter((item) => item.id !== id));

    if (selectedMessage?.id === id) {
      setSelectedMessage(null);
    }

    setMessage("Conversation supprimée de vos messages.");
    setDeleting(false);
  };

  /* =====================================================
     MASQUER LA RÉPONSE ADMIN CÔTÉ UTILISATEUR
  ===================================================== */

  const handleDeleteReply = async (id) => {
    const confirmDelete = window.confirm(
      "Voulez-vous masquer la réponse de l'administrateur ?",
    );

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("contact_messages")
      .update({
        reply_deleted_by_user: true,
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erreur suppression réponse :", error);
      setMessage("Impossible de masquer la réponse.");
      return;
    }

    setMessages((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              reply_deleted_by_user: true,
            }
          : item,
      ),
    );

    setSelectedMessage((prev) =>
      prev
        ? {
            ...prev,
            reply_deleted_by_user: true,
          }
        : prev,
    );

    setMessage("Réponse masquée.");
  };

  /* =====================================================
     RAFRAÎCHIR
  ===================================================== */

  const handleRefresh = () => {
    loadMessages(true);
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="messages-page">
        <div className="messages-container">
          <div className="messages-loading">
            <FiRefreshCw className="loading-icon" />
            <p>Chargement de vos messages...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-page">
      <div className="messages-container">
        {/* =================================================
            HEADER
        ================================================= */}

        <header className="messages-header">
          <Link to="/dashboard" className="messages-back">
            <FiArrowLeft />
            <span>Retour au dashboard</span>
          </Link>

          <div className="messages-title">
            <div className="messages-title-icon">
              <FiMessageCircle />
            </div>

            <div>
              <h1>Mes messages</h1>
              <p>Consultez vos échanges avec le support</p>
            </div>
          </div>

          <button
            type="button"
            className="messages-refresh"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Actualiser"
          >
            <FiRefreshCw className={refreshing ? "spin" : ""} />
            <span>Actualiser</span>
          </button>
        </header>

        {/* =================================================
            MESSAGE NOTIFICATION
        ================================================= */}

        {message && (
          <div className="messages-alert">
            <span>{message}</span>

            <button
              type="button"
              onClick={() => setMessage("")}
              aria-label="Fermer"
            >
              <FiX />
            </button>
          </div>
        )}

        {/* =================================================
            STATISTIQUES
        ================================================= */}

        <div className="messages-stats">
          <div className="message-stat-card">
            <div className="stat-icon">
              <FiMessageCircle />
            </div>

            <div>
              <strong>{messages.length}</strong>
              <span>Conversation{messages.length > 1 ? "s" : ""}</span>
            </div>
          </div>

          <div className="message-stat-card">
            <div className="stat-icon">
              <FiCheckCircle />
            </div>

            <div>
              <strong>
                {
                  messages.filter(
                    (item) => item.admin_reply && !item.reply_deleted_by_user,
                  ).length
                }
              </strong>
              <span>Réponse{messages.length > 1 ? "s" : ""}</span>
            </div>
          </div>

          <div className="message-stat-card">
            <div className="stat-icon">
              <FiClock />
            </div>

            <div>
              <strong>
                {
                  messages.filter(
                    (item) => !item.admin_reply || item.reply_deleted_by_user,
                  ).length
                }
              </strong>
              <span>En attente</span>
            </div>
          </div>
        </div>

        {/* =================================================
            LISTE DES MESSAGES
        ================================================= */}

        {messages.length === 0 ? (
          <div className="messages-empty">
            <div className="empty-icon">
              <FiMail />
            </div>

            <h2>Aucun message</h2>

            <p>Vous n'avez encore envoyé aucun message au support.</p>

            <Link to="/contact" className="empty-button">
              Contacter le support
            </Link>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((item) => {
              const status = getStatus(item);

              return (
                <article className="message-card" key={item.id}>
                  {/* CARD HEADER */}

                  <div className="message-card-header">
                    <div className="message-card-info">
                      <div className="message-subject-icon">
                        <FiMessageCircle />
                      </div>

                      <div>
                        <h2>{item.subject}</h2>

                        <p>Envoyé le {formatDate(item.created_at)}</p>
                      </div>
                    </div>

                    <div className={`message-status ${status.className}`}>
                      {status.icon}
                      <span>{status.label}</span>
                    </div>
                  </div>

                  {/* MESSAGE PREVIEW */}

                  <div className="message-preview">
                    <div className="preview-label">Votre message</div>

                    <p>{item.message}</p>
                  </div>

                  {/* ADMIN RESPONSE */}

                  {item.admin_reply && !item.reply_deleted_by_user && (
                    <div className="admin-reply-preview">
                      <div className="admin-reply-top">
                        <div className="admin-reply-label">
                          <FiCheckCircle />
                          Réponse du support
                        </div>

                        <span>
                          {item.replied_at ? formatDate(item.replied_at) : ""}
                        </span>
                      </div>

                      <p>{item.admin_reply}</p>
                    </div>
                  )}

                  {/* CARD FOOTER */}

                  <div className="message-card-footer">
                    <button
                      type="button"
                      className="message-open-button"
                      onClick={() => openMessage(item)}
                    >
                      <FiMessageCircle />
                      Voir la conversation
                    </button>

                    <button
                      type="button"
                      className="message-delete-button"
                      onClick={() => handleDeleteMessage(item.id)}
                      disabled={deleting}
                      title="Supprimer la conversation"
                    >
                      <FiTrash2 />
                      <span>Supprimer</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* ===================================================
          MODAL CONVERSATION
      =================================================== */}

      {selectedMessage && (
        <div className="message-modal-overlay" onClick={closeMessage}>
          <div
            className="message-modal"
            onClick={(event) => event.stopPropagation()}
          >
            {/* MODAL HEADER */}

            <div className="message-modal-header">
              <div>
                <span className="modal-small-title">Conversation</span>

                <h2>{selectedMessage.subject}</h2>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeMessage}
                aria-label="Fermer"
              >
                <FiX />
              </button>
            </div>

            {/* MODAL CONTENT */}

            <div className="message-conversation">
              {/* USER MESSAGE */}

              <div className="conversation-block user-block">
                <div className="conversation-author">
                  <div className="author-icon user-icon">
                    <FiUser />
                  </div>

                  <div>
                    <strong>Vous</strong>

                    <span>{formatDate(selectedMessage.created_at)}</span>
                  </div>
                </div>

                <div className="conversation-content user-content">
                  <p>{selectedMessage.message}</p>
                </div>
              </div>

              {/* ADMIN RESPONSE */}

              {selectedMessage.admin_reply &&
              !selectedMessage.reply_deleted_by_user ? (
                <div className="conversation-block admin-block">
                  <div className="conversation-author">
                    <div className="author-icon admin-icon">
                      <FiMessageCircle />
                    </div>

                    <div>
                      <strong>Support Cloud Vault</strong>

                      <span>
                        {selectedMessage.replied_at
                          ? formatDate(selectedMessage.replied_at)
                          : ""}
                      </span>
                    </div>
                  </div>

                  <div className="conversation-content admin-content">
                    <p>{selectedMessage.admin_reply}</p>
                  </div>

                  <button
                    type="button"
                    className="hide-reply-button"
                    onClick={() => handleDeleteReply(selectedMessage.id)}
                  >
                    <FiTrash2 />
                    Masquer cette réponse
                  </button>
                </div>
              ) : (
                <div className="no-reply">
                  <FiClock />

                  <div>
                    <strong>En attente de réponse</strong>

                    <p>
                      L'administrateur n'a pas encore répondu à votre message.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}

            <div className="message-modal-footer">
              <button
                type="button"
                className="modal-delete-button"
                onClick={() => handleDeleteMessage(selectedMessage.id)}
              >
                <FiTrash2 />
                Supprimer la conversation
              </button>

              <button
                type="button"
                className="modal-close-button"
                onClick={closeMessage}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Messages;
