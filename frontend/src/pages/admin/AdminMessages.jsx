import { useEffect, useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiCheck,
  FiCheckCircle,
  FiCopy,
  FiMail,
  FiMessageSquare,
  FiSearch,
  FiTrash2,
  FiUser,
  FiX,
  FiSend,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { supabase } from "../../services/supabase";
import "./AdminMessages.css";

function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);

  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // CHARGER LES MESSAGES
  // ==========================================

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .eq("deleted_by_admin", false)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setMessages(data || []);
    } catch (err) {
      console.error("Erreur chargement messages :", err);
      setError("Impossible de charger les messages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  // ==========================================
  // RECHERCHE
  // ==========================================

  const filteredMessages = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) {
      return messages;
    }

    return messages.filter((message) => {
      return [
        message.name,
        message.email,
        message.subject,
        message.message,
        message.admin_reply,
      ]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(value));
    });
  }, [messages, search]);

  // ==========================================
  // MARQUER COMME LU
  // ==========================================

  const markAsRead = async (message) => {
    if (!message || message.status === "read") {
      return;
    }

    try {
      setError("");

      const { error } = await supabase
        .from("contact_messages")
        .update({
          status: "read",
        })
        .eq("id", message.id)
        .eq("deleted_by_admin", false);

      if (error) {
        throw error;
      }

      setMessages((current) =>
        current.map((item) =>
          item.id === message.id
            ? {
                ...item,
                status: "read",
              }
            : item,
        ),
      );

      setSelectedMessage((current) =>
        current?.id === message.id
          ? {
              ...current,
              status: "read",
            }
          : current,
      );
    } catch (err) {
      console.error("Erreur marquage message :", err);
      setError("Impossible de marquer le message comme lu.");
    }
  };

  // ==========================================
  // OUVRIR UN MESSAGE
  // ==========================================

  const openMessage = async (message) => {
    setSelectedMessage(message);

    // Si une réponse existe, elle est chargée
    // dans la zone de modification de l'ADMIN.
    setReply(
      message.admin_reply && !message.reply_deleted_by_admin
        ? message.admin_reply
        : "",
    );

    setError("");
    setSuccess("");

    await markAsRead(message);
  };

  // ==========================================
  // ENVOYER / MODIFIER LA RÉPONSE
  // ADMIN UNIQUEMENT
  // ==========================================

  const sendReply = async () => {
    if (!selectedMessage) {
      return;
    }

    const text = reply.trim();

    if (!text) {
      setError("Veuillez écrire une réponse.");
      return;
    }

    try {
      setReplying(true);
      setError("");
      setSuccess("");

      const { data, error } = await supabase
        .from("contact_messages")
        .update({
          admin_reply: text,
          replied_at: new Date().toISOString(),

          // La réponse redevient visible pour l'admin
          reply_deleted_by_admin: false,

          status: "read",
        })
        .eq("id", selectedMessage.id)
        .eq("deleted_by_admin", false)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setMessages((current) =>
        current.map((message) =>
          message.id === selectedMessage.id ? data : message,
        ),
      );

      setSelectedMessage(data);
      setReply(data.admin_reply || "");

      setSuccess(
        data.admin_reply
          ? "La réponse a été enregistrée avec succès."
          : "La réponse a été envoyée avec succès.",
      );

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Erreur réponse :", err);
      setError("Impossible d'envoyer la réponse.");
    } finally {
      setReplying(false);
    }
  };

  // ==========================================
  // SUPPRIMER LA CONVERSATION POUR L'ADMIN
  // ==========================================

  const deleteMessage = async (id) => {
    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer cette conversation de votre espace administrateur ?\n\nElle restera disponible pour l'utilisateur.",
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");
      setSuccess("");

      const { error } = await supabase
        .from("contact_messages")
        .update({
          deleted_by_admin: true,
        })
        .eq("id", id);

      if (error) {
        throw error;
      }

      setMessages((current) => current.filter((message) => message.id !== id));

      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
        setReply("");
      }

      setSuccess(
        "La conversation a été supprimée de votre espace administrateur. Elle reste disponible pour l'utilisateur.",
      );

      setTimeout(() => {
        setSuccess("");
      }, 3500);
    } catch (err) {
      console.error("Erreur suppression message :", err);
      setError("Impossible de supprimer le message.");
    } finally {
      setDeletingId(null);
    }
  };

  // ==========================================
  // SUPPRIMER UNIQUEMENT LA RÉPONSE POUR L'ADMIN
  // ==========================================

  const deleteAdminReply = async (messageId) => {
    const confirmed = window.confirm(
      "Voulez-vous supprimer cette réponse de votre espace administrateur ?\n\nLa réponse restera disponible pour l'utilisateur.",
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(messageId);
      setError("");
      setSuccess("");

      const { data, error } = await supabase
        .from("contact_messages")
        .update({
          reply_deleted_by_admin: true,
        })
        .eq("id", messageId)
        .eq("deleted_by_admin", false)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setMessages((current) =>
        current.map((message) => (message.id === messageId ? data : message)),
      );

      setSelectedMessage((current) =>
        current?.id === messageId ? data : current,
      );

      setReply("");

      setSuccess(
        "La réponse a été supprimée de votre espace administrateur. Elle reste disponible pour l'utilisateur.",
      );

      setTimeout(() => {
        setSuccess("");
      }, 3500);
    } catch (err) {
      console.error("Erreur suppression réponse :", err);
      setError("Impossible de supprimer la réponse.");
    } finally {
      setDeletingId(null);
    }
  };

  // ==========================================
  // COPIER TEXTE
  // ==========================================

  const copyText = async (text, message) => {
    try {
      await navigator.clipboard.writeText(text);

      setSuccess(message);

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err) {
      console.error("Erreur copie :", err);
      setError("Impossible de copier le texte.");
    }
  };

  // ==========================================
  // FERMER MODAL
  // ==========================================

  const closeModal = () => {
    setSelectedMessage(null);
    setReply("");
    setError("");
    setSuccess("");
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ==========================================
  // NOMBRE NON LUS
  // ==========================================

  const unreadCount = messages.filter(
    (message) => message.status !== "read",
  ).length;

  // ==========================================
  // RÉPONSE VISIBLE POUR L'ADMIN
  // ==========================================

  const hasAdminReply =
    selectedMessage?.admin_reply && !selectedMessage?.reply_deleted_by_admin;

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="admin-messages-page">
      {/* =====================================
          HEADER
      ===================================== */}

      <header className="admin-messages-header">
        <div className="admin-messages-header-left">
          <div className="admin-messages-title">
            <div className="admin-messages-title-icon">
              <FiMessageSquare />
            </div>

            <div>
              <h1>Messages</h1>

              <p>Messages reçus depuis la page contact</p>
            </div>
          </div>
        </div>

        <div className="admin-messages-counter">
          <FiMail />

          <span>{unreadCount}</span>

          <small>non lu{unreadCount > 1 ? "s" : ""}</small>
        </div>
      </header>

      {/* =====================================
          CONTENU
      ===================================== */}

      <main className="admin-messages-container">
        {/* TOOLBAR */}

        <div className="admin-messages-toolbar">
          <Link to="/admin" className="admin-messages-back">
            <FiArrowLeft />
            Dashboard
          </Link>

          <div className="admin-messages-search">
            <FiSearch />

            <input
              type="text"
              placeholder="Rechercher un message..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="admin-messages-total">
            {filteredMessages.length} message
            {filteredMessages.length > 1 ? "s" : ""}
          </div>
        </div>

        {/* SUCCÈS */}

        {success && (
          <div className="admin-messages-success">
            <FiCheckCircle />
            <span>{success}</span>
          </div>
        )}

        {/* ERREUR */}

        {error && <div className="admin-messages-error">{error}</div>}

        {/* CHARGEMENT */}

        {loading ? (
          <div className="admin-messages-loading">
            <FiMail />

            <p>Chargement des messages...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="admin-messages-empty">
            <FiMessageSquare />

            <h2>Aucun message</h2>

            <p>Aucun message ne correspond à votre recherche.</p>
          </div>
        ) : (
          <div className="admin-messages-table-wrapper">
            <table className="admin-messages-table">
              <thead>
                <tr>
                  <th>État</th>
                  <th>Expéditeur</th>
                  <th>Sujet</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredMessages.map((message) => (
                  <tr
                    key={message.id}
                    className={
                      message.status !== "read" ? "message-unread" : ""
                    }
                  >
                    {/* ÉTAT */}

                    <td>
                      {message.status !== "read" ? (
                        <span className="message-status unread">Nouveau</span>
                      ) : (
                        <span className="message-status read">Lu</span>
                      )}
                    </td>

                    {/* EXPÉDITEUR */}

                    <td>
                      <div className="message-sender">
                        <div className="message-avatar">
                          <FiUser />
                        </div>

                        <div>
                          <strong>{message.name}</strong>
                          <span>{message.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* SUJET */}

                    <td>
                      <button
                        className="message-subject-button"
                        onClick={() => openMessage(message)}
                      >
                        {message.subject}
                      </button>
                    </td>

                    {/* DATE */}

                    <td className="message-date">
                      {formatDate(message.created_at)}
                    </td>

                    {/* ACTIONS */}

                    <td>
                      <div className="message-actions">
                        <button
                          className="message-action read-action"
                          title="Marquer comme lu"
                          onClick={() => markAsRead(message)}
                          disabled={message.status === "read"}
                        >
                          <FiCheckCircle />
                        </button>

                        <button
                          className="message-action delete-action"
                          title="Supprimer pour moi"
                          onClick={() => deleteMessage(message.id)}
                          disabled={deletingId === message.id}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* =====================================
          MODAL CONVERSATION
      ===================================== */}

      {selectedMessage && (
        <div className="admin-message-modal-overlay" onClick={closeModal}>
          <div
            className="admin-message-modal"
            onClick={(event) => event.stopPropagation()}
          >
            {/* MODAL HEADER */}

            <div className="admin-message-modal-header">
              <div>
                <span className="admin-message-modal-label">Conversation</span>

                <h2>{selectedMessage.subject}</h2>
              </div>

              <button className="admin-message-close" onClick={closeModal}>
                <FiX />
              </button>
            </div>

            {/* SUCCÈS */}

            {success && (
              <div className="admin-messages-success">
                <FiCheckCircle />
                <span>{success}</span>
              </div>
            )}

            {/* ERREUR */}

            {error && <div className="admin-messages-error">{error}</div>}

            {/* INFORMATIONS */}

            <div className="admin-message-modal-info">
              <div>
                <FiUser />

                <div>
                  <strong>{selectedMessage.name}</strong>

                  <span>{selectedMessage.email}</span>
                </div>
              </div>

              <div>
                <FiMessageSquare />

                <span>{formatDate(selectedMessage.created_at)}</span>
              </div>
            </div>

            {/* =================================
                CONVERSATION
            ================================= */}

            <div className="admin-conversation">
              {/* MESSAGE UTILISATEUR */}

              <div className="conversation-message user-message">
                <div className="conversation-avatar">
                  <FiUser />
                </div>

                <div className="conversation-bubble">
                  <div className="conversation-bubble-header">
                    <strong>{selectedMessage.name}</strong>

                    <span>{formatDate(selectedMessage.created_at)}</span>
                  </div>

                  <h3>{selectedMessage.subject}</h3>

                  <p>{selectedMessage.message}</p>
                </div>
              </div>

              {/* =================================
                  RÉPONSE ADMIN
              ================================= */}

              {hasAdminReply && (
                <div className="conversation-message admin-message">
                  <div className="conversation-avatar admin-avatar">
                    <FiMessageSquare />
                  </div>

                  <div className="conversation-bubble">
                    <div className="conversation-bubble-header">
                      <strong>Administrateur</strong>

                      <span>
                        {selectedMessage.replied_at &&
                          formatDate(selectedMessage.replied_at)}
                      </span>
                    </div>

                    <p>{selectedMessage.admin_reply}</p>

                    {/* ACTIONS DE LA RÉPONSE ADMIN */}

                    <div className="admin-reply-actions">
                      <button
                        type="button"
                        onClick={() =>
                          copyText(
                            selectedMessage.admin_reply,
                            "La réponse a été copiée.",
                          )
                        }
                        title="Copier la réponse"
                      >
                        <FiCopy />
                        Copier
                      </button>

                      <button
                        type="button"
                        className="admin-reply-delete"
                        onClick={() => deleteAdminReply(selectedMessage.id)}
                        disabled={deletingId === selectedMessage.id}
                        title="Supprimer pour moi"
                      >
                        <FiTrash2 />
                        Supprimer pour moi
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* =================================
                ZONE DE RÉPONSE ADMIN
            ================================= */}

            <div className="admin-message-reply-section">
              <div className="admin-reply-title">
                <FiSend />

                <div>
                  <h3>
                    {hasAdminReply
                      ? "Modifier la réponse"
                      : "Répondre à l'utilisateur"}
                  </h3>

                  <p>Seul l'administrateur peut répondre à ce message.</p>
                </div>
              </div>

              <textarea
                value={reply}
                onChange={(event) => {
                  setReply(event.target.value);
                  setError("");
                  setSuccess("");
                }}
                placeholder="Écrivez votre réponse à l'utilisateur..."
                rows="5"
              />

              <button
                className="admin-message-send-reply"
                onClick={sendReply}
                disabled={replying}
              >
                {replying ? (
                  <>
                    <span className="reply-spinner" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <FiSend />

                    {hasAdminReply
                      ? "Modifier la réponse"
                      : "Envoyer la réponse"}
                  </>
                )}
              </button>
            </div>

            {/* =================================
                ACTIONS MODAL
            ================================= */}

            <div className="admin-message-modal-actions">
              <button
                className="admin-message-read-button"
                onClick={() => markAsRead(selectedMessage)}
              >
                <FiCheck />
                Marquer comme lu
              </button>

              <button
                className="admin-message-delete-button"
                onClick={() => deleteMessage(selectedMessage.id)}
                disabled={deletingId === selectedMessage.id}
              >
                <FiTrash2 />
                Supprimer pour moi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminMessages;
