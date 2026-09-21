import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiDownload,
  FiFile,
  FiFileText,
  FiImage,
  FiMusic,
  FiVideo,
  FiAlertCircle,
  FiLoader,
  FiClock,
} from "react-icons/fi";

import { supabase } from "../services/supabase";
import "./ShareFile.css";

function ShareFile() {
  const { token } = useParams();

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [expiresAt, setExpiresAt] = useState(null);

  // ========================================
  // ICÔNE DU FICHIER
  // ========================================
  const getFileIcon = (fileType) => {
    switch (fileType) {
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

  // ========================================
  // FORMATAGE DE LA TAILLE
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
  // FORMATAGE DATE
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
  // CHARGER LE PARTAGE
  // ========================================
  useEffect(() => {
    const loadSharedFile = async () => {
      if (!token) {
        setError("Lien de partage invalide.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        // ----------------------------------------
        // 1. RECHERCHER LE PARTAGE
        // ----------------------------------------
        const { data: share, error: shareError } = await supabase
          .from("shares")
          .select("id, file_id, expires_at")
          .eq("token", token)
          .maybeSingle();

        if (shareError) {
          console.error("Erreur partage :", shareError);
          throw new Error("Impossible de vérifier le lien.");
        }

        if (!share) {
          throw new Error("Ce lien de partage n'existe pas.");
        }

        // ----------------------------------------
        // 2. VÉRIFIER L'EXPIRATION
        // ----------------------------------------
        if (share.expires_at && new Date(share.expires_at) <= new Date()) {
          setExpiresAt(share.expires_at);
          throw new Error("Ce lien de partage a expiré.");
        }

        setExpiresAt(share.expires_at);

        // ----------------------------------------
        // 3. RÉCUPÉRER LE FICHIER
        // ----------------------------------------
        const { data: fileData, error: fileError } = await supabase
          .from("files")
          .select(
            `
            id,
            name,
            original_name,
            storage_path,
            file_type,
            mime_type,
            size,
            is_deleted,
            created_at
          `,
          )
          .eq("id", share.file_id)
          .maybeSingle();

        if (fileError) {
          console.error("Erreur fichier :", fileError);
          throw new Error("Impossible de récupérer le fichier.");
        }

        if (!fileData) {
          throw new Error("Ce fichier n'existe plus.");
        }

        // ----------------------------------------
        // 4. VÉRIFIER SI LE FICHIER EST SUPPRIMÉ
        // ----------------------------------------
        if (fileData.is_deleted) {
          throw new Error("Ce fichier n'est plus disponible.");
        }

        setFile(fileData);
      } catch (err) {
        console.error("Erreur chargement partage :", err);
        setError(err.message || "Ce fichier n'est pas disponible.");
      } finally {
        setLoading(false);
      }
    };

    loadSharedFile();
  }, [token]);

  // ========================================
  // TÉLÉCHARGER LE FICHIER
  // ========================================
  const handleDownload = async () => {
    if (!file || downloading) return;

    // Vérification supplémentaire de l'expiration
    if (expiresAt && new Date(expiresAt) <= new Date()) {
      setError("Ce lien de partage a expiré.");
      setFile(null);
      return;
    }

    try {
      setDownloading(true);
      setError("");

      const { data, error: downloadError } = await supabase.storage
        .from("files")
        .download(file.storage_path);

      if (downloadError) {
        console.error("Erreur téléchargement :", downloadError);
        throw new Error("Impossible de télécharger le fichier.");
      }

      // ----------------------------------------
      // CRÉER LE LIEN DE TÉLÉCHARGEMENT
      // ----------------------------------------
      const url = URL.createObjectURL(data);

      const link = document.createElement("a");
      link.href = url;
      link.download = file.original_name || file.name;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erreur téléchargement :", err);
      setError(err.message || "Impossible de télécharger le fichier.");
    } finally {
      setDownloading(false);
    }
  };

  // ========================================
  // CHARGEMENT
  // ========================================
  if (loading) {
    return (
      <div className="share-file-page">
        <div className="share-file-card share-file-loading">
          <FiLoader className="share-file-spinner" size={40} />

          <h1>Chargement...</h1>

          <p>Vérification du lien de partage en cours.</p>
        </div>
      </div>
    );
  }

  // ========================================
  // ERREUR
  // ========================================
  if (error || !file) {
    return (
      <div className="share-file-page">
        <div className="share-file-card share-file-error">
          <div className="share-file-error-icon">
            <FiAlertCircle />
          </div>

          <h1>Fichier indisponible</h1>

          <p>{error || "Ce fichier n'est plus disponible."}</p>

          {expiresAt && new Date(expiresAt) <= new Date() && (
            <div className="share-file-expired-info">
              <FiClock />

              <span>Ce lien a expiré le {formatDate(expiresAt)}.</span>
            </div>
          )}

          <Link to="/" className="share-file-back-button">
            <FiArrowLeft />
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  // ========================================
  // PAGE PRINCIPALE
  // ========================================
  return (
    <div className="share-file-page">
      {/* LOGO / TITRE */}
      <div className="share-file-brand">
        <div className="shared-files-header">
          <Link
            to="/dashboard"
            className="trash-back-button"
            onClick={(event) => event.stopPropagation()}
          >
            <FiArrowLeft />
            Dashboard
          </Link>
        </div>
        <h1>Cloud Vault</h1>
        <p>Partage de fichier sécurisé</p>
      </div>

      {/* CARTE FICHIER */}
      <div className="share-file-card">
        {/* ICÔNE */}
        <div className="share-file-icon">{getFileIcon(file.file_type)}</div>

        {/* INFORMATIONS */}
        <div className="share-file-content">
          <span className="share-file-label">Fichier partagé</span>

          <h2 title={file.name}>{file.name}</h2>

          <div className="share-file-details">
            <div>
              <span>Taille</span>
              <strong>{formatSize(file.size)}</strong>
            </div>

            <div>
              <span>Type</span>
              <strong>{file.mime_type || file.file_type || "Fichier"}</strong>
            </div>
          </div>

          {/* EXPIRATION */}
          <div className="share-file-expiration">
            <FiClock />

            <span>
              {expiresAt
                ? `Lien valable jusqu'au ${formatDate(expiresAt)}`
                : "Lien sans expiration"}
            </span>
          </div>

          {/* BOUTON DOWNLOAD */}
          <button
            className="share-file-download-button"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? (
              <>
                <FiLoader className="share-file-button-spinner" />
                Téléchargement...
              </>
            ) : (
              <>
                <FiDownload />
                Télécharger le fichier
              </>
            )}
          </button>
        </div>
      </div>

      {/* RETOUR */}
      <Link to="/" className="share-file-home-link">
        <FiArrowLeft />
        Retour à l'accueil
      </Link>

      <p className="share-file-footer">
        Ce fichier a été partagé via Cloud Vault.
      </p>
    </div>
  );
}

export default ShareFile;
