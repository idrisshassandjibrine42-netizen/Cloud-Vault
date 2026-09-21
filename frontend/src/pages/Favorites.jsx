import { useEffect, useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiDownload,
  FiEdit2,
  FiFile,
  FiFileText,
  FiFolder,
  FiImage,
  FiMusic,
  FiMoreVertical,
  FiSearch,
  FiShare2,
  FiStar,
  FiTrash2,
  FiVideo,
  FiX,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";
import "./Favorites.css";

const formatSize = (bytes) => {
  if (!bytes) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );

  return `${(bytes / Math.pow(1024, index)).toFixed(
    index === 0 ? 0 : 1,
  )} ${units[index]}`;
};

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getFileCategory = (file) => {
  const type = (file.mime_type || file.file_type || "").toLowerCase();

  const name = (file.name || file.original_name || "").toLowerCase();

  if (type.startsWith("image/") || type.startsWith("image")) {
    return "images";
  }

  if (type.startsWith("video/") || type.startsWith("video")) {
    return "videos";
  }

  if (type.startsWith("audio/") || type.startsWith("audio")) {
    return "audio";
  }

  if (
    type.includes("pdf") ||
    type.includes("document") ||
    type.includes("text") ||
    type.includes("word") ||
    type.includes("spreadsheet") ||
    type.includes("excel") ||
    type.includes("presentation") ||
    type.includes("powerpoint") ||
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

const getFileType = (file) => {
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

export default function Favorites() {
  const { user } = useAuth();

  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [openMenu, setOpenMenu] = useState(null);

  const [renameFile, setRenameFile] = useState(null);
  const [newName, setNewName] = useState("");
  const [renaming, setRenaming] = useState(false);

  // ======================================================
  // CHARGER LES FAVORIS
  // ======================================================

  const loadFavorites = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setMessage("");

      const { data: filesData, error: filesError } = await supabase
        .from("files")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_deleted", false)
        .eq("is_favorite", true)
        .order("created_at", {
          ascending: false,
        });

      if (filesError) {
        throw filesError;
      }

      const { data: foldersData, error: foldersError } = await supabase
        .from("folders")
        .select("id, name")
        .eq("user_id", user.id);

      if (foldersError) {
        throw foldersError;
      }

      setFiles(filesData || []);
      setFolders(foldersData || []);
    } catch (error) {
      console.error("Erreur chargement favoris :", error);
      setMessage("Impossible de charger vos favoris.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, [user]);

  // ======================================================
  // NOM DU DOSSIER
  // ======================================================

  const getFolderName = (folderId) => {
    if (!folderId) {
      return "Mes fichiers";
    }

    const folder = folders.find((item) => item.id === folderId);

    return folder?.name || "Dossier";
  };

  // ======================================================
  // RECHERCHE
  // ======================================================

  const filteredFiles = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return files;
    }

    return files.filter((file) => {
      const name = (file.name || "").toLowerCase();

      const originalName = (file.original_name || "").toLowerCase();

      const folderName = getFolderName(file.folder_id).toLowerCase();

      return (
        name.includes(value) ||
        originalName.includes(value) ||
        folderName.includes(value)
      );
    });
  }, [files, search, folders]);

  // ======================================================
  // MESSAGE
  // ======================================================

  const showMessage = (text) => {
    setMessage(text);

    setTimeout(() => {
      setMessage("");
    }, 3500);
  };

  // ======================================================
  // TÉLÉCHARGER
  // ======================================================

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

      showMessage("Impossible de télécharger ce fichier.");
    }
  };

  // ======================================================
  // PARTAGER
  // ======================================================

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

      showMessage("Lien de partage copié. Il est valable pendant 1 heure.");
    } catch (error) {
      console.error("Erreur partage :", error);

      showMessage("Impossible de créer le lien de partage.");
    }
  };

  // ======================================================
  // RETIRER DES FAVORIS
  // ======================================================

  const handleRemoveFavorite = async (file) => {
    setOpenMenu(null);

    try {
      const { error } = await supabase
        .from("files")
        .update({
          is_favorite: false,
        })
        .eq("id", file.id)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      setFiles((current) => current.filter((item) => item.id !== file.id));

      showMessage("Fichier retiré des favoris.");
    } catch (error) {
      console.error("Erreur favori :", error);

      showMessage("Impossible de retirer ce fichier des favoris.");
    }
  };

  // ======================================================
  // OUVRIR RENOMMAGE
  // ======================================================

  const openRenameModal = (file) => {
    setOpenMenu(null);

    setRenameFile(file);

    setNewName(file.name || file.original_name || "");
  };

  // ======================================================
  // FERMER RENOMMAGE
  // ======================================================

  const closeRenameModal = () => {
    if (renaming) {
      return;
    }

    setRenameFile(null);
    setNewName("");
  };

  // ======================================================
  // RENOMMER
  // ======================================================

  const handleRename = async () => {
    const name = newName.trim();

    if (!name) {
      showMessage("Le nom du fichier est obligatoire.");

      return;
    }

    if (!renameFile) {
      return;
    }

    try {
      setRenaming(true);

      const { error } = await supabase
        .from("files")
        .update({
          name,
        })
        .eq("id", renameFile.id)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      setFiles((current) =>
        current.map((file) =>
          file.id === renameFile.id
            ? {
                ...file,
                name,
              }
            : file,
        ),
      );

      setRenameFile(null);
      setNewName("");

      showMessage("Fichier renommé avec succès.");
    } catch (error) {
      console.error("Erreur renommage :", error);

      showMessage("Impossible de renommer le fichier.");
    } finally {
      setRenaming(false);
    }
  };

  // ======================================================
  // SUPPRIMER → CORBEILLE
  // ======================================================

  const handleDelete = async (file) => {
    setOpenMenu(null);

    const confirmed = window.confirm(
      `Voulez-vous déplacer "${file.name}" vers la corbeille ?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      const { error } = await supabase
        .from("files")
        .update({
          is_deleted: true,
        })
        .eq("id", file.id)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      // Retirer seulement de la liste des favoris.
      // IMPORTANT :
      // On NE supprime PAS le fichier du Storage.
      setFiles((current) => current.filter((item) => item.id !== file.id));

      showMessage("Fichier déplacé vers la corbeille.");
    } catch (error) {
      console.error("Erreur suppression :", error);

      showMessage("Impossible de déplacer le fichier vers la corbeille.");
    }
  };

  // ======================================================
  // UTILISATEUR NON CONNECTÉ
  // ======================================================

  if (!user) {
    return (
      <div className="favorites-page">
        <div className="favorites-empty">
          <FiStar size={40} />

          <h2>Connexion nécessaire</h2>

          <p>Connectez-vous pour accéder à vos favoris.</p>

          <Link to="/login" className="favorites-primary-button">
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  // ======================================================
  // RENDU
  // ======================================================

  return (
    <div className="favorites-page" onClick={() => setOpenMenu(null)}>
      <div className="favorites-container">
        {/* ==========================================
            HEADER
        ========================================== */}

        <div className="favorites-header">
          <div>
            <div className="shared-files-header">
              <Link
                to="/dashboard"
                className="trash-back-button"
                onClick={(event) => event.stopPropagation()}
              >
                <FiArrowLeft />
                Retour au tableau de bord
              </Link>
            </div>

            <div className="favorites-title-row">
              <div className="favorites-title-icon">
                <FiStar />
              </div>

              <div>
                <h1>Mes favoris</h1>

                <p>
                  Retrouvez rapidement les fichiers que vous avez enregistrés en
                  favoris.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            MESSAGE
        ========================================== */}

        {message && (
          <div className="favorites-message">
            <span>{message}</span>

            <button type="button" onClick={() => setMessage("")}>
              <FiX />
            </button>
          </div>
        )}

        {/* ==========================================
            TOOLBAR
        ========================================== */}

        <div className="favorites-toolbar">
          <div className="favorites-search">
            <FiSearch />

            <input
              type="text"
              placeholder="Rechercher un favori..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="favorites-count">
            {filteredFiles.length} fichier
            {filteredFiles.length > 1 ? "s" : ""}
          </div>
        </div>

        {/* ==========================================
            CONTENU
        ========================================== */}

        {loading ? (
          <div className="favorites-empty">
            <p>Chargement de vos favoris...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="favorites-empty">
            <div className="favorites-empty-icon">
              <FiStar />
            </div>

            <h2>{search ? "Aucun résultat" : "Aucun fichier favori"}</h2>

            <p>
              {search
                ? "Aucun fichier ne correspond à votre recherche."
                : "Les fichiers que vous marquez comme favoris apparaîtront ici."}
            </p>

            {!search && (
              <Link to="/dashboard/files" className="favorites-primary-button">
                Voir mes fichiers
              </Link>
            )}
          </div>
        ) : (
          <div className="favorites-table-wrapper">
            <table className="favorites-table">
              <thead>
                <tr>
                  <th>Fichier</th>
                  <th>Dossier</th>
                  <th>Type</th>
                  <th>Taille</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {filteredFiles.map((file) => (
                  <tr key={file.id}>
                    {/* FICHIER */}
                    <td>
                      <div className="favorites-file">
                        <div className="favorites-file-icon">
                          {getFileIcon(file)}
                        </div>

                        <div className="favorites-file-info">
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
                    </td>

                    {/* DOSSIER */}
                    <td>
                      {file.folder_id ? (
                        <Link
                          to={`/dashboard/folders/${file.folder_id}`}
                          className="favorites-folder-link"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <FiFolder />

                          <span>{getFolderName(file.folder_id)}</span>
                        </Link>
                      ) : (
                        <span className="favorites-folder-name">
                          <FiFolder />
                          Mes fichiers
                        </span>
                      )}
                    </td>

                    {/* TYPE */}
                    <td>
                      <span className="favorites-type">
                        {getFileType(file)}
                      </span>
                    </td>

                    {/* TAILLE */}
                    <td>{formatSize(file.size)}</td>

                    {/* DATE */}
                    <td>{formatDate(file.created_at)}</td>

                    {/* ACTIONS */}
                    <td>
                      <div className="favorites-actions">
                        {/* FAVORI */}
                        <button
                          type="button"
                          className="favorites-action-button favorite-active"
                          title="Retirer des favoris"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleRemoveFavorite(file);
                          }}
                        >
                          <FiStar />
                        </button>

                        {/* DOWNLOAD */}
                        <button
                          type="button"
                          className="favorites-action-button"
                          title="Télécharger"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDownload(file);
                          }}
                        >
                          <FiDownload />
                        </button>

                        {/* MENU */}
                        <div className="favorites-menu-container">
                          <button
                            type="button"
                            className="favorites-action-button"
                            title="Plus d'options"
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
                              className="favorites-action-menu"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => handleShare(file)}
                              >
                                <FiShare2 />
                                Partager
                              </button>

                              <button
                                type="button"
                                onClick={() => openRenameModal(file)}
                              >
                                <FiEdit2 />
                                Renommer
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRemoveFavorite(file)}
                              >
                                <FiStar />
                                Retirer des favoris
                              </button>

                              <button
                                type="button"
                                className="delete-action"
                                onClick={() => handleDelete(file)}
                              >
                                <FiTrash2 />
                                Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==========================================
          MODAL RENOMMER
      ========================================== */}

      {renameFile && (
        <div className="favorites-modal-overlay" onClick={closeRenameModal}>
          <div
            className="favorites-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="favorites-modal-header">
              <h2>Renommer le fichier</h2>

              <button
                type="button"
                onClick={closeRenameModal}
                disabled={renaming}
              >
                <FiX />
              </button>
            </div>

            <div className="favorites-modal-body">
              <label htmlFor="favorite-file-name">Nouveau nom</label>

              <input
                id="favorite-file-name"
                type="text"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleRename();
                  }
                }}
                autoFocus
              />
            </div>

            <div className="favorites-modal-footer">
              <button
                type="button"
                className="favorites-modal-cancel"
                onClick={closeRenameModal}
                disabled={renaming}
              >
                Annuler
              </button>

              <button
                type="button"
                className="favorites-modal-confirm"
                onClick={handleRename}
                disabled={renaming}
              >
                {renaming ? "Enregistrement..." : "Renommer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
