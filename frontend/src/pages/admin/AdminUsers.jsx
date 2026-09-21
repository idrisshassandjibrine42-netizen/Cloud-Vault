import { useEffect, useState } from "react";
import {
  FiArrowLeft,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiUsers,
  FiX,
  FiRefreshCw,
  FiEye,
  FiEyeOff,
  FiLock,
} from "react-icons/fi";
import { Link } from "react-router-dom";

import { supabase } from "../../services/supabase";
import "./AdminUsers.css";

function AdminUsers() {
  // ============================================================
  // ÉTATS
  // ============================================================

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ============================================================
  // CHARGER LES UTILISATEURS
  // ============================================================

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error: usersError } = await supabase
        .from("profiles")
        .select(
          "id, full_name, email, role, storage_limit, storage_used, created_at",
        )
        .eq("role", "user")
        .order("created_at", {
          ascending: false,
        });

      if (usersError) {
        throw usersError;
      }

      setUsers(data || []);
    } catch (err) {
      console.error("Erreur chargement utilisateurs :", err);

      setError(
        err?.message || "Impossible de charger la liste des utilisateurs.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // OUVRIR LE MODAL
  // ============================================================

  const openCreateModal = () => {
    setError("");
    setSuccess("");

    setForm({
      fullName: "",
      email: "",
      password: "",
    });

    setShowPassword(false);
    setShowModal(true);
  };

  // ============================================================
  // FERMER LE MODAL
  // ============================================================

  const closeCreateModal = () => {
    if (saving) return;

    setShowModal(false);
    setShowPassword(false);

    setForm({
      fullName: "",
      email: "",
      password: "",
    });
  };

  // ============================================================
  // CRÉER UN UTILISATEUR
  // ============================================================

  const createUser = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const fullName = form.fullName.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password;
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    console.log("SESSION :", sessionData);
    console.log("SESSION ERROR :", sessionError);
    console.log(
      "TOKEN :",
      sessionData?.session?.access_token ? "PRÉSENT" : "ABSENT",
    );

    // Validation
    if (!fullName || !email || !password) {
      setError("Tous les champs sont obligatoires.");
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setSaving(true);

    try {
      // ----------------------------------------------------------
      // Vérifier la session administrateur
      // ----------------------------------------------------------

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session?.access_token) {
        throw new Error(
          "Votre session administrateur a expiré. Veuillez vous reconnecter.",
        );
      }

      // ----------------------------------------------------------
      // Appeler l'Edge Function Supabase
      // ----------------------------------------------------------

      const { data, error: functionError } = await supabase.functions.invoke(
        "admin-users",
        {
          body: {
            action: "create",
            fullName,
            email,
            password,
          },
        },
      );

      console.log("Réponse création utilisateur :", data);
      console.log("Erreur Edge Function :", functionError);

      if (functionError) {
        console.error("Erreur Edge Function admin-users :", functionError);

        throw new Error(
          functionError.message ||
            "Impossible de contacter le service de création.",
        );
      }

      // L'Edge Function peut retourner son propre message d'erreur
      if (data?.error) {
        throw new Error(data.error);
      }

      // ----------------------------------------------------------
      // Succès
      // ----------------------------------------------------------

      setSuccess("Compte utilisateur créé avec succès.");

      setForm({
        fullName: "",
        email: "",
        password: "",
      });

      setShowPassword(false);
      setShowModal(false);

      await loadUsers();

      // Faire disparaître le message après quelques secondes
      window.setTimeout(() => {
        setSuccess("");
      }, 4000);
    } catch (err) {
      console.error("Erreur création utilisateur :", err);

      setError(err?.message || "Impossible de créer le compte utilisateur.");
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // SUPPRIMER UN UTILISATEUR
  // ============================================================

  const deleteUser = async (userId, userName) => {
    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer le compte de ${
        userName || "cet utilisateur"
      } ?`,
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session?.access_token) {
        throw new Error(
          "Votre session administrateur a expiré. Veuillez vous reconnecter.",
        );
      }

      const { data, error: functionError } = await supabase.functions.invoke(
        "admin-users",
        {
          body: {
            action: "delete",
            userId,
          },
        },
      );

      console.log("Réponse suppression :", data);

      if (functionError) {
        console.error("Erreur Edge Function suppression :", functionError);

        throw new Error(
          functionError.message || "Impossible de supprimer le compte.",
        );
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setSuccess("Compte utilisateur supprimé avec succès.");

      await loadUsers();

      window.setTimeout(() => {
        setSuccess("");
      }, 4000);
    } catch (err) {
      console.error("Erreur suppression utilisateur :", err);

      setError(
        err?.message || "Impossible de supprimer le compte utilisateur.",
      );
    }
  };

  // ============================================================
  // RECHERCHE
  // ============================================================

  const filteredUsers = users.filter((user) => {
    const text = `
      ${user.full_name || ""}
      ${user.email || ""}
    `.toLowerCase();

    return text.includes(search.toLowerCase());
  });

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // ============================================================
  // FORMAT STOCKAGE
  // ============================================================

  const formatBytes = (bytes) => {
    if (!bytes || bytes <= 0) {
      return "0 B";
    }

    const units = ["B", "KB", "MB", "GB", "TB"];

    const index = Math.min(
      Math.floor(Math.log(bytes) / Math.log(1024)),
      units.length - 1,
    );

    return `${(bytes / Math.pow(1024, index)).toFixed(
      index === 0 ? 0 : 1,
    )} ${units[index]}`;
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="admin-users-page">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="admin-users-header">
        {/* Retour */}

        <Link to="/admin" className="admin-refresh-button">
          <FiArrowLeft />
          <span>Dashboard</span>
        </Link>

        {/* Titre */}

        <div className="admin-users-title">
          <h1>
            <FiUsers />
            Utilisateurs
          </h1>

          <p>Gestion des comptes utilisateurs de Cloud Vault.</p>
        </div>

        {/* Actions */}

        <div className="admin-users-header-actions">
          <button
            type="button"
            className="admin-refresh-button"
            onClick={loadUsers}
            disabled={loading}
          >
            <FiRefreshCw className={loading ? "admin-refresh-spinning" : ""} />

            <span>Actualiser</span>
          </button>

          <button
            type="button"
            className="admin-create-button"
            onClick={openCreateModal}
          >
            <FiPlus />
            <span>Créer un compte</span>
          </button>
        </div>
      </div>

      {/* ======================================================
          ALERTES
      ====================================================== */}

      {error && <div className="admin-users-alert error">{error}</div>}

      {success && <div className="admin-users-alert success">{success}</div>}

      {/* ======================================================
          BARRE DE RECHERCHE
      ====================================================== */}

      <div className="admin-users-toolbar">
        <div className="admin-search">
          <FiSearch />

          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          {search && (
            <button
              type="button"
              className="admin-search-clear"
              onClick={() => setSearch("")}
              aria-label="Effacer la recherche"
            >
              <FiX />
            </button>
          )}
        </div>

        <span className="admin-users-count">
          {filteredUsers.length} utilisateur
          {filteredUsers.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ======================================================
          TABLEAU
      ====================================================== */}

      <div className="admin-users-table-container">
        {loading ? (
          <div className="admin-users-loading">
            <FiRefreshCw className="admin-refresh-spinning" />

            <span>Chargement des utilisateurs...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="admin-users-empty">
            <FiUsers />

            <h3>Aucun utilisateur</h3>

            <p>Aucun compte utilisateur ne correspond à votre recherche.</p>
          </div>
        ) : (
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Email</th>
                <th>Stockage</th>
                <th>Inscription</th>
                <th>Rôle</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  {/* UTILISATEUR */}

                  <td>
                    <div className="admin-user-name">
                      <div className="admin-user-avatar">
                        {(user.full_name || user.email || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <strong>{user.full_name || "Sans nom"}</strong>
                    </div>
                  </td>

                  {/* EMAIL */}

                  <td>{user.email || "-"}</td>

                  {/* STOCKAGE */}

                  <td>{formatBytes(user.storage_used || 0)}</td>

                  {/* DATE */}

                  <td>{formatDate(user.created_at)}</td>

                  {/* ROLE */}

                  <td>
                    <span className="admin-role-badge">utilisateur</span>
                  </td>

                  {/* ACTION */}

                  <td>
                    <button
                      type="button"
                      className="admin-delete-user"
                      onClick={() => deleteUser(user.id, user.full_name)}
                    >
                      <FiTrash2 />
                      <span>Supprimer</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ======================================================
          MODAL CRÉATION UTILISATEUR
      ====================================================== */}

      {showModal && (
        <div
          className="admin-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              closeCreateModal();
            }
          }}
        >
          <div className="admin-modal">
            {/* HEADER MODAL */}

            <div className="admin-modal-header">
              <div>
                <h2>Créer un compte</h2>

                <p>Ajouter un nouvel utilisateur à Cloud Vault.</p>
              </div>

              <button
                type="button"
                className="admin-modal-close"
                onClick={closeCreateModal}
                disabled={saving}
                aria-label="Fermer"
              >
                <FiX />
              </button>
            </div>

            {/* FORMULAIRE */}

            <form onSubmit={createUser}>
              {/* NOM */}

              <div className="admin-modal-field">
                <label htmlFor="user-full-name">Nom complet</label>

                <input
                  id="user-full-name"
                  type="text"
                  value={form.fullName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      fullName: event.target.value,
                    }))
                  }
                  placeholder="Nom de l'utilisateur"
                  autoComplete="name"
                  disabled={saving}
                />
              </div>

              {/* EMAIL */}

              <div className="admin-modal-field">
                <label htmlFor="user-email">Email</label>

                <input
                  id="user-email"
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  placeholder="utilisateur@email.com"
                  autoComplete="email"
                  disabled={saving}
                />
              </div>

              {/* MOT DE PASSE */}

              <div className="admin-modal-field">
                <label htmlFor="user-password">Mot de passe</label>

                <div className="admin-password-wrapper">
                  <FiLock className="admin-password-icon" />

                  <input
                    id="user-password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    placeholder="Minimum 6 caractères"
                    autoComplete="new-password"
                    disabled={saving}
                  />

                  <button
                    type="button"
                    className="admin-password-toggle"
                    onClick={() => setShowPassword((current) => !current)}
                    disabled={saving}
                    aria-label={
                      showPassword
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                    title={
                      showPassword
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>

                <small>
                  Le mot de passe doit contenir au moins 6 caractères.
                </small>
              </div>

              {/* ACTIONS */}

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-cancel-button"
                  onClick={closeCreateModal}
                  disabled={saving}
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="admin-save-button"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="admin-button-spinner" />
                      Création...
                    </>
                  ) : (
                    <>
                      <FiPlus />
                      Créer le compte
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
