import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiArchive,
  FiChevronDown,
  FiChevronUp,
  FiDownload,
  FiEdit2,
  FiEye,
  FiFile,
  FiFileText,
  FiFolder,
  FiImage,
  FiMoreVertical,
  FiMove,
  FiMusic,
  FiSearch,
  FiShare2,
  FiStar,
  FiTrash2,
  FiUpload,
  FiVideo,
  FiX,
} from "react-icons/fi";

import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";
import "./MyFiles.css";

/* =========================================================
   UTILITAIRES
========================================================= */

const formatSize = (bytes = 0) => {
  if (!bytes) return "0 octets";

  const units = ["octets", "Ko", "Mo", "Go", "To"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );

  return `${(bytes / Math.pow(1024, index)).toFixed(
    index === 0 ? 0 : 2,
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

const getFileIcon = (file) => {
  const mime = file?.mime_type || "";
  const type = file?.file_type || "";

  if (mime.startsWith("image/") || type === "image") {
    return <FiImage />;
  }

  if (mime.startsWith("video/") || type === "video") {
    return <FiVideo />;
  }

  if (mime.startsWith("audio/") || type === "audio") {
    return <FiMusic />;
  }

  if (
    mime.includes("pdf") ||
    mime.includes("document") ||
    mime.includes("text") ||
    type === "document"
  ) {
    return <FiFileText />;
  }

  if (
    mime.includes("zip") ||
    mime.includes("rar") ||
    mime.includes("7z") ||
    type === "archive"
  ) {
    return <FiArchive />;
  }

  return <FiFile />;
};

const getFileCategoryLabel = (type) => {
  switch (type) {
    case "image":
      return "Image";
    case "video":
      return "Vidéo";
    case "audio":
      return "Audio";
    case "document":
      return "Document";
    case "archive":
      return "Archive";
    default:
      return "Autre";
  }
};

const isPreviewable = (file) => {
  const mime = file?.mime_type || "";

  return (
    mime.startsWith("image/") ||
    mime.startsWith("video/") ||
    mime.startsWith("audio/") ||
    mime === "application/pdf"
  );
};

const generateShareToken = () => {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}-${Math.random().toString(36).slice(2)}`;
};

const copyToClipboard = async (text) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");

  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";

  document.body.appendChild(textarea);
  textarea.select();

  document.execCommand("copy");

  textarea.remove();
};

/* =========================================================
   PAGE
========================================================= */

export default function MyFiles() {
  const { user } = useAuth();

  /* =======================================================
     DONNÉES
  ======================================================= */

  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);

  /* =======================================================
     RECHERCHE / FILTRES
  ======================================================= */

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  /* =======================================================
     SÉLECTION
  ======================================================= */

  const [selectedFiles, setSelectedFiles] = useState([]);

  /* =======================================================
     MENU
  ======================================================= */

  const [openMenuId, setOpenMenuId] = useState(null);

  /* =======================================================
     APERÇU
  ======================================================= */

  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  /* =======================================================
     RENOMMAGE
  ======================================================= */

  const [renameFile, setRenameFile] = useState(null);
  const [newFileName, setNewFileName] = useState("");
  const [renaming, setRenaming] = useState(false);

  /* =======================================================
     DÉPLACEMENT
  ======================================================= */

  const [moveTarget, setMoveTarget] = useState(null);
  const [selectedMoveFolder, setSelectedMoveFolder] = useState(null);
  const [moving, setMoving] = useState(false);

  /* =======================================================
     UPLOAD
  ======================================================= */

  const [uploading, setUploading] = useState(false);

  /* =======================================================
     MESSAGE
  ======================================================= */

  const [message, setMessage] = useState("");
  const messageTimerRef = useRef(null);

  const showMessage = useCallback((text) => {
    setMessage(text);

    if (messageTimerRef.current) {
      clearTimeout(messageTimerRef.current);
    }

    messageTimerRef.current = setTimeout(() => {
      setMessage("");
    }, 3500);
  }, []);

  useEffect(() => {
    return () => {
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
      }
    };
  }, []);

  /* =======================================================
     CHARGEMENT
  ======================================================= */

  const loadFiles = useCallback(async () => {
    if (!user) {
      setFiles([]);
      setFolders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [
        { data: filesData, error: filesError },
        { data: foldersData, error: foldersError },
      ] = await Promise.all([
        supabase
          .from("files")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false }),

        supabase
          .from("folders")
          .select("*")
          .eq("user_id", user.id)
          .order("name", { ascending: true }),
      ]);

      if (filesError) throw filesError;
      if (foldersError) throw foldersError;

      setFiles(filesData || []);
      setFolders(foldersData || []);
    } catch (error) {
      console.error("Erreur chargement fichiers :", error);
      showMessage("Impossible de charger vos fichiers.");
    } finally {
      setLoading(false);
    }
  }, [user, showMessage]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  /* =======================================================
     DOSSIER
  ======================================================= */

  const getFolderName = useCallback(
    (folderId) => {
      if (!folderId) return "Mon espace";

      const folder = folders.find((item) => item.id === folderId);

      return folder?.name || "Dossier inconnu";
    },
    [folders],
  );

  /* =======================================================
     FILTRAGE
  ======================================================= */

  const filteredFiles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return files.filter((file) => {
      const matchesSearch =
        !query ||
        file.name?.toLowerCase().includes(query) ||
        file.original_name?.toLowerCase().includes(query);

      const matchesType = filterType === "all" || file.file_type === filterType;

      return matchesSearch && matchesType;
    });
  }, [files, search, filterType]);

  /* =======================================================
     SÉLECTION
  ======================================================= */

  const toggleFileSelection = (fileId) => {
    setSelectedFiles((current) =>
      current.includes(fileId)
        ? current.filter((id) => id !== fileId)
        : [...current, fileId],
    );
  };

  const toggleSelectAll = () => {
    const visibleIds = filteredFiles.map((file) => file.id);

    if (!visibleIds.length) return;

    const allSelected = visibleIds.every((id) => selectedFiles.includes(id));

    if (allSelected) {
      setSelectedFiles((current) =>
        current.filter((id) => !visibleIds.includes(id)),
      );
    } else {
      setSelectedFiles((current) => [...new Set([...current, ...visibleIds])]);
    }
  };

  const clearSelection = () => {
    setSelectedFiles([]);
  };

  /* =======================================================
     MENU
  ======================================================= */

  const toggleMenu = (fileId) => {
    setOpenMenuId((current) => (current === fileId ? null : fileId));
  };

  const closeMenu = () => {
    setOpenMenuId(null);
  };

  /* =======================================================
     DOWNLOAD
  ======================================================= */

  const handleDownload = async (file) => {
    try {
      closeMenu();

      const { data, error } = await supabase.storage
        .from("files")
        .download(file.storage_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);

      const link = document.createElement("a");

      link.href = url;
      link.download = file.original_name || file.name;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur téléchargement :", error);
      showMessage("Impossible de télécharger le fichier.");
    }
  };

  /* =======================================================
     APERÇU
  ======================================================= */

  const handlePreview = async (file) => {
    closeMenu();

    if (!isPreviewable(file)) {
      await handleDownload(file);
      return;
    }

    try {
      setLoadingPreview(true);
      setPreviewFile(file);

      const { data, error } = await supabase.storage
        .from("files")
        .createSignedUrl(file.storage_path, 3600);

      if (error) throw error;

      setPreviewUrl(data?.signedUrl || null);
    } catch (error) {
      console.error("Erreur aperçu :", error);

      setPreviewFile(null);
      setPreviewUrl(null);

      showMessage("Impossible d'ouvrir l'aperçu.");
    } finally {
      setLoadingPreview(false);
    }
  };

  const closePreview = () => {
    setPreviewFile(null);
    setPreviewUrl(null);
  };

  /* =======================================================
     FAVORI
  ======================================================= */

  const handleFavorite = async (file) => {
    try {
      closeMenu();

      const newValue = !file.is_favorite;

      const { error } = await supabase
        .from("files")
        .update({
          is_favorite: newValue,
        })
        .eq("id", file.id)
        .eq("user_id", user.id);

      if (error) throw error;

      setFiles((current) =>
        current.map((item) =>
          item.id === file.id ? { ...item, is_favorite: newValue } : item,
        ),
      );

      showMessage(
        newValue
          ? "Fichier ajouté aux favoris."
          : "Fichier retiré des favoris.",
      );
    } catch (error) {
      console.error("Erreur favori :", error);
      showMessage("Impossible de modifier le favori.");
    }
  };

  const handleBulkFavorite = async () => {
    if (!selectedFiles.length) return;

    try {
      const { error } = await supabase
        .from("files")
        .update({
          is_favorite: true,
        })
        .in("id", selectedFiles)
        .eq("user_id", user.id);

      if (error) throw error;

      setFiles((current) =>
        current.map((file) =>
          selectedFiles.includes(file.id)
            ? { ...file, is_favorite: true }
            : file,
        ),
      );

      showMessage(`${selectedFiles.length} fichier(s) ajouté(s) aux favoris.`);

      clearSelection();
    } catch (error) {
      console.error("Erreur favoris :", error);
      showMessage("Impossible de modifier les favoris.");
    }
  };

  /* =======================================================
     CORBEILLE
  ======================================================= */

  const handleDelete = async (file) => {
    closeMenu();

    const confirmed = window.confirm(
      `Déplacer "${file.name}" vers la corbeille ?`,
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("files")
        .update({
          is_deleted: true,
        })
        .eq("id", file.id)
        .eq("user_id", user.id);

      if (error) throw error;

      setFiles((current) => current.filter((item) => item.id !== file.id));

      setSelectedFiles((current) => current.filter((id) => id !== file.id));

      showMessage("Fichier déplacé vers la corbeille.");
    } catch (error) {
      console.error("Erreur suppression :", error);
      showMessage("Impossible de déplacer le fichier.");
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedFiles.length) return;

    const confirmed = window.confirm(
      `Déplacer ${selectedFiles.length} fichier(s) vers la corbeille ?`,
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("files")
        .update({
          is_deleted: true,
        })
        .in("id", selectedFiles)
        .eq("user_id", user.id);

      if (error) throw error;

      setFiles((current) =>
        current.filter((file) => !selectedFiles.includes(file.id)),
      );

      showMessage(
        `${selectedFiles.length} fichier(s) déplacé(s) vers la corbeille.`,
      );

      clearSelection();
    } catch (error) {
      console.error("Erreur suppression multiple :", error);
      showMessage("Impossible de supprimer les fichiers.");
    }
  };

  /* =======================================================
     RENOMMAGE
  ======================================================= */

  const openRenameModal = (file) => {
    closeMenu();

    setRenameFile(file);
    setNewFileName(file.name || "");
  };

  const closeRenameModal = () => {
    setRenameFile(null);
    setNewFileName("");
  };

  const handleRename = async () => {
    const cleanName = newFileName.trim();

    if (!renameFile) return;

    if (!cleanName) {
      showMessage("Le nom du fichier est obligatoire.");
      return;
    }

    try {
      setRenaming(true);

      const { error } = await supabase
        .from("files")
        .update({
          name: cleanName,
        })
        .eq("id", renameFile.id)
        .eq("user_id", user.id);

      if (error) throw error;

      setFiles((current) =>
        current.map((file) =>
          file.id === renameFile.id ? { ...file, name: cleanName } : file,
        ),
      );

      closeRenameModal();

      showMessage("Fichier renommé avec succès.");
    } catch (error) {
      console.error("Erreur renommage :", error);
      showMessage("Impossible de renommer le fichier.");
    } finally {
      setRenaming(false);
    }
  };

  /* =======================================================
     PARTAGE
  ======================================================= */

  const handleShare = async (file) => {
    try {
      closeMenu();

      const token = generateShareToken();

      const { data, error } = await supabase
        .from("shares")
        .insert({
          owner_id: user.id,
          file_id: file.id,
          token,
          expires_at: null,
        })
        .select("token")
        .single();

      if (error) throw error;

      const shareUrl = `${window.location.origin}/share/${data.token}`;

      await copyToClipboard(shareUrl);

      showMessage("Lien de partage copié.");
    } catch (error) {
      console.error("Erreur partage :", error);
      showMessage("Impossible de créer le lien de partage.");
    }
  };

  /* =======================================================
     DÉPLACEMENT
  ======================================================= */

  const openMoveModal = (file) => {
    closeMenu();

    setMoveTarget({
      type: "single",
      file,
    });

    setSelectedMoveFolder(file.folder_id || null);
  };

  const openBulkMoveModal = () => {
    if (!selectedFiles.length) return;

    setMoveTarget({
      type: "bulk",
      count: selectedFiles.length,
    });

    setSelectedMoveFolder(null);
  };

  const closeMoveModal = () => {
    setMoveTarget(null);
    setSelectedMoveFolder(null);
  };

  const handleMove = async () => {
    if (!moveTarget) return;

    try {
      setMoving(true);

      const folderId = selectedMoveFolder || null;

      if (moveTarget.type === "single") {
        const file = moveTarget.file;

        const { error } = await supabase
          .from("files")
          .update({
            folder_id: folderId,
          })
          .eq("id", file.id)
          .eq("user_id", user.id);

        if (error) throw error;

        setFiles((current) =>
          current.map((item) =>
            item.id === file.id ? { ...item, folder_id: folderId } : item,
          ),
        );

        closeMoveModal();

        showMessage("Fichier déplacé avec succès.");

        return;
      }

      const { error } = await supabase
        .from("files")
        .update({
          folder_id: folderId,
        })
        .in("id", selectedFiles)
        .eq("user_id", user.id);

      if (error) throw error;

      setFiles((current) =>
        current.map((file) =>
          selectedFiles.includes(file.id)
            ? { ...file, folder_id: folderId }
            : file,
        ),
      );

      const count = selectedFiles.length;

      clearSelection();
      closeMoveModal();

      showMessage(`${count} fichier(s) déplacé(s) avec succès.`);
    } catch (error) {
      console.error("Erreur déplacement :", error);
      showMessage("Impossible de déplacer le fichier.");
    } finally {
      setMoving(false);
    }
  };

  /* =======================================================
     UPLOAD
  ======================================================= */

  const handleUpload = async (event) => {
    const selectedFile = event.target.files?.[0];

    event.target.value = "";

    if (!selectedFile || !user) return;

    try {
      setUploading(true);

      const safeName = selectedFile.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]/g, "_");

      const storagePath = `${user.id}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("files")
        .upload(storagePath, selectedFile);

      if (uploadError) throw uploadError;

      let fileType = "other";

      if (selectedFile.type.startsWith("image/")) {
        fileType = "image";
      } else if (selectedFile.type.startsWith("video/")) {
        fileType = "video";
      } else if (selectedFile.type.startsWith("audio/")) {
        fileType = "audio";
      } else if (
        selectedFile.type.includes("pdf") ||
        selectedFile.type.includes("document") ||
        selectedFile.type.includes("text")
      ) {
        fileType = "document";
      } else if (
        selectedFile.type.includes("zip") ||
        selectedFile.type.includes("rar") ||
        selectedFile.type.includes("7z")
      ) {
        fileType = "archive";
      }

      const { data, error: insertError } = await supabase
        .from("files")
        .insert({
          user_id: user.id,
          folder_id: null,
          name: selectedFile.name,
          original_name: selectedFile.name,
          storage_path: storagePath,
          file_type: fileType,
          mime_type: selectedFile.type || "application/octet-stream",
          size: selectedFile.size,
          is_deleted: false,
          is_favorite: false,
        })
        .select()
        .single();

      if (insertError) {
        await supabase.storage.from("files").remove([storagePath]);

        throw insertError;
      }

      setFiles((current) => [data, ...current]);

      showMessage("Fichier envoyé avec succès.");
    } catch (error) {
      console.error("Erreur upload :", error);
      showMessage("Impossible d'envoyer le fichier.");
    } finally {
      setUploading(false);
    }
  };

  /* =======================================================
     CHARGEMENT
  ======================================================= */

  if (loading) {
    return (
      <div className="my-files-page">
        <div className="my-files-loading">
          <div className="my-files-spinner" />
          <p>Chargement de vos fichiers...</p>
        </div>
      </div>
    );
  }

  /* =======================================================
     RENDU
  ======================================================= */

  return (
    <div className="my-files-page" onClick={closeMenu}>
      {/* HEADER */}

      <header className="my-files-header">
        <div className="my-files-header-left">
          <Link
            to="/dashboard"
            className="my-files-back-button"
            onClick={(event) => event.stopPropagation()}
          >
            <FiArrowLeft />
            <span>Tableau de bord</span>
          </Link>

          <div>
            <h1>Mes fichiers</h1>
            <p>Gérez vos fichiers personnels depuis un seul endroit.</p>
          </div>
        </div>

        <label
          className={`my-files-upload-button ${uploading ? "is-loading" : ""}`}
          onClick={(event) => event.stopPropagation()}
        >
          <FiUpload />

          <span>{uploading ? "Envoi..." : "Ajouter un fichier"}</span>

          <input
            type="file"
            hidden
            disabled={uploading}
            onChange={handleUpload}
          />
        </label>
      </header>

      {/* MESSAGE */}

      {message && (
        <div
          className="my-files-message"
          onClick={(event) => event.stopPropagation()}
        >
          <span>{message}</span>

          <button type="button" onClick={() => setMessage("")}>
            <FiX />
          </button>
        </div>
      )}

      {/* TOOLBAR */}

      <div
        className="my-files-toolbar"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="my-files-search">
          <FiSearch />

          <input
            type="text"
            placeholder="Rechercher un fichier..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          {search && (
            <button type="button" onClick={() => setSearch("")}>
              <FiX />
            </button>
          )}
        </div>

        <button
          type="button"
          className="my-files-filter-button"
          onClick={() => setShowFilters((current) => !current)}
        >
          {showFilters ? <FiChevronUp /> : <FiChevronDown />}
          Filtres
        </button>

        <div className="my-files-count">
          {filteredFiles.length} fichier
          {filteredFiles.length > 1 ? "s" : ""}
        </div>
      </div>

      {/* FILTRES */}

      {showFilters && (
        <div
          className="my-files-filters"
          onClick={(event) => event.stopPropagation()}
        >
          {[
            ["all", "Tous"],
            ["image", "Images"],
            ["video", "Vidéos"],
            ["audio", "Audio"],
            ["document", "Documents"],
            ["archive", "Archives"],
            ["other", "Autres"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={filterType === value ? "active" : ""}
              onClick={() => setFilterType(value)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ACTIONS MULTIPLES */}

      {selectedFiles.length > 0 && (
        <div
          className="my-files-bulk-actions"
          onClick={(event) => event.stopPropagation()}
        >
          <span>
            {selectedFiles.length} sélectionné
            {selectedFiles.length > 1 ? "s" : ""}
          </span>

          <div className="my-files-bulk-buttons">
            <button type="button" onClick={handleBulkFavorite}>
              <FiStar />
              Favoris
            </button>

            <button type="button" onClick={openBulkMoveModal}>
              <FiMove />
              Déplacer
            </button>

            <button type="button" className="danger" onClick={handleBulkDelete}>
              <FiTrash2 />
              Corbeille
            </button>

            <button type="button" className="cancel" onClick={clearSelection}>
              <FiX />
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* CONTENU */}

      {filteredFiles.length === 0 ? (
        <div className="my-files-empty">
          <div className="my-files-empty-icon">
            <FiFolder />
          </div>

          <h2>
            {search || filterType !== "all"
              ? "Aucun fichier trouvé"
              : "Aucun fichier"}
          </h2>

          <p>
            {search || filterType !== "all"
              ? "Essayez de modifier votre recherche ou vos filtres."
              : "Commencez par ajouter votre premier fichier."}
          </p>

          {!search && filterType === "all" && (
            <label className="my-files-empty-upload">
              <FiUpload />
              Ajouter un fichier
              <input type="file" hidden onChange={handleUpload} />
            </label>
          )}
        </div>
      ) : (
        <>
          {/* =================================================
             DESKTOP : TABLEAU
          ================================================= */}

          <div
            className="my-files-table-container my-files-desktop"
            onClick={(event) => event.stopPropagation()}
          >
            <table className="my-files-table">
              <thead>
                <tr>
                  <th className="checkbox-column">
                    <input
                      type="checkbox"
                      checked={
                        filteredFiles.length > 0 &&
                        filteredFiles.every((file) =>
                          selectedFiles.includes(file.id),
                        )
                      }
                      onChange={toggleSelectAll}
                    />
                  </th>

                  <th>Nom</th>
                  <th>Type</th>
                  <th>Dossier</th>
                  <th>Taille</th>
                  <th>Date</th>
                  <th className="actions-column">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredFiles.map((file) => (
                  <tr key={file.id}>
                    <td className="checkbox-column">
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.id)}
                        onChange={() => toggleFileSelection(file.id)}
                      />
                    </td>

                    <td>
                      <div className="my-files-name-cell">
                        <div
                          type="button"
                          onClick={() => handlePreview(file)}
                          className="my-files-file-icon"
                        >
                          {getFileIcon(file)}
                        </div>

                        <div className="my-files-name-info">
                          <span
                            type="button"
                            onClick={() => handlePreview(file)}
                            className="my-files-file-name"
                            title={file.name}
                          >
                            {file.name}
                          </span>

                          {file.is_favorite && (
                            <FiStar className="my-files-favorite-icon" />
                          )}
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="my-files-type">
                        {getFileCategoryLabel(file.file_type)}
                      </span>
                    </td>

                    <td>
                      <span className="my-files-folder-name">
                        <FiFolder />
                        {getFolderName(file.folder_id)}
                      </span>
                    </td>

                    <td>{formatSize(file.size)}</td>

                    <td>{formatDate(file.created_at)}</td>

                    <td className="actions-column">
                      <div
                        className="my-files-menu-container"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="my-files-menu-button"
                          onClick={() => toggleMenu(file.id)}
                        >
                          <FiMoreVertical />
                        </button>

                        {openMenuId === file.id && (
                          <FileActionMenu
                            file={file}
                            handlePreview={handlePreview}
                            handleDownload={handleDownload}
                            handleShare={handleShare}
                            handleFavorite={handleFavorite}
                            openRenameModal={openRenameModal}
                            openMoveModal={openMoveModal}
                            handleDelete={handleDelete}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* =================================================
             MOBILE : CARTES
          ================================================= */}

          <div
            className="my-files-mobile"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="my-files-mobile-select-all">
              <label>
                <input
                  type="checkbox"
                  checked={
                    filteredFiles.length > 0 &&
                    filteredFiles.every((file) =>
                      selectedFiles.includes(file.id),
                    )
                  }
                  onChange={toggleSelectAll}
                />

                <span>Sélectionner tout</span>
              </label>

              <strong>
                {filteredFiles.length} fichier
                {filteredFiles.length > 1 ? "s" : ""}
              </strong>
            </div>

            <div className="my-files-mobile-list">
              {filteredFiles.map((file) => (
                <article className="my-files-mobile-card" key={file.id}>
                  <div className="my-files-mobile-top">
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file.id)}
                      onChange={() => toggleFileSelection(file.id)}
                    />

                    <div className="my-files-mobile-file-icon">
                      {getFileIcon(file)}
                    </div>

                    <div className="my-files-mobile-info">
                      <div className="my-files-mobile-name-row">
                        <h3 title={file.name}>{file.name}</h3>

                        {file.is_favorite && (
                          <FiStar className="my-files-mobile-star" />
                        )}
                      </div>

                      <span>{getFileCategoryLabel(file.file_type)}</span>
                    </div>

                    <div
                      className="my-files-mobile-menu"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="my-files-menu-button"
                        onClick={() => toggleMenu(file.id)}
                      >
                        <FiMoreVertical />
                      </button>

                      {openMenuId === file.id && (
                        <FileActionMenu
                          file={file}
                          handlePreview={handlePreview}
                          handleDownload={handleDownload}
                          handleShare={handleShare}
                          handleFavorite={handleFavorite}
                          openRenameModal={openRenameModal}
                          openMoveModal={openMoveModal}
                          handleDelete={handleDelete}
                        />
                      )}
                    </div>
                  </div>

                  <div className="my-files-mobile-details">
                    <div>
                      <span>Dossier</span>
                      <strong>
                        <FiFolder />
                        {getFolderName(file.folder_id)}
                      </strong>
                    </div>

                    <div>
                      <span>Taille</span>
                      <strong>{formatSize(file.size)}</strong>
                    </div>

                    <div>
                      <span>Date</span>
                      <strong>{formatDate(file.created_at)}</strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </>
      )}

      {/* =================================================
         MODAL APERÇU
      ================================================= */}

      {previewFile && (
        <div className="my-files-modal-overlay" onClick={closePreview}>
          <div
            className="my-files-preview-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="my-files-modal-header">
              <div>
                <h2>{previewFile.name}</h2>
                <span>{formatSize(previewFile.size)}</span>
              </div>

              <button type="button" onClick={closePreview}>
                <FiX />
              </button>
            </div>

            <div className="my-files-preview-content">
              {loadingPreview ? (
                <div className="my-files-preview-loading">
                  Chargement de l'aperçu...
                </div>
              ) : previewUrl ? (
                <>
                  {previewFile.mime_type?.startsWith("image/") && (
                    <img src={previewUrl} alt={previewFile.name} />
                  )}

                  {previewFile.mime_type?.startsWith("video/") && (
                    <video src={previewUrl} controls />
                  )}

                  {previewFile.mime_type?.startsWith("audio/") && (
                    <audio src={previewUrl} controls />
                  )}

                  {previewFile.mime_type === "application/pdf" && (
                    <iframe src={previewUrl} title={previewFile.name} />
                  )}
                </>
              ) : (
                <div className="my-files-preview-loading">
                  Aucun aperçu disponible.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================
         MODAL RENOMMAGE
      ================================================= */}

      {renameFile && (
        <div className="my-files-modal-overlay" onClick={closeRenameModal}>
          <div
            className="my-files-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="my-files-modal-header">
              <h2>Renommer le fichier</h2>

              <button type="button" onClick={closeRenameModal}>
                <FiX />
              </button>
            </div>

            <div className="my-files-modal-body">
              <label htmlFor="file-name">Nouveau nom</label>

              <input
                id="file-name"
                type="text"
                value={newFileName}
                onChange={(event) => setNewFileName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleRename();
                  }
                }}
                autoFocus
              />
            </div>

            <div className="my-files-modal-footer">
              <button
                type="button"
                className="modal-cancel"
                onClick={closeRenameModal}
              >
                Annuler
              </button>

              <button
                type="button"
                className="modal-confirm"
                onClick={handleRename}
                disabled={renaming}
              >
                {renaming ? "Enregistrement..." : "Renommer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================
         MODAL DÉPLACEMENT
      ================================================= */}

      {moveTarget && (
        <div className="my-files-modal-overlay" onClick={closeMoveModal}>
          <div
            className="my-files-modal my-files-move-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="my-files-modal-header">
              <h2>Déplacer</h2>

              <button type="button" onClick={closeMoveModal}>
                <FiX />
              </button>
            </div>

            <div className="my-files-modal-body">
              <p className="my-files-move-description">
                {moveTarget.type === "single"
                  ? `Déplacer "${moveTarget.file.name}" vers :`
                  : `Déplacer ${moveTarget.count} fichier(s) vers :`}
              </p>

              <div className="my-files-folder-list">
                <button
                  type="button"
                  className={selectedMoveFolder === null ? "selected" : ""}
                  onClick={() => setSelectedMoveFolder(null)}
                >
                  <FiFolder />
                  <span>Mon espace</span>
                </button>

                {folders.length > 0 ? (
                  folders.map((folder) => (
                    <button
                      key={folder.id}
                      type="button"
                      className={
                        selectedMoveFolder === folder.id ? "selected" : ""
                      }
                      onClick={() => setSelectedMoveFolder(folder.id)}
                    >
                      <FiFolder />
                      <span>{folder.name}</span>
                    </button>
                  ))
                ) : (
                  <p className="my-files-no-folders">
                    Aucun dossier disponible.
                  </p>
                )}
              </div>
            </div>

            <div className="my-files-modal-footer">
              <button
                type="button"
                className="modal-cancel"
                onClick={closeMoveModal}
              >
                Annuler
              </button>

              <button
                type="button"
                className="modal-confirm"
                onClick={handleMove}
                disabled={moving}
              >
                {moving ? "Déplacement..." : "Déplacer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   MENU D'ACTIONS RÉUTILISABLE
========================================================= */

function FileActionMenu({
  file,
  handlePreview,
  handleDownload,
  handleShare,
  handleFavorite,
  openRenameModal,
  openMoveModal,
  handleDelete,
}) {
  return (
    <div className="my-files-action-menu">
      <button type="button" onClick={() => handlePreview(file)}>
        <FiEye />
        {isPreviewable(file) ? "Aperçu" : "Ouvrir"}
      </button>

      <button type="button" onClick={() => handleDownload(file)}>
        <FiDownload />
        Télécharger
      </button>

      <button type="button" onClick={() => handleShare(file)}>
        <FiShare2 />
        Partager
      </button>

      <button type="button" onClick={() => handleFavorite(file)}>
        <FiStar />
        {file.is_favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
      </button>

      <button type="button" onClick={() => openRenameModal(file)}>
        <FiEdit2 />
        Renommer
      </button>

      <button type="button" onClick={() => openMoveModal(file)}>
        <FiMove />
        Déplacer
      </button>

      <button
        type="button"
        className="delete-action"
        onClick={() => handleDelete(file)}
      >
        <FiTrash2 />
        Corbeille
      </button>
    </div>
  );
}
