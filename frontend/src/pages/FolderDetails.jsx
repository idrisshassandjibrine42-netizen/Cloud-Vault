import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  FiArrowLeft,
  FiDownload,
  FiEdit2,
  FiEye,
  FiMove,
  FiFile,
  FiFolder,
  FiMoreVertical,
  FiSearch,
  FiShare2,
  FiStar,
  FiTrash2,
  FiUpload,
  FiX,
} from "react-icons/fi";

import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";
import "./FolderDetails.css";

// ==================================================
// UTILITAIRES
// ==================================================

function formatSize(bytes) {
  if (!bytes) return "0 B";

  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

function formatDate(date) {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getFileIcon(file) {
  const type = file?.file_type || file?.mime_type || "";

  if (type.includes("image")) return "🖼️";
  if (type.includes("video")) return "🎬";
  if (type.includes("audio")) return "🎵";
  if (type.includes("pdf")) return "📕";
  if (type.includes("word")) return "📘";
  if (type.includes("excel") || type.includes("spreadsheet")) return "📗";
  if (type.includes("zip") || type.includes("rar")) return "📦";

  return "📄";
}

function getFileTypeLabel(file) {
  const type = (file?.file_type || file?.mime_type || "").toLowerCase();

  if (type.includes("image")) return "Image";
  if (type.includes("video")) return "Vidéo";
  if (type.includes("audio")) return "Audio";
  if (type.includes("pdf")) return "PDF";
  if (type.includes("word")) return "Word";
  if (type.includes("excel") || type.includes("spreadsheet")) {
    return "Excel";
  }
  if (type.includes("zip") || type.includes("rar")) return "Archive";

  return "Fichier";
}

// ==================================================
// COMPOSANT
// ==================================================

export default function FolderDetails() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // ==================================================
  // DONNÉES
  // ==================================================

  const [folder, setFolder] = useState(null);
  const [parentFolder, setParentFolder] = useState(null);
  const [files, setFiles] = useState([]);
  const [subfolders, setSubfolders] = useState([]);

  // ==================================================
  // ÉTATS
  // ==================================================

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  // ==================================================
  // MENUS
  // ==================================================

  const [menuOpen, setMenuOpen] = useState(null);
  const [folderMenuOpen, setFolderMenuOpen] = useState(null);

  // ==================================================
  // RENOMMER FICHIER
  // ==================================================

  const [renameFile, setRenameFile] = useState(null);
  const [newName, setNewName] = useState("");

  // ==================================================
  // NOUVEAU DOSSIER
  // ==================================================

  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);

  // ==================================================
  // RENOMMER DOSSIER
  // ==================================================

  const [renameFolder, setRenameFolder] = useState(null);
  const [newFolderRename, setNewFolderRename] = useState("");
  const [renamingFolder, setRenamingFolder] = useState(false);

  // ==================================================
  // UPLOAD
  // ==================================================

  const [uploading, setUploading] = useState(false);

  // ==================================================
  // APERÇU
  // ==================================================

  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);

  // ==================================================
  // DÉPLACER FICHIER
  // ==================================================

  const [moveFile, setMoveFile] = useState(null);
  const [moveFolders, setMoveFolders] = useState([]);
  const [moveFolderId, setMoveFolderId] = useState("");
  const [loadingMoveFolders, setLoadingMoveFolders] = useState(false);
  const [movingFile, setMovingFile] = useState(false);

  // ==================================================
  // CHARGEMENT
  // ==================================================

  useEffect(() => {
    if (user && folderId) {
      loadFolder();
    }
  }, [user, folderId]);

  // ==================================================
  // CHARGER DOSSIER
  // ==================================================

  const loadFolder = async () => {
    try {
      setLoading(true);
      setMessage("");

      // DOSSIER ACTUEL
      const { data: folderData, error: folderError } = await supabase
        .from("folders")
        .select("*")
        .eq("id", folderId)
        .eq("user_id", user.id)
        .single();

      if (folderError) {
        console.error(folderError);
        setFolder(null);
        setMessage("Impossible de charger le dossier.");
        return;
      }

      setFolder(folderData);

      // DOSSIER PARENT
      if (folderData.parent_id) {
        const { data: parentData, error: parentError } = await supabase
          .from("folders")
          .select("id, name, parent_id")
          .eq("id", folderData.parent_id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (parentError) {
          console.error(parentError);
          setParentFolder(null);
        } else {
          setParentFolder(parentData || null);
        }
      } else {
        setParentFolder(null);
      }

      // SOUS-DOSSIERS
      const { data: foldersData, error: foldersError } = await supabase
        .from("folders")
        .select("*")
        .eq("user_id", user.id)
        .eq("parent_id", folderId)
        .order("created_at", { ascending: true });

      if (foldersError) {
        console.error(foldersError);
        setSubfolders([]);
      } else {
        setSubfolders(foldersData || []);
      }

      // FICHIERS
      const { data: filesData, error: filesError } = await supabase
        .from("files")
        .select("*")
        .eq("user_id", user.id)
        .eq("folder_id", folderId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (filesError) {
        console.error(filesError);
        setMessage("Impossible de charger les fichiers.");
        return;
      }

      setFiles(filesData || []);
    } catch (error) {
      console.error(error);
      setMessage("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // CRÉER SOUS-DOSSIER
  // ==================================================

  const handleCreateSubfolder = async () => {
    if (!newFolderName.trim()) {
      setMessage("Veuillez saisir un nom de dossier.");
      return;
    }

    try {
      setCreatingFolder(true);
      setMessage("");

      const { data, error } = await supabase
        .from("folders")
        .insert({
          user_id: user.id,
          name: newFolderName.trim(),
          parent_id: folderId,
        })
        .select()
        .single();

      if (error) {
        console.error(error);
        setMessage("Impossible de créer le sous-dossier.");
        return;
      }

      setSubfolders((current) => [...current, data]);

      setNewFolderName("");
      setShowFolderModal(false);

      setMessage("Sous-dossier créé avec succès.");
    } catch (error) {
      console.error(error);
      setMessage("Une erreur est survenue.");
    } finally {
      setCreatingFolder(false);
    }
  };

  // ==================================================
  // RENOMMER DOSSIER ACTUEL
  // ==================================================

  const openRenameCurrentFolder = () => {
    setRenameFolder(folder);
    setNewFolderRename(folder.name || "");
    setFolderMenuOpen(null);
  };

  // ==================================================
  // RENOMMER DOSSIER
  // ==================================================

  const handleRenameFolder = async () => {
    if (!renameFolder || !newFolderRename.trim()) {
      setMessage("Veuillez saisir un nom.");
      return;
    }

    try {
      setRenamingFolder(true);
      setMessage("");

      const { error } = await supabase
        .from("folders")
        .update({
          name: newFolderRename.trim(),
        })
        .eq("id", renameFolder.id)
        .eq("user_id", user.id);

      if (error) {
        console.error(error);
        setMessage("Impossible de renommer le dossier.");
        return;
      }

      if (renameFolder.id === folder.id) {
        setFolder((current) => ({
          ...current,
          name: newFolderRename.trim(),
        }));
      }

      setSubfolders((current) =>
        current.map((item) =>
          item.id === renameFolder.id
            ? {
                ...item,
                name: newFolderRename.trim(),
              }
            : item,
        ),
      );

      setRenameFolder(null);
      setNewFolderRename("");

      setMessage("Dossier renommé avec succès.");
    } catch (error) {
      console.error(error);
      setMessage("Erreur lors du renommage du dossier.");
    } finally {
      setRenamingFolder(false);
    }
  };

  // ==================================================
  // SUPPRIMER DOSSIER
  // ==================================================

  const handleDeleteFolder = async (folderToDelete, isCurrent = false) => {
    try {
      setFolderMenuOpen(null);
      setMessage("");

      const { data: children, error: childrenError } = await supabase
        .from("folders")
        .select("id")
        .eq("user_id", user.id)
        .eq("parent_id", folderToDelete.id);

      if (childrenError) {
        console.error(childrenError);
        setMessage("Impossible de vérifier le contenu du dossier.");
        return;
      }

      const { data: folderFiles, error: filesError } = await supabase
        .from("files")
        .select("id")
        .eq("user_id", user.id)
        .eq("folder_id", folderToDelete.id)
        .eq("is_deleted", false);

      if (filesError) {
        console.error(filesError);
        setMessage("Impossible de vérifier les fichiers du dossier.");
        return;
      }

      if ((children?.length || 0) > 0 || (folderFiles?.length || 0) > 0) {
        setMessage(
          "Impossible de supprimer ce dossier car il contient des fichiers ou des sous-dossiers.",
        );
        return;
      }

      const confirmed = window.confirm(
        `Voulez-vous vraiment supprimer le dossier "${folderToDelete.name}" ?`,
      );

      if (!confirmed) return;

      const { error: deleteError } = await supabase
        .from("folders")
        .delete()
        .eq("id", folderToDelete.id)
        .eq("user_id", user.id);

      if (deleteError) {
        console.error(deleteError);
        setMessage("Impossible de supprimer le dossier.");
        return;
      }

      if (isCurrent) {
        if (parentFolder) {
          navigate(`/dashboard/folders/${parentFolder.id}`);
        } else {
          navigate("/dashboard");
        }

        return;
      }

      setSubfolders((current) =>
        current.filter((item) => item.id !== folderToDelete.id),
      );

      setMessage("Dossier supprimé avec succès.");
    } catch (error) {
      console.error(error);
      setMessage("Erreur lors de la suppression du dossier.");
    }
  };

  // ==================================================
  // UPLOAD
  // ==================================================

  const handleUpload = async (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile || !user) return;

    try {
      setUploading(true);
      setMessage("");

      const safeName = selectedFile.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]/g, "_");

      const filePath = `${user.id}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("files")
        .upload(filePath, selectedFile);

      if (uploadError) {
        console.error(uploadError);
        setMessage("Erreur pendant l'importation.");
        return;
      }

      const { error: insertError } = await supabase.from("files").insert({
        user_id: user.id,
        folder_id: folderId,
        name: selectedFile.name,
        original_name: selectedFile.name,
        storage_path: filePath,
        file_type: selectedFile.type || "unknown",
        mime_type: selectedFile.type || null,
        size: selectedFile.size,
        is_deleted: false,
        is_favorite: false,
      });

      if (insertError) {
        console.error(insertError);

        await supabase.storage.from("files").remove([filePath]);

        setMessage("Le fichier n'a pas pu être enregistré.");

        return;
      }

      setMessage("Fichier importé avec succès.");

      await loadFolder();

      event.target.value = "";
    } catch (error) {
      console.error(error);
      setMessage("Une erreur est survenue pendant l'importation.");
    } finally {
      setUploading(false);
    }
  };

  // ==================================================
  // APERÇU
  // ==================================================

  const getPreviewKind = (file) => {
    const type = (file?.mime_type || file?.file_type || "").toLowerCase();

    if (type.includes("image")) return "image";
    if (type.includes("video")) return "video";
    if (type.includes("audio")) return "audio";
    if (type.includes("pdf")) return "pdf";

    const name = (file?.name || file?.original_name || "").toLowerCase();

    if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(name)) {
      return "image";
    }

    if (/\.(mp4|webm|ogg|mov)$/.test(name)) {
      return "video";
    }

    if (/\.(mp3|wav|ogg|m4a|aac)$/.test(name)) {
      return "audio";
    }

    if (/\.pdf$/.test(name)) {
      return "pdf";
    }

    return "unsupported";
  };

  const handlePreview = async (file) => {
    try {
      setMenuOpen(null);
      setPreviewFile(file);
      setPreviewUrl("");
      setPreviewLoading(true);
      setMessage("");

      const { data, error } = await supabase.storage
        .from("files")
        .createSignedUrl(file.storage_path, 60 * 60);

      if (error) {
        console.error(error);
        setMessage("Impossible d'ouvrir l'aperçu.");
        setPreviewFile(null);
        return;
      }

      setPreviewUrl(data.signedUrl);
    } catch (error) {
      console.error(error);
      setMessage("Erreur lors de l'ouverture de l'aperçu.");
      setPreviewFile(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    setPreviewFile(null);
    setPreviewUrl("");
    setPreviewLoading(false);
  };

  // ==================================================
  // DÉPLACER FICHIER
  // ==================================================

  const loadMoveFolders = async (file) => {
    try {
      setMoveFile(file);
      setMoveFolderId(file.folder_id || "");
      setMoveFolders([]);
      setLoadingMoveFolders(true);
      setMenuOpen(null);
      setMessage("");

      const { data, error } = await supabase
        .from("folders")
        .select("id, name, parent_id")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

      if (error) {
        console.error(error);
        setMessage("Impossible de charger les dossiers.");
        setMoveFile(null);
        return;
      }

      setMoveFolders(data || []);
    } catch (error) {
      console.error(error);
      setMessage("Erreur lors du chargement des dossiers.");
      setMoveFile(null);
    } finally {
      setLoadingMoveFolders(false);
    }
  };

  const getFolderLabel = (folderItem) => {
    const parents = [];
    let current = folderItem;
    const visited = new Set();

    while (current?.parent_id) {
      if (visited.has(current.parent_id)) break;

      visited.add(current.parent_id);

      const parent = moveFolders.find((item) => item.id === current.parent_id);

      if (!parent) break;

      parents.unshift(parent.name);
      current = parent;
    }

    return [...parents, folderItem.name].join(" / ");
  };

  const handleMoveFile = async () => {
    if (!moveFile || !moveFolderId) {
      setMessage("Veuillez sélectionner un dossier.");
      return;
    }

    if (moveFolderId === moveFile.folder_id) {
      setMessage("Le fichier est déjà dans ce dossier.");
      return;
    }

    try {
      setMovingFile(true);
      setMessage("");

      const { error } = await supabase
        .from("files")
        .update({
          folder_id: moveFolderId,
        })
        .eq("id", moveFile.id)
        .eq("user_id", user.id);

      if (error) {
        console.error(error);
        setMessage("Impossible de déplacer le fichier.");
        return;
      }

      setFiles((currentFiles) =>
        currentFiles.filter((item) => item.id !== moveFile.id),
      );

      setMoveFile(null);
      setMoveFolderId("");

      setMessage("Fichier déplacé avec succès.");
    } catch (error) {
      console.error(error);
      setMessage("Erreur lors du déplacement.");
    } finally {
      setMovingFile(false);
    }
  };

  // ==================================================
  // CORBEILLE
  // ==================================================

  const handleMoveToTrash = async (file) => {
    const confirmed = window.confirm(
      `Voulez-vous déplacer "${file.name}" vers la corbeille ?`,
    );

    if (!confirmed) return;

    try {
      setMenuOpen(null);
      setMessage("");

      const { error } = await supabase
        .from("files")
        .update({
          is_deleted: true,
        })
        .eq("id", file.id)
        .eq("user_id", user.id);

      if (error) {
        console.error(error);
        setMessage("Impossible de déplacer le fichier vers la corbeille.");
        return;
      }

      setFiles((currentFiles) =>
        currentFiles.filter((item) => item.id !== file.id),
      );

      setMessage("Fichier déplacé vers la corbeille.");
    } catch (error) {
      console.error(error);
      setMessage("Erreur lors du déplacement vers la corbeille.");
    }
  };

  // ==================================================
  // TÉLÉCHARGER
  // ==================================================

  const handleDownload = async (file) => {
    try {
      setMenuOpen(null);
      setMessage("");

      const { data, error } = await supabase.storage
        .from("files")
        .download(file.storage_path);

      if (error) {
        console.error(error);
        setMessage("Impossible de télécharger le fichier.");
        return;
      }

      const url = URL.createObjectURL(data);

      const link = document.createElement("a");
      link.href = url;
      link.download = file.name || file.original_name || "fichier";

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      setMessage("Erreur lors du téléchargement.");
    }
  };

  // ==================================================
  // RENOMMER FICHIER
  // ==================================================

  const openRenameModal = (file) => {
    setMenuOpen(null);
    setRenameFile(file);
    setNewName(file.name || "");
  };

  const handleRename = async () => {
    if (!renameFile || !newName.trim()) {
      setMessage("Veuillez saisir un nom.");
      return;
    }

    try {
      const { error } = await supabase
        .from("files")
        .update({
          name: newName.trim(),
        })
        .eq("id", renameFile.id)
        .eq("user_id", user.id);

      if (error) {
        console.error(error);
        setMessage("Impossible de renommer le fichier.");
        return;
      }

      setFiles((currentFiles) =>
        currentFiles.map((file) =>
          file.id === renameFile.id
            ? {
                ...file,
                name: newName.trim(),
              }
            : file,
        ),
      );

      setRenameFile(null);
      setNewName("");

      setMessage("Fichier renommé avec succès.");
    } catch (error) {
      console.error(error);
      setMessage("Erreur lors du renommage.");
    }
  };

  // ==================================================
  // FAVORIS
  // ==================================================

  const handleFavorite = async (file) => {
    try {
      setMenuOpen(null);

      const newFavoriteState = !file.is_favorite;

      const { error } = await supabase
        .from("files")
        .update({
          is_favorite: newFavoriteState,
        })
        .eq("id", file.id)
        .eq("user_id", user.id);

      if (error) {
        console.error(error);
        setMessage("Impossible de modifier les favoris.");
        return;
      }

      setFiles((currentFiles) =>
        currentFiles.map((item) =>
          item.id === file.id
            ? {
                ...item,
                is_favorite: newFavoriteState,
              }
            : item,
        ),
      );

      setMessage(
        newFavoriteState ? "Ajouté aux favoris." : "Retiré des favoris.",
      );
    } catch (error) {
      console.error(error);
      setMessage("Erreur de modification.");
    }
  };

  // ==================================================
  // PARTAGER
  // ==================================================

  const handleShare = async (file) => {
    try {
      setMenuOpen(null);
      setMessage("");

      const { data, error } = await supabase.storage
        .from("files")
        .createSignedUrl(file.storage_path, 60 * 60);

      if (error) {
        console.error(error);
        setMessage("Impossible de créer le lien de partage.");
        return;
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(data.signedUrl);

        setMessage("Lien de partage copié. Il sera valable pendant 1 heure.");
      } else {
        window.prompt("Copiez ce lien :", data.signedUrl);
      }
    } catch (error) {
      console.error(error);
      setMessage("Erreur lors du partage.");
    }
  };

  // ==================================================
  // RECHERCHE
  // ==================================================

  const filteredFiles = files.filter((file) =>
    (file.name || "").toLowerCase().includes(search.toLowerCase()),
  );

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <div className="folder-page">
        <div className="folder-content">
          <div className="folder-loading">
            <div className="folder-loading-spinner" />
            <p>Chargement du dossier...</p>
          </div>
        </div>
      </div>
    );
  }

  // ==================================================
  // DOSSIER INTROUVABLE
  // ==================================================

  if (!folder) {
    return (
      <div className="folder-page">
        <div className="folder-content">
          <Link to="/dashboard" className="folder-back-link">
            <FiArrowLeft />
            Retour au dashboard
          </Link>

          <div className="folder-empty">
            <FiFolder size={48} />
            <h2>Dossier introuvable</h2>
            <p>Ce dossier n'existe pas ou vous n'avez pas accès.</p>
          </div>
        </div>
      </div>
    );
  }

  // ==================================================
  // PAGE
  // ==================================================

  return (
    <div
      className="folder-page"
      onClick={() => {
        setMenuOpen(null);
        setFolderMenuOpen(null);
      }}
    >
      <div className="folder-content">
        {/* BREADCRUMB */}

        <div className="folder-breadcrumb">
          <Link to="/dashboard">Mon espace</Link>

          <span>/</span>

          {parentFolder && (
            <>
              <Link to={`/dashboard/folders/${parentFolder.id}`}>
                {parentFolder.name}
              </Link>

              <span>/</span>
            </>
          )}

          <span>{folder.name}</span>
        </div>

        {/* HEADER */}

        <div className="folder-title-row">
          <div className="folder-title-area">
            <button
              className="folder-back-button"
              onClick={(e) => {
                e.stopPropagation();

                if (parentFolder) {
                  navigate(`/dashboard/folders/${parentFolder.id}`);
                } else {
                  navigate("/dashboard");
                }
              }}
              title="Retour"
            >
              <FiArrowLeft />
            </button>

            <div className="folder-large-icon">
              <FiFolder />
            </div>

            <div className="folder-title-info">
              <h1 className="folder-title">{folder.name}</h1>

              <p>
                {files.length} fichier
                {files.length !== 1 ? "s" : ""}
                {" • "}
                {subfolders.length} dossier
                {subfolders.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* ACTIONS DOSSIER */}

          <div className="folder-header-actions">
            <button
              className="folder-create-button"
              onClick={(e) => {
                e.stopPropagation();
                setShowFolderModal(true);
              }}
            >
              <FiFolder />
              <span>Nouveau dossier</span>
            </button>

            <button
              className="folder-manage-button"
              onClick={(e) => {
                e.stopPropagation();
                openRenameCurrentFolder();
              }}
            >
              <FiEdit2 />
              <span>Renommer</span>
            </button>

            <button
              className="folder-delete-button"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteFolder(folder, true);
              }}
            >
              <FiTrash2 />
              <span>Supprimer</span>
            </button>

            <label className="folder-upload-button">
              <FiUpload />

              <span>
                {uploading ? "Importation..." : "Importer un fichier"}
              </span>

              <input
                type="file"
                hidden
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        {/* MESSAGE */}

        {message && (
          <div className="folder-message">
            <span>{message}</span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setMessage("");
              }}
              aria-label="Fermer"
            >
              <FiX />
            </button>
          </div>
        )}

        {/* RECHERCHE */}

        <div className="folder-toolbar">
          <div className="folder-search">
            <FiSearch />

            <input
              type="text"
              placeholder="Rechercher un fichier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <span className="folder-file-count">
            {filteredFiles.length} fichier
            {filteredFiles.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* SOUS-DOSSIERS */}

        {subfolders.length > 0 && (
          <div className="folder-subfolders-section">
            <div className="folder-section-title">
              <FiFolder />
              <h2>Sous-dossiers</h2>
            </div>

            <div className="folder-subfolders-grid">
              {subfolders.map((subfolder) => (
                <div
                  className="folder-subfolder-card-wrapper"
                  key={subfolder.id}
                >
                  <Link
                    to={`/dashboard/folders/${subfolder.id}`}
                    className="folder-subfolder-card"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="folder-subfolder-icon">
                      <FiFolder />
                    </div>

                    <div className="folder-subfolder-info">
                      <span title={subfolder.name}>{subfolder.name}</span>

                      <small>Ouvrir le dossier</small>
                    </div>
                  </Link>

                  <div
                    className="folder-subfolder-menu"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="folder-subfolder-menu-button"
                      title="Options"
                      onClick={(e) => {
                        e.preventDefault();

                        setFolderMenuOpen(
                          folderMenuOpen === subfolder.id ? null : subfolder.id,
                        );
                      }}
                    >
                      <FiMoreVertical />
                    </button>

                    {folderMenuOpen === subfolder.id && (
                      <div
                        className="folder-action-menu folder-folder-menu"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            setFolderMenuOpen(null);
                            setRenameFolder(subfolder);
                            setNewFolderRename(subfolder.name || "");
                          }}
                        >
                          <FiEdit2 />
                          Renommer
                        </button>

                        <button
                          className="delete-action"
                          onClick={() => handleDeleteFolder(subfolder)}
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
          </div>
        )}

        {/* FICHIERS */}

        <div className="folder-files-section">
          {filteredFiles.length === 0 ? (
            <div className="folder-empty">
              {search ? (
                <>
                  <FiSearch size={42} />

                  <h2>Aucun résultat</h2>

                  <p>Aucun fichier ne correspond à votre recherche.</p>
                </>
              ) : (
                <>
                  <FiFile size={42} />

                  <h2>Ce dossier est vide</h2>

                  <p>Importez votre premier fichier dans ce dossier.</p>

                  <label className="folder-empty-upload">
                    <FiUpload />
                    Importer un fichier
                    <input type="file" hidden onChange={handleUpload} />
                  </label>
                </>
              )}
            </div>
          ) : (
            <div className="folder-table-wrapper">
              <div className="folder-files-table">
                {/* HEADER */}

                <div className="folder-files-table-header">
                  <div>Nom</div>
                  <div>Type</div>
                  <div>Taille</div>
                  <div>Date</div>
                  <div>Actions</div>
                </div>

                {/* LIGNES */}

                {filteredFiles.map((file) => (
                  <div className="folder-file-row" key={file.id}>
                    {/* NOM */}

                    <div className="folder-file-name" data-label="Nom">
                      <button
                        type="button"
                        onClick={() => handlePreview(file)}
                        className="folder-file-icon"
                        title="Aperçu"
                      >
                        {getFileIcon(file)}
                      </button>

                      <div className="folder-file-name-text">
                        <button
                          type="button"
                          onClick={() => handlePreview(file)}
                          title={file.name}
                        >
                          {file.name}
                        </button>

                        {file.is_favorite && (
                          <FiStar
                            className="folder-favorite-active"
                            size={14}
                          />
                        )}
                      </div>
                    </div>

                    {/* TYPE */}

                    <div className="folder-file-type" data-label="Type">
                      {getFileTypeLabel(file)}
                    </div>

                    {/* TAILLE */}

                    <div className="folder-file-size" data-label="Taille">
                      {formatSize(file.size)}
                    </div>

                    {/* DATE */}

                    <div className="folder-file-date" data-label="Date">
                      {formatDate(file.created_at)}
                    </div>

                    {/* ACTIONS */}

                    <div className="folder-file-actions" data-label="Actions">
                      <button
                        className="folder-action-button"
                        title="Télécharger"
                        onClick={() => handleDownload(file)}
                      >
                        <FiDownload />
                      </button>

                      <button
                        className={`folder-action-button ${
                          file.is_favorite ? "is-favorite" : ""
                        }`}
                        title={
                          file.is_favorite
                            ? "Retirer des favoris"
                            : "Ajouter aux favoris"
                        }
                        onClick={() => handleFavorite(file)}
                      >
                        <FiStar />
                      </button>

                      <button
                        className="folder-action-button"
                        title="Partager"
                        onClick={() => handleShare(file)}
                      >
                        <FiShare2 />
                      </button>

                      <div className="folder-menu-container">
                        <button
                          className="folder-action-button"
                          title="Plus"
                          onClick={(e) => {
                            e.stopPropagation();

                            setMenuOpen(menuOpen === file.id ? null : file.id);
                          }}
                        >
                          <FiMoreVertical />
                        </button>

                        {menuOpen === file.id && (
                          <div
                            className="folder-action-menu"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button onClick={() => handlePreview(file)}>
                              <FiEye />
                              Aperçu
                            </button>

                            <button onClick={() => handleDownload(file)}>
                              <FiDownload />
                              Télécharger
                            </button>

                            <button onClick={() => handleShare(file)}>
                              <FiShare2 />
                              Partager
                            </button>

                            <button onClick={() => handleFavorite(file)}>
                              <FiStar />

                              {file.is_favorite
                                ? "Retirer des favoris"
                                : "Ajouter aux favoris"}
                            </button>

                            <button onClick={() => openRenameModal(file)}>
                              <FiEdit2 />
                              Renommer
                            </button>

                            <button onClick={() => loadMoveFolders(file)}>
                              <FiMove />
                              Déplacer
                            </button>

                            <button
                              className="delete-action"
                              onClick={() => handleMoveToTrash(file)}
                            >
                              <FiTrash2 />
                              Corbeille
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================================================
          MODAL APERÇU
      ================================================== */}

      {previewFile && (
        <div
          className="folder-modal-overlay folder-preview-overlay"
          onClick={closePreview}
        >
          <div
            className="folder-modal folder-preview-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="folder-modal-header">
              <div>
                <h2>Aperçu</h2>

                <small>{previewFile.name || previewFile.original_name}</small>
              </div>

              <button onClick={closePreview} aria-label="Fermer">
                <FiX />
              </button>
            </div>

            <div className="folder-preview-body">
              {previewLoading ? (
                <div className="folder-preview-empty">
                  <div className="folder-loading-spinner" />
                  <p>Chargement de l'aperçu...</p>
                </div>
              ) : previewUrl ? (
                (() => {
                  const kind = getPreviewKind(previewFile);

                  if (kind === "image") {
                    return (
                      <img
                        src={previewUrl}
                        alt={previewFile.name || "Aperçu"}
                        className="folder-preview-image"
                      />
                    );
                  }

                  if (kind === "video") {
                    return (
                      <video
                        src={previewUrl}
                        className="folder-preview-video"
                        controls
                        autoPlay
                      />
                    );
                  }

                  if (kind === "audio") {
                    return (
                      <audio
                        src={previewUrl}
                        className="folder-preview-audio"
                        controls
                        autoPlay
                      />
                    );
                  }

                  if (kind === "pdf") {
                    return (
                      <iframe
                        src={previewUrl}
                        title={`Aperçu de ${previewFile.name}`}
                        className="folder-preview-pdf"
                      />
                    );
                  }

                  return (
                    <div className="folder-preview-empty">
                      <FiFile size={48} />

                      <h3>Aperçu non disponible</h3>

                      <p>
                        Ce type de fichier ne peut pas être prévisualisé
                        directement.
                      </p>

                      <button
                        className="folder-modal-confirm"
                        onClick={() => handleDownload(previewFile)}
                      >
                        <FiDownload />
                        Télécharger le fichier
                      </button>
                    </div>
                  );
                })()
              ) : (
                <div className="folder-preview-empty">
                  <FiFile size={48} />
                  <p>Aucun aperçu disponible.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          MODAL DÉPLACER
      ================================================== */}

      {moveFile && (
        <div className="folder-modal-overlay" onClick={() => setMoveFile(null)}>
          <div
            className="folder-modal folder-move-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="folder-modal-header">
              <div>
                <h2>Déplacer le fichier</h2>

                <small title={moveFile.name}>
                  {moveFile.name || moveFile.original_name}
                </small>
              </div>

              <button onClick={() => setMoveFile(null)} aria-label="Fermer">
                <FiX />
              </button>
            </div>

            <div className="folder-modal-body">
              <label htmlFor="move-folder">Choisir un dossier</label>

              {loadingMoveFolders ? (
                <p>Chargement des dossiers...</p>
              ) : moveFolders.length === 0 ? (
                <p>Aucun autre dossier disponible.</p>
              ) : (
                <select
                  id="move-folder"
                  value={moveFolderId}
                  onChange={(e) => setMoveFolderId(e.target.value)}
                >
                  <option value="">Sélectionner un dossier</option>

                  {moveFolders.map((folderItem) => (
                    <option key={folderItem.id} value={folderItem.id}>
                      {getFolderLabel(folderItem)}

                      {folderItem.id === moveFile.folder_id ? " (actuel)" : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="folder-modal-footer">
              <button
                className="folder-modal-cancel"
                onClick={() => setMoveFile(null)}
              >
                Annuler
              </button>

              <button
                className="folder-modal-confirm"
                onClick={handleMoveFile}
                disabled={movingFile || loadingMoveFolders || !moveFolderId}
              >
                <FiMove />

                {movingFile ? "Déplacement..." : "Déplacer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          MODAL NOUVEAU DOSSIER
      ================================================== */}

      {showFolderModal && (
        <div
          className="folder-modal-overlay"
          onClick={() => setShowFolderModal(false)}
        >
          <div className="folder-modal" onClick={(e) => e.stopPropagation()}>
            <div className="folder-modal-header">
              <h2>Nouveau dossier</h2>

              <button onClick={() => setShowFolderModal(false)}>
                <FiX />
              </button>
            </div>

            <div className="folder-modal-body">
              <label>Nom du dossier</label>

              <input
                type="text"
                placeholder="Ex : Documents"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateSubfolder();
                  }
                }}
              />
            </div>

            <div className="folder-modal-footer">
              <button
                className="folder-modal-cancel"
                onClick={() => setShowFolderModal(false)}
              >
                Annuler
              </button>

              <button
                className="folder-modal-confirm"
                onClick={handleCreateSubfolder}
                disabled={creatingFolder}
              >
                {creatingFolder ? "Création..." : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          MODAL RENOMMER FICHIER
      ================================================== */}

      {renameFile && (
        <div
          className="folder-modal-overlay"
          onClick={() => setRenameFile(null)}
        >
          <div className="folder-modal" onClick={(e) => e.stopPropagation()}>
            <div className="folder-modal-header">
              <h2>Renommer le fichier</h2>

              <button onClick={() => setRenameFile(null)}>
                <FiX />
              </button>
            </div>

            <div className="folder-modal-body">
              <label>Nouveau nom</label>

              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleRename();
                  }
                }}
              />
            </div>

            <div className="folder-modal-footer">
              <button
                className="folder-modal-cancel"
                onClick={() => setRenameFile(null)}
              >
                Annuler
              </button>

              <button className="folder-modal-confirm" onClick={handleRename}>
                Renommer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          MODAL RENOMMER DOSSIER
      ================================================== */}

      {renameFolder && (
        <div
          className="folder-modal-overlay"
          onClick={() => setRenameFolder(null)}
        >
          <div className="folder-modal" onClick={(e) => e.stopPropagation()}>
            <div className="folder-modal-header">
              <h2>Renommer le dossier</h2>

              <button onClick={() => setRenameFolder(null)}>
                <FiX />
              </button>
            </div>

            <div className="folder-modal-body">
              <label>Nouveau nom</label>

              <input
                type="text"
                value={newFolderRename}
                onChange={(e) => setNewFolderRename(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleRenameFolder();
                  }
                }}
              />
            </div>

            <div className="folder-modal-footer">
              <button
                className="folder-modal-cancel"
                onClick={() => setRenameFolder(null)}
              >
                Annuler
              </button>

              <button
                className="folder-modal-confirm"
                onClick={handleRenameFolder}
                disabled={renamingFolder}
              >
                {renamingFolder ? "Renommage..." : "Renommer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
