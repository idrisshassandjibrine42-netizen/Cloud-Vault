import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiDownload,
  FiFile,
  FiFileText,
  FiImage,
  FiMusic,
  FiRefreshCw,
  FiShare2,
  FiTrash2,
  FiVideo,
  FiMoreVertical,
  FiX,
} from "react-icons/fi";

import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";

import "./Trash.css";

// ======================================================
// FORMAT TAILLE
// ======================================================

const formatSize = (bytes) => {
  if (!bytes) return "0 B";

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

// ======================================================
// DATE
// ======================================================

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// ======================================================
// CATÉGORIE
// ======================================================

const getFileCategory = (file) => {
  const mime = (file.mime_type || file.file_type || "").toLowerCase();

  const name = (file.name || file.original_name || "").toLowerCase();

  if (mime.startsWith("image/")) {
    return "images";
  }

  if (mime.startsWith("video/")) {
    return "videos";
  }

  if (mime.startsWith("audio/")) {
    return "audio";
  }

  if (
    mime.includes("pdf") ||
    mime.includes("word") ||
    mime.includes("document") ||
    mime.includes("spreadsheet") ||
    mime.includes("excel") ||
    mime.includes("text") ||
    mime.includes("csv") ||
    mime.includes("presentation") ||
    mime.includes("powerpoint") ||
    name.endsWith(".pdf") ||
    name.endsWith(".doc") ||
    name.endsWith(".docx") ||
    name.endsWith(".xls") ||
    name.endsWith(".xlsx") ||
    name.endsWith(".txt") ||
    name.endsWith(".csv") ||
    name.endsWith(".ppt") ||
    name.endsWith(".pptx")
  ) {
    return "documents";
  }

  return "other";
};

// ======================================================
// ICÔNE
// ======================================================

const getFileIcon = (file) => {
  const category = getFileCategory(file);

  switch (category) {
    case "images":
      return <FiImage />;

    case "videos":
      return <FiVideo />;

    case "audio":
      return <FiMusic />;

    case "documents":
      return <FiFileText />;

    default:
      return <FiFile />;
  }
};

// ======================================================
// NOM CATÉGORIE
// ======================================================

const getCategoryLabel = (file) => {
  const category = getFileCategory(file);

  switch (category) {
    case "images":
      return "Image";

    case "videos":
      return "Vidéo";

    case "audio":
      return "Audio";

    case "documents":
      return "Document";

    default:
      return "Autre";
  }
};

// ======================================================
// TRASH
// ======================================================

export default function Trash() {
  const { user } = useAuth();

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [openMenu, setOpenMenu] = useState(null);

  // ====================================================
  // CHARGER LA CORBEILLE
  // ====================================================

  const loadTrash = async () => {
    if (!user) {
      setFiles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const { data, error } = await supabase
        .from("files")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_deleted", true)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setFiles(data || []);
    } catch (error) {
      console.error("Erreur chargement corbeille :", error);

      setMessage(error.message || "Impossible de charger la corbeille.");
    } finally {
      setLoading(false);
    }
  };

  // ====================================================
  // CHARGEMENT
  // ====================================================

  useEffect(() => {
    loadTrash();
  }, [user]);

  // ====================================================
  // MESSAGE
  // ====================================================

  const showMessage = (text) => {
    setMessage(text);

    setTimeout(() => {
      setMessage("");
    }, 3500);
  };

  // ====================================================
  // RESTAURER
  // ====================================================

  const handleRestore = async (file) => {
    setOpenMenu(null);

    try {
      const { error } = await supabase
        .from("files")
        .update({
          is_deleted: false,
        })
        .eq("id", file.id)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      setFiles((current) => current.filter((item) => item.id !== file.id));

      showMessage(`"${file.name}" a été restauré.`);
    } catch (error) {
      console.error("Erreur restauration :", error);

      showMessage("Impossible de restaurer le fichier.");
    }
  };

  // ====================================================
  // TÉLÉCHARGER
  // ====================================================

  const handleDownload = async (file) => {
    setOpenMenu(null);

    try {
      const { data, error } = await supabase.storage
        .from("files")
        .download(file.storage_path);

      if (error) {
        throw error;
      }

      const url = URL.createObjectURL(data);

      const link = document.createElement("a");

      link.href = url;
      link.download = file.original_name || file.name || "fichier";

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur téléchargement :", error);

      showMessage("Impossible de télécharger le fichier.");
    }
  };

  // ====================================================
  // PARTAGER
  // ====================================================

  const handleShare = async (file) => {
    setOpenMenu(null);

    try {
      const { data, error } = await supabase.storage
        .from("files")
        .createSignedUrl(file.storage_path, 60 * 60);

      if (error) {
        throw error;
      }

      if (!data?.signedUrl) {
        throw new Error("Lien de partage indisponible.");
      }

      await navigator.clipboard.writeText(data.signedUrl);

      showMessage("Lien de partage copié.");
    } catch (error) {
      console.error("Erreur partage :", error);

      showMessage("Impossible de créer le lien.");
    }
  };

  // ====================================================
  // SUPPRESSION DÉFINITIVE
  // ====================================================

  const handlePermanentDelete = async (file) => {
    setOpenMenu(null);

    const confirmed = window.confirm(
      `Supprimer définitivement "${file.name}" ?\n\nCette action est irréversible.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      // Supprimer du Storage
      if (file.storage_path) {
        const { error: storageError } = await supabase.storage
          .from("files")
          .remove([file.storage_path]);

        if (storageError) {
          console.warn("Erreur Storage :", storageError);
        }
      }

      // Supprimer de la base
      const { error: deleteError } = await supabase
        .from("files")
        .delete()
        .eq("id", file.id)
        .eq("user_id", user.id);

      if (deleteError) {
        throw deleteError;
      }

      setFiles((current) => current.filter((item) => item.id !== file.id));

      showMessage("Fichier supprimé définitivement.");
    } catch (error) {
      console.error("Erreur suppression définitive :", error);

      showMessage("Impossible de supprimer définitivement le fichier.");
    }
  };

  // ====================================================
  // VIDER LA CORBEILLE
  // ====================================================

  const handleEmptyTrash = async () => {
    if (files.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      "Voulez-vous vraiment vider toute la corbeille ?\n\nTous les fichiers seront définitivement supprimés.",
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      // Supprimer du Storage
      const storagePaths = files
        .map((file) => file.storage_path)
        .filter(Boolean);

      if (storagePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("files")
          .remove(storagePaths);

        if (storageError) {
          console.warn(
            "Certains fichiers Storage n'ont pas pu être supprimés :",
            storageError,
          );
        }
      }

      // Supprimer de la base
      const { error } = await supabase
        .from("files")
        .delete()
        .eq("user_id", user.id)
        .eq("is_deleted", true);

      if (error) {
        throw error;
      }

      setFiles([]);

      showMessage("La corbeille a été vidée.");
    } catch (error) {
      console.error("Erreur vidage corbeille :", error);

      showMessage("Impossible de vider la corbeille.");
    } finally {
      setLoading(false);
    }
  };

  // ====================================================
  // UTILISATEUR NON CONNECTÉ
  // ====================================================

  if (!user) {
    return (
      <div className="trash-page">
        <div className="trash-empty">
          <div className="trash-empty-icon">
            <FiTrash2 />
          </div>

          <h2>Connexion nécessaire</h2>

          <p>Connectez-vous pour accéder à votre corbeille.</p>

          <Link to="/login" className="trash-files-link">
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  // ====================================================
  // RENDU
  // ====================================================

  return (
    <div className="trash-page" onClick={() => setOpenMenu(null)}>
      <div className="trash-container">
        {/* ============================================
            HEADER
        ============================================ */}

        <div className="trash-header">
          <div className="trash-header-left">
            <Link
              to="/dashboard"
              className="trash-back-button"
              onClick={(event) => event.stopPropagation()}
            >
              <FiArrowLeft />

              <span>Dashboard</span>
            </Link>

            <div className="trash-title">
              <h1>
                <FiTrash2 />
                <span>Corbeille</span>
              </h1>

              <p>Les fichiers supprimés sont conservés ici.</p>
            </div>
          </div>

          {files.length > 0 && (
            <button
              type="button"
              className="trash-empty-button"
              onClick={(event) => {
                event.stopPropagation();
                handleEmptyTrash();
              }}
            >
              <FiTrash2 />

              <span>Vider la corbeille</span>
            </button>
          )}
        </div>

        {/* ============================================
            MESSAGE
        ============================================ */}

        {message && (
          <div
            className="trash-message"
            onClick={(event) => event.stopPropagation()}
          >
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

        {/* ============================================
            INFORMATIONS
        ============================================ */}

        <div className="trash-info">
          <div className="trash-info-icon">
            <FiTrash2 />
          </div>

          <div className="trash-info-content">
            <strong>
              {files.length} fichier
              {files.length > 1 ? "s" : ""}
            </strong>

            <span>dans la corbeille</span>
          </div>
        </div>

        {/* ============================================
            CONTENU
        ============================================ */}

        {loading ? (
          <div className="trash-loading">
            <div className="trash-spinner"></div>

            <p>Chargement de la corbeille...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="trash-empty">
            <div className="trash-empty-icon">
              <FiTrash2 />
            </div>

            <h2>La corbeille est vide</h2>

            <p>Les fichiers que vous supprimerez apparaîtront ici.</p>

            <Link to="/dashboard/files" className="trash-files-link">
              <FiFile />
              <span>Voir mes fichiers</span>
            </Link>
          </div>
        ) : (
          <>
            {/* ========================================
                DESKTOP TABLE
            ======================================== */}

            <div className="trash-table-wrapper">
              <table className="trash-table">
                <thead>
                  <tr>
                    <th>Fichier</th>
                    <th>Type</th>
                    <th>Taille</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {files.map((file) => {
                    const category = getFileCategory(file);

                    return (
                      <tr key={file.id}>
                        <td>
                          <div className="trash-file">
                            <div className={`trash-file-icon ${category}`}>
                              {getFileIcon(file)}
                            </div>

                            <div className="trash-file-info">
                              <span title={file.name}>
                                {file.name ||
                                  file.original_name ||
                                  "Fichier sans nom"}
                              </span>

                              {file.original_name &&
                                file.original_name !== file.name && (
                                  <small>{file.original_name}</small>
                                )}
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="trash-type">
                            {getCategoryLabel(file)}
                          </span>
                        </td>

                        <td>
                          <span className="trash-size">
                            {formatSize(file.size)}
                          </span>
                        </td>

                        <td>
                          <span className="trash-date">
                            {formatDate(file.created_at)}
                          </span>
                        </td>

                        <td>
                          <div className="trash-actions">
                            <button
                              type="button"
                              className="trash-restore-button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleRestore(file);
                              }}
                              title="Restaurer"
                            >
                              <FiRefreshCw />
                            </button>

                            <div className="trash-menu-container">
                              <button
                                type="button"
                                className="trash-menu-button"
                                onClick={(event) => {
                                  event.stopPropagation();

                                  setOpenMenu(
                                    openMenu === file.id ? null : file.id,
                                  );
                                }}
                              >
                                <FiMoreVertical />
                              </button>

                              {openMenu === file.id && (
                                <div
                                  className="trash-action-menu"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleRestore(file)}
                                  >
                                    <FiRefreshCw />
                                    Restaurer
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDownload(file)}
                                  >
                                    <FiDownload />
                                    Télécharger
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleShare(file)}
                                  >
                                    <FiShare2 />
                                    Partager
                                  </button>

                                  <button
                                    type="button"
                                    className="delete-action"
                                    onClick={() => handlePermanentDelete(file)}
                                  >
                                    <FiTrash2 />
                                    Supprimer définitivement
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ========================================
                MOBILE CARDS
            ======================================== */}

            <div className="trash-mobile-list">
              {files.map((file) => {
                const category = getFileCategory(file);

                return (
                  <article
                    className="trash-mobile-card"
                    key={file.id}
                    onClick={(event) => event.stopPropagation()}
                  >
                    {/* TOP */}

                    <div className="trash-mobile-card-top">
                      <div className="trash-mobile-file">
                        <div className={`trash-mobile-file-icon ${category}`}>
                          {getFileIcon(file)}
                        </div>

                        <div className="trash-mobile-file-info">
                          <strong title={file.name}>
                            {file.name ||
                              file.original_name ||
                              "Fichier sans nom"}
                          </strong>

                          {file.original_name &&
                            file.original_name !== file.name && (
                              <small>{file.original_name}</small>
                            )}
                        </div>
                      </div>

                      <div className="trash-mobile-menu-container">
                        <button
                          type="button"
                          className="trash-mobile-menu-button"
                          onClick={(event) => {
                            event.stopPropagation();

                            setOpenMenu(openMenu === file.id ? null : file.id);
                          }}
                          aria-label="Ouvrir les actions"
                        >
                          <FiMoreVertical />
                        </button>

                        {openMenu === file.id && (
                          <div
                            className="trash-mobile-action-menu"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => handleRestore(file)}
                            >
                              <FiRefreshCw />
                              Restaurer
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDownload(file)}
                            >
                              <FiDownload />
                              Télécharger
                            </button>

                            <button
                              type="button"
                              onClick={() => handleShare(file)}
                            >
                              <FiShare2 />
                              Partager
                            </button>

                            <button
                              type="button"
                              className="delete-action"
                              onClick={() => handlePermanentDelete(file)}
                            >
                              <FiTrash2 />
                              Supprimer définitivement
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* INFOS */}

                    <div className="trash-mobile-details">
                      <div className="trash-mobile-detail">
                        <span>Type</span>
                        <strong>{getCategoryLabel(file)}</strong>
                      </div>

                      <div className="trash-mobile-detail">
                        <span>Taille</span>
                        <strong>{formatSize(file.size)}</strong>
                      </div>

                      <div className="trash-mobile-detail">
                        <span>Date</span>
                        <strong>{formatDate(file.created_at)}</strong>
                      </div>
                    </div>

                    {/* ACTIONS RAPIDES */}

                    <div className="trash-mobile-actions">
                      <button
                        type="button"
                        className="trash-mobile-restore"
                        onClick={() => handleRestore(file)}
                      >
                        <FiRefreshCw />
                        <span>Restaurer</span>
                      </button>

                      <button
                        type="button"
                        className="trash-mobile-download"
                        onClick={() => handleDownload(file)}
                      >
                        <FiDownload />
                        <span>Télécharger</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
