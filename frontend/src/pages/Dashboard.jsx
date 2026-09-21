import { useEffect, useMemo, useState } from "react";
import {
  FiMessageSquare,
  FiChevronRight,
  FiFile,
  FiFileText,
  FiFolder,
  FiHardDrive,
  FiImage,
  FiLogOut,
  FiMoreVertical,
  FiMusic,
  FiPlus,
  FiSearch,
  FiStar,
  FiTrash2,
  FiVideo,
  FiX,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";
import "./Dashboard.css";

const STORAGE_LIMIT = 5 * 1024 * 1024 * 1024; // 5 GB

/* =========================================================
   UTILITAIRES
========================================================= */

const formatSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / Math.pow(1024, index)).toFixed(
    index === 0 ? 0 : 1,
  )} ${units[index]}`;
};

const getFileType = (file) => {
  const type = file.mime_type || file.file_type || "";

  if (type.startsWith("image")) return "image";
  if (type.startsWith("video")) return "video";
  if (type.startsWith("audio")) return "audio";

  if (
    type.includes("pdf") ||
    type.includes("document") ||
    type.includes("text") ||
    type.includes("word") ||
    type.includes("spreadsheet") ||
    type.includes("excel")
  ) {
    return "document";
  }

  return "other";
};

const getTypeLabel = (type) => {
  const labels = {
    image: "Images",
    video: "Vidéos",
    audio: "Audio",
    document: "Documents",
    other: "Autres",
  };

  return labels[type] || "Autres";
};

const getTypeIcon = (type) => {
  switch (type) {
    case "image":
      return <FiImage />;

    case "video":
      return <FiVideo />;

    case "audio":
      return <FiMusic />;

    case "document":
      return <FiFileText />;

    default:
      return <FiFile />;
  }
};

/* =========================================================
   DASHBOARD
========================================================= */

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  /* =======================================================
     ÉTATS
  ======================================================= */

  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");

  /* Création dossier */
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);

  /* Menu dossier */
  const [openFolderMenu, setOpenFolderMenu] = useState(null);

  /* Renommage dossier */
  const [renameFolder, setRenameFolder] = useState(null);
  const [newFolderRename, setNewFolderRename] = useState("");
  const [renamingFolder, setRenamingFolder] = useState(false);

  /* Upload */
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  /* =======================================================
     CHARGEMENT DU DASHBOARD
  ======================================================= */

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setMessage("");

      const [foldersResult, filesResult] = await Promise.all([
        supabase
          .from("folders")
          .select("*")
          .eq("user_id", user.id)
          .is("parent_id", null)
          .order("created_at", { ascending: false }),

        supabase
          .from("files")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (foldersResult.error) {
        throw foldersResult.error;
      }

      if (filesResult.error) {
        throw filesResult.error;
      }

      setFolders(foldersResult.data || []);
      setFiles(filesResult.data || []);
    } catch (error) {
      console.error("Erreur Dashboard :", error);
      setMessage("Impossible de charger les données.");
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     FICHIERS ACTIFS
  ======================================================= */

  const activeFiles = useMemo(() => {
    return files.filter((file) => !file.is_deleted);
  }, [files]);

  /* =======================================================
     CORBEILLE
  ======================================================= */

  const deletedFiles = useMemo(() => {
    return files.filter((file) => file.is_deleted);
  }, [files]);

  /* =======================================================
     ESPACE UTILISÉ
  ======================================================= */

  const usedStorage = useMemo(() => {
    return activeFiles.reduce(
      (total, file) => total + Number(file.size || 0),
      0,
    );
  }, [activeFiles]);

  const storagePercentage = Math.min((usedStorage / STORAGE_LIMIT) * 100, 100);

  /* =======================================================
     FAVORIS
  ======================================================= */

  const favoritesCount = useMemo(() => {
    return activeFiles.filter((file) => file.is_favorite).length;
  }, [activeFiles]);

  /* =======================================================
     TYPES DE FICHIERS
  ======================================================= */

  const fileTypes = useMemo(() => {
    const result = {
      image: 0,
      video: 0,
      audio: 0,
      document: 0,
      other: 0,
    };

    activeFiles.forEach((file) => {
      const type = getFileType(file);
      result[type] += 1;
    });

    return result;
  }, [activeFiles]);

  /* =======================================================
     RECHERCHE DOSSIERS
  ======================================================= */

  const filteredFolders = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return folders;

    return folders.filter((folder) =>
      folder.name.toLowerCase().includes(value),
    );
  }, [folders, search]);

  /* =======================================================
     CRÉER UN DOSSIER
  ======================================================= */

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();

    if (!name) {
      setMessage("Le nom du dossier est obligatoire.");
      return;
    }

    if (!user) return;

    try {
      setCreatingFolder(true);

      const { data, error } = await supabase
        .from("folders")
        .insert({
          user_id: user.id,
          name,
          parent_id: null,
        })
        .select()
        .single();

      if (error) throw error;

      setFolders((current) => [data, ...current]);

      setNewFolderName("");
      setShowCreateFolder(false);
      setMessage("Dossier créé avec succès.");
    } catch (error) {
      console.error("Erreur création dossier :", error);
      setMessage("Impossible de créer le dossier.");
    } finally {
      setCreatingFolder(false);
    }
  };

  /* =======================================================
     RENOMMER UN DOSSIER
  ======================================================= */

  const openRenameFolder = (folder) => {
    setRenameFolder(folder);
    setNewFolderRename(folder.name);
    setOpenFolderMenu(null);
  };

  const closeRenameFolder = () => {
    if (renamingFolder) return;

    setRenameFolder(null);
    setNewFolderRename("");
  };

  const handleRenameFolder = async () => {
    const name = newFolderRename.trim();

    if (!name) {
      setMessage("Le nom du dossier est obligatoire.");
      return;
    }

    if (!renameFolder || !user) return;

    try {
      setRenamingFolder(true);

      const { error } = await supabase
        .from("folders")
        .update({
          name,
          updated_at: new Date().toISOString(),
        })
        .eq("id", renameFolder.id)
        .eq("user_id", user.id);

      if (error) throw error;

      setFolders((current) =>
        current.map((folder) =>
          folder.id === renameFolder.id ? { ...folder, name } : folder,
        ),
      );

      setMessage("Dossier renommé avec succès.");

      setRenameFolder(null);
      setNewFolderRename("");
    } catch (error) {
      console.error("Erreur renommage dossier :", error);
      setMessage("Impossible de renommer le dossier.");
    } finally {
      setRenamingFolder(false);
    }
  };

  /* =======================================================
     SUPPRIMER UN DOSSIER
  ======================================================= */

  const handleDeleteFolder = async (folder) => {
    const confirmed = window.confirm(
      `Voulez-vous supprimer le dossier "${folder.name}" ?`,
    );

    if (!confirmed || !user) return;

    try {
      /* Vérification sous-dossiers */
      const { data: children, error: childrenError } = await supabase
        .from("folders")
        .select("id")
        .eq("parent_id", folder.id)
        .limit(1);

      if (childrenError) throw childrenError;

      if (children && children.length > 0) {
        setMessage(
          "Impossible de supprimer ce dossier car il contient des sous-dossiers.",
        );
        return;
      }

      /* Vérification fichiers */
      const { data: folderFiles, error: filesError } = await supabase
        .from("files")
        .select("id")
        .eq("folder_id", folder.id)
        .eq("is_deleted", false)
        .limit(1);

      if (filesError) throw filesError;

      if (folderFiles && folderFiles.length > 0) {
        setMessage(
          "Impossible de supprimer ce dossier car il contient des fichiers.",
        );
        return;
      }

      /* Suppression */
      const { error } = await supabase
        .from("folders")
        .delete()
        .eq("id", folder.id)
        .eq("user_id", user.id);

      if (error) throw error;

      setFolders((current) => current.filter((item) => item.id !== folder.id));

      setOpenFolderMenu(null);

      setMessage("Dossier supprimé avec succès.");
    } catch (error) {
      console.error("Erreur suppression dossier :", error);
      setMessage("Impossible de supprimer le dossier.");
    }
  };

  /* =======================================================
     CATÉGORIE DU FICHIER
  ======================================================= */

  const getFileCategory = (mimeType = "") => {
    if (mimeType.startsWith("image/")) return "image";

    if (mimeType.startsWith("video/")) return "video";

    if (mimeType.startsWith("audio/")) return "audio";

    if (
      mimeType.includes("pdf") ||
      mimeType.includes("text") ||
      mimeType.includes("word") ||
      mimeType.includes("document") ||
      mimeType.includes("spreadsheet") ||
      mimeType.includes("excel")
    ) {
      return "document";
    }

    if (
      mimeType.includes("zip") ||
      mimeType.includes("rar") ||
      mimeType.includes("7z")
    ) {
      return "archive";
    }

    return "other";
  };

  /* =======================================================
     NOM SÉCURISÉ POUR STORAGE
  ======================================================= */

  const createSafeName = (name) => {
    return name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "-");
  };

  /* =======================================================
     UPLOAD
  ======================================================= */

  const handleUploadFiles = async (event) => {
    if (!user) return;

    const selectedFiles = Array.from(event.target.files || []);

    if (!selectedFiles.length) return;

    const totalSelectedSize = selectedFiles.reduce(
      (total, file) => total + file.size,
      0,
    );

    /* Vérification espace */
    if (usedStorage + totalSelectedSize > STORAGE_LIMIT) {
      setMessage(
        "L'espace de stockage disponible est insuffisant pour ces fichiers.",
      );

      event.target.value = "";
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setMessage("");

      const uploadedFiles = [];
      const failedFiles = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];

        const safeName = createSafeName(file.name);

        const storagePath =
          `${user.id}/` +
          `${Date.now()}-` +
          `${Math.random().toString(36).slice(2, 8)}-` +
          `${safeName}`;

        try {
          /* ---------------------------------------------
             1. STORAGE
          --------------------------------------------- */

          const { error: uploadError } = await supabase.storage
            .from("files")
            .upload(storagePath, file, {
              cacheControl: "3600",
              upsert: false,
              contentType: file.type || "application/octet-stream",
            });

          if (uploadError) {
            throw uploadError;
          }

          /* ---------------------------------------------
             2. DATABASE
          --------------------------------------------- */

          const { data: insertedFile, error: dbError } = await supabase
            .from("files")
            .insert({
              user_id: user.id,
              folder_id: null,
              name: file.name,
              original_name: file.name,
              storage_path: storagePath,
              file_type: getFileCategory(file.type),
              mime_type: file.type || "application/octet-stream",
              size: file.size,
              is_deleted: false,
              is_favorite: false,
            })
            .select()
            .single();

          /* ---------------------------------------------
             ROLLBACK STORAGE SI DB ÉCHOUE
          --------------------------------------------- */

          if (dbError) {
            await supabase.storage.from("files").remove([storagePath]);

            throw dbError;
          }

          uploadedFiles.push(insertedFile);
        } catch (error) {
          console.error(`Erreur upload ${file.name} :`, error);

          failedFiles.push(file.name);
        }

        /* Progression */
        const progress = Math.round(((i + 1) / selectedFiles.length) * 100);

        setUploadProgress(progress);
      }

      /* ---------------------------------------------
         AJOUT IMMÉDIAT À LA LISTE
      --------------------------------------------- */

      if (uploadedFiles.length > 0) {
        setFiles((previousFiles) => [...uploadedFiles, ...previousFiles]);
      }

      /* ---------------------------------------------
         MESSAGE
      --------------------------------------------- */

      if (uploadedFiles.length > 0 && failedFiles.length === 0) {
        setMessage(
          `${uploadedFiles.length} fichier${
            uploadedFiles.length > 1 ? "s" : ""
          } ajouté${uploadedFiles.length > 1 ? "s" : ""} avec succès.`,
        );
      } else if (uploadedFiles.length > 0 && failedFiles.length > 0) {
        setMessage(
          `${uploadedFiles.length} fichier${
            uploadedFiles.length > 1 ? "s" : ""
          } ajouté${uploadedFiles.length > 1 ? "s" : ""}. ${
            failedFiles.length
          } fichier${
            failedFiles.length > 1 ? "s" : ""
          } n'ont pas pu être ajouté${failedFiles.length > 1 ? "s" : ""}.`,
        );
      } else {
        setMessage("Aucun fichier n'a pu être ajouté.");
      }
    } catch (error) {
      console.error("Erreur générale upload :", error);

      setMessage("Une erreur est survenue pendant l'importation.");
    } finally {
      setUploading(false);
      setUploadProgress(100);

      /* Réinitialisation input */
      event.target.value = "";

      /* Retour à 0 après un petit délai */
      setTimeout(() => {
        setUploadProgress(0);
      }, 1000);
    }
  };

  /* =======================================================
     DRAG & DROP
  ======================================================= */

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!uploading) {
      event.dataTransfer.dropEffect = "copy";
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (uploading) return;

    const droppedFiles = Array.from(event.dataTransfer.files || []);

    if (!droppedFiles.length) return;

    /* Même logique que l'input file */
    handleUploadFiles({
      target: {
        files: droppedFiles,
        value: "",
      },
    });
  };

  /* =======================================================
     DÉCONNEXION
  ======================================================= */

  const handleLogout = async () => {
    const { error } = await logout();

    if (error) {
      console.error("Erreur déconnexion :", error);
      return;
    }

    navigate("/login");
  };

  /* =======================================================
     PAS CONNECTÉ
  ======================================================= */

  if (!user) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-empty">
          <FiHardDrive size={45} />

          <h2>Connexion nécessaire</h2>

          <p>Connectez-vous pour accéder à votre espace Cloud Vault.</p>

          <Link to="/login" className="dashboard-primary-button">
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  /* =======================================================
     JSX
  ======================================================= */

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        {/* =================================================
            HEADER
        ================================================= */}

        <header className="dashboard-header">
          <div className="dashboard-welcome">
            <div className="dashboard-logo-icon">
              <FiHardDrive />
            </div>

            <div>
              <p className="dashboard-small-title">CLOUD VAULT</p>

              <h1>Mon espace</h1>

              <p className="dashboard-email">{user.email}</p>
            </div>
          </div>

          <button className="dashboard-logout-button" onClick={handleLogout}>
            <FiLogOut />
            <span>Déconnexion</span>
          </button>
        </header>

        {/* =================================================
            MESSAGE
        ================================================= */}

        {message && (
          <div className="dashboard-message">
            <span>{message}</span>

            <button onClick={() => setMessage("")}>
              <FiX />
            </button>
          </div>
        )}

        {/* =================================================
            STATISTIQUES
        ================================================= */}

        <section className="dashboard-stats">
          {/* STOCKAGE */}
          <div className="dashboard-storage-card">
            <div className="dashboard-card-heading">
              <div className="dashboard-card-icon">
                <FiHardDrive />
              </div>

              <div>
                <h2>Stockage</h2>
                <p>Votre espace utilisé</p>
              </div>
            </div>

            <div className="dashboard-storage-values">
              <strong>{formatSize(usedStorage)}</strong>

              <span>sur 5 GB</span>
            </div>

            <div className="dashboard-progress">
              <div
                className="dashboard-progress-bar"
                style={{
                  width: `${storagePercentage}%`,
                }}
              />
            </div>

            <div className="dashboard-storage-footer">
              <span>{storagePercentage.toFixed(1)} % utilisé</span>

              <span>
                {formatSize(Math.max(STORAGE_LIMIT - usedStorage, 0))}{" "}
                disponible
              </span>
            </div>
          </div>

          {/* FICHIERS */}
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-icon files">
              <FiFile />
            </div>

            <div>
              <span>Total fichiers</span>
              <strong>{activeFiles.length}</strong>
            </div>
          </div>

          {/* DOSSIERS */}
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-icon folders">
              <FiFolder />
            </div>

            <div>
              <span>Total dossiers</span>
              <strong>{folders.length}</strong>
            </div>
          </div>

          {/* FAVORIS */}
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-icon favorites">
              <FiStar />
            </div>

            <div>
              <span>Favoris</span>
              <strong>{favoritesCount}</strong>
            </div>
          </div>

          {/* CORBEILLE */}
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-icon trash">
              <FiTrash2 />
            </div>

            <div>
              <span>Corbeille</span>
              <strong>{deletedFiles.length}</strong>
            </div>
          </div>
        </section>

        {/* =================================================
            ACTIONS / UPLOAD
        ================================================= */}

        <section className="dashboard-actions">
          {/* ZONE UPLOAD */}
          <label
            className={`dashboard-upload-zone ${
              uploading ? "is-uploading" : ""
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <FiPlus className="dashboard-upload-icon" />

            <div className="dashboard-upload-content">
              <strong>
                {uploading
                  ? `Upload en cours... ${uploadProgress}%`
                  : "Ajouter des fichiers"}
              </strong>

              <span>
                {uploading
                  ? "Veuillez patienter pendant l'envoi des fichiers"
                  : "Cliquez ici ou glissez-déposez vos fichiers"}
              </span>
            </div>

            {!uploading && (
              <input type="file" multiple onChange={handleUploadFiles} hidden />
            )}

            {uploading && (
              <div className="dashboard-upload-progress">
                <div
                  className="dashboard-upload-progress-bar"
                  style={{
                    width: `${uploadProgress}%`,
                  }}
                />
              </div>
            )}
          </label>

          {/* MES FICHIERS */}
          <Link to="/dashboard/files" className="dashboard-action-button">
            <FiFile />
            <span>Mes fichiers</span>
          </Link>

          {/* FAVORIS */}
          <Link
            to="/dashboard/favorites"
            className="dashboard-action-button favorites-button"
          >
            <FiStar />
            <span>Mes favoris</span>
          </Link>

          {/* CORBEILLE */}
          <Link
            to="/dashboard/trash"
            className="dashboard-action-button trash-button"
          >
            <FiTrash2 />
            <span>Corbeille</span>
          </Link>

          {/* MESSAGES */}
          <Link to="/dashboard/messages" className="dashboard-action-button">
            <FiMessageSquare />
            <span>Messages</span>
          </Link>

          <Link to="/dashboard/contact" className="dashboard-action-button">
            <FiMessageSquare />
            <span>Contact</span>
          </Link>

          {/* Mes partages */}
          <Link to="/shared/:token" className="dashboard-action-button">
            <FiFileText />
            <span>Mes partages</span>
          </Link>
        </section>

        {/* =================================================
            DOSSIERS
        ================================================= */}

        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <div>
              <h2>Mes dossiers</h2>

              <p>Organisez vos fichiers dans vos dossiers.</p>
            </div>

            <button
              className="dashboard-create-folder-button"
              onClick={() => setShowCreateFolder(true)}
            >
              <FiPlus />
              <span>Nouveau dossier</span>
            </button>
          </div>

          {/* RECHERCHE */}
          <div className="dashboard-search-container">
            <FiSearch />

            <input
              type="text"
              placeholder="Rechercher un dossier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* LISTE DOSSIERS */}

          {loading ? (
            <div className="dashboard-loading">Chargement...</div>
          ) : filteredFolders.length === 0 ? (
            <div className="dashboard-empty-folders">
              <div className="dashboard-empty-folder-icon">
                <FiFolder />
              </div>

              <h3>{search ? "Aucun dossier trouvé" : "Aucun dossier"}</h3>

              <p>
                {search
                  ? "Aucun dossier ne correspond à votre recherche."
                  : "Créez votre premier dossier pour organiser vos fichiers."}
              </p>

              {!search && (
                <button
                  className="dashboard-primary-button"
                  onClick={() => setShowCreateFolder(true)}
                >
                  <FiPlus />
                  Créer un dossier
                </button>
              )}
            </div>
          ) : (
            <div className="dashboard-folders-grid">
              {filteredFolders.map((folder) => (
                <div className="dashboard-folder-wrapper" key={folder.id}>
                  <Link
                    to={`/dashboard/folders/${folder.id}`}
                    className="dashboard-folder"
                  >
                    <div className="dashboard-folder-icon">
                      <FiFolder />
                    </div>

                    <div className="dashboard-folder-info">
                      <strong title={folder.name}>{folder.name}</strong>

                      <span>Ouvrir le dossier</span>
                    </div>

                    <FiChevronRight className="dashboard-folder-arrow" />
                  </Link>

                  {/* MENU */}
                  <div className="dashboard-folder-menu">
                    <button
                      className="dashboard-folder-menu-button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        setOpenFolderMenu(
                          openFolderMenu === folder.id ? null : folder.id,
                        );
                      }}
                    >
                      <FiMoreVertical />
                    </button>

                    {openFolderMenu === folder.id && (
                      <div className="dashboard-folder-dropdown">
                        <button onClick={() => openRenameFolder(folder)}>
                          <FiFileText />
                          Renommer
                        </button>

                        <button
                          className="delete"
                          onClick={() => handleDeleteFolder(folder)}
                        >
                          <FiTrash2 />
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* =================================================
            TYPES DE FICHIERS
        ================================================= */}

        <section className="dashboard-section dashboard-types-section">
          <div className="dashboard-section-header">
            <div>
              <h2>Répartition des fichiers</h2>

              <p>Consultez vos fichiers par catégorie.</p>
            </div>
          </div>

          <div className="dashboard-types-grid">
            {Object.entries(fileTypes).map(([type, count]) => {
              const percentage =
                activeFiles.length > 0 ? (count / activeFiles.length) * 100 : 0;

              return (
                <div className="dashboard-type-card" key={type}>
                  <div className="dashboard-type-top">
                    <div className="dashboard-type-icon">
                      {getTypeIcon(type)}
                    </div>

                    <strong>{count}</strong>
                  </div>

                  <span className="dashboard-type-label">
                    {getTypeLabel(type)}
                  </span>

                  <div className="dashboard-type-progress">
                    <div
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>

                  <small>{percentage.toFixed(0)} %</small>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* ===================================================
          MODAL CRÉATION DOSSIER
      =================================================== */}

      {showCreateFolder && (
        <div
          className="dashboard-modal-overlay"
          onClick={() => !creatingFolder && setShowCreateFolder(false)}
        >
          <div className="dashboard-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dashboard-modal-header">
              <h2>Créer un dossier</h2>

              <button
                onClick={() => !creatingFolder && setShowCreateFolder(false)}
              >
                <FiX />
              </button>
            </div>

            <div className="dashboard-modal-body">
              <label htmlFor="new-folder-name">Nom du dossier</label>

              <input
                id="new-folder-name"
                type="text"
                placeholder="Ex : Documents"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateFolder();
                  }
                }}
                autoFocus
              />
            </div>

            <div className="dashboard-modal-footer">
              <button
                className="dashboard-modal-cancel"
                onClick={() => setShowCreateFolder(false)}
                disabled={creatingFolder}
              >
                Annuler
              </button>

              <button
                className="dashboard-modal-confirm"
                onClick={handleCreateFolder}
                disabled={creatingFolder}
              >
                {creatingFolder ? "Création..." : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================
          MODAL RENOMMAGE DOSSIER
      =================================================== */}

      {renameFolder && (
        <div className="dashboard-modal-overlay" onClick={closeRenameFolder}>
          <div className="dashboard-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dashboard-modal-header">
              <h2>Renommer le dossier</h2>

              <button onClick={closeRenameFolder}>
                <FiX />
              </button>
            </div>

            <div className="dashboard-modal-body">
              <label htmlFor="rename-folder-name">Nouveau nom</label>

              <input
                id="rename-folder-name"
                type="text"
                value={newFolderRename}
                onChange={(e) => setNewFolderRename(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleRenameFolder();
                  }
                }}
                autoFocus
              />
            </div>

            <div className="dashboard-modal-footer">
              <button
                className="dashboard-modal-cancel"
                onClick={closeRenameFolder}
                disabled={renamingFolder}
              >
                Annuler
              </button>

              <button
                className="dashboard-modal-confirm"
                onClick={handleRenameFolder}
                disabled={renamingFolder}
              >
                {renamingFolder ? "Enregistrement..." : "Renommer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
