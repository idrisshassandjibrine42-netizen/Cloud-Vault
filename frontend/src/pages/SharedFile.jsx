import { useEffect, useState } from "react";
import {
  FiArrowLeft,
  FiCopy,
  FiTrash2,
  FiFile,
  FiShare2,
  FiClock,
} from "react-icons/fi";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";
import "./SharedFile.css";
import { Link } from "react-router-dom";

function SharedFiles() {
  const { user } = useAuth();

  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // ========================================
  // CHARGER LES PARTAGES
  // ========================================
  const loadShares = async () => {
    if (!user) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("shares")
      .select(
        `
        id,
        token,
        expires_at,
        created_at,
        files (
          id,
          name,
          original_name,
          size,
          file_type,
          is_deleted
        )
      `,
      )
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur chargement partages :", error);
      setMessage("Impossible de charger les partages.");
    } else {
      setShares(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadShares();
  }, [user]);

  // ========================================
  // MESSAGE TEMPORAIRE
  // ========================================
  const showMessage = (text) => {
    setMessage(text);

    setTimeout(() => {
      setMessage("");
    }, 2500);
  };

  // ========================================
  // COPIER LE LIEN
  // ========================================
  const copyShareLink = async (token) => {
    const url = `${window.location.origin}/share/${token}`;

    try {
      await navigator.clipboard.writeText(url);
      showMessage("Lien copié avec succès.");
    } catch (error) {
      console.error("Erreur copie :", error);
      showMessage("Impossible de copier le lien.");
    }
  };

  // ========================================
  // SUPPRIMER LE PARTAGE
  // ========================================
  const deleteShare = async (shareId) => {
    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer ce partage ?",
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("shares")
      .delete()
      .eq("id", shareId)
      .eq("owner_id", user.id);

    if (error) {
      console.error("Erreur suppression partage :", error);
      showMessage("Impossible de supprimer le partage.");
      return;
    }

    setShares((current) => current.filter((share) => share.id !== shareId));

    showMessage("Partage supprimé.");
  };

  // ========================================
  // TAILLE DU FICHIER
  // ========================================
  const formatSize = (bytes) => {
    if (!bytes) return "0 B";

    const units = ["B", "KB", "MB", "GB"];

    const index = Math.min(
      Math.floor(Math.log(bytes) / Math.log(1024)),
      units.length - 1,
    );

    return `${(bytes / Math.pow(1024, index)).toFixed(1)} ${units[index]}`;
  };

  // ========================================
  // DATE
  // ========================================
  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ========================================
  // VÉRIFIER EXPIRATION
  // ========================================
  const isExpired = (expiresAt) => {
    if (!expiresAt) return false;

    return new Date(expiresAt) <= new Date();
  };

  // ========================================
  // TEXTE EXPIRATION
  // ========================================
  const getExpirationText = (expiresAt) => {
    if (!expiresAt) {
      return "Aucune expiration";
    }

    if (isExpired(expiresAt)) {
      return "Lien expiré";
    }

    return `Expire le ${formatDate(expiresAt)}`;
  };

  return (
    <div className="shared-files-page">
      {/* ========================================
          TOP BAR
      ======================================== */}
      <div className="shared-topbar">
        <Link to="/dashboard" className="shared-back-button">
          <FiArrowLeft />
          <span>Retour au dashboard</span>
        </Link>
      </div>

      {/* ========================================
          TITRE
      ======================================== */}
      <div className="shared-title-section">
        <div className="shared-title-icon">
          <FiShare2 />
        </div>

        <div>
          <h1>Mes partages</h1>

          <p>Gérez les liens de partage de vos fichiers.</p>
        </div>
      </div>

      {/* ========================================
          MESSAGE
      ======================================== */}
      {message && <div className="shared-files-message">{message}</div>}

      {/* ========================================
          CONTENU
      ======================================== */}

      {loading ? (
        <div className="shared-files-empty">
          <FiClock size={40} />

          <h2>Chargement...</h2>

          <p>Chargement de vos fichiers partagés.</p>
        </div>
      ) : shares.length === 0 ? (
        <div className="shared-files-empty">
          <div className="empty-share-icon">
            <FiShare2 />
          </div>

          <h2>Aucun fichier partagé</h2>

          <p>Les fichiers que vous partagez apparaîtront ici.</p>
        </div>
      ) : (
        <div className="shared-files-list">
          {shares.map((share) => {
            const file = share.files;

            if (!file) return null;

            const expired = isExpired(share.expires_at);

            return (
              <div
                className={`shared-file-card ${
                  expired ? "shared-file-expired" : ""
                }`}
                key={share.id}
              >
                {/* ========================================
                    FICHIER
                ======================================== */}

                <div className="shared-file-main">
                  <div className="shared-file-icon">
                    <FiFile />
                  </div>

                  <div className="shared-file-info">
                    <h3 title={file.name}>{file.name}</h3>

                    <div className="shared-file-meta">
                      <span>{formatSize(file.size)}</span>

                      <span className="meta-separator">•</span>

                      <span>Partagé le {formatDate(share.created_at)}</span>
                    </div>

                    <div
                      className={`shared-file-expiration ${
                        expired ? "expired" : ""
                      }`}
                    >
                      <FiClock />

                      <span>{getExpirationText(share.expires_at)}</span>
                    </div>
                  </div>
                </div>

                {/* ========================================
                    ACTIONS
                ======================================== */}

                <div className="shared-file-actions">
                  <button
                    className="copy-share-button"
                    onClick={() => copyShareLink(share.token)}
                    title="Copier le lien"
                  >
                    <FiCopy />
                    <span>Copier le lien</span>
                  </button>

                  <button
                    className="shared-delete-button"
                    onClick={() => deleteShare(share.id)}
                    title="Supprimer le partage"
                  >
                    <FiTrash2 />
                    <span>Supprimer</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SharedFiles;
