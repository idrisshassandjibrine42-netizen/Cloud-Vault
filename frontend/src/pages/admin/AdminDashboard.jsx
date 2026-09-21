import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiUsers,
  FiMessageSquare,
  FiHardDrive,
  FiShield,
  FiLogOut,
  FiArrowRight,
  FiActivity,
} from "react-icons/fi";

import { supabase } from "../../services/supabase";
import "./AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    users: 0,
    messages: 0,
    unread: 0,
    storage: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);

    try {
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "user");

      const { data: messages } = await supabase
        .from("contact_messages")
        .select("status");

      const unread =
        messages?.filter((message) => message.status === "unread").length || 0;

      const { data: profiles } = await supabase
        .from("profiles")
        .select("storage_used");

      const totalStorage =
        profiles?.reduce(
          (total, profile) => total + Number(profile.storage_used || 0),
          0,
        ) || 0;

      setStats({
        users: usersCount || 0,
        messages: messages?.length || 0,
        unread,
        storage: totalStorage,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  };

  const formatStorage = (bytes) => {
    if (!bytes) return "0 B";

    const units = ["B", "KB", "MB", "GB", "TB"];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${(bytes / Math.pow(1024, index)).toFixed(1)} ${units[index]}`;
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-topbar">
        <div className="admin-brand">
          <div className="admin-brand-icon">
            <FiShield />
          </div>

          <div>
            <strong>Cloud Vault</strong>
            <span>Administration</span>
          </div>
        </div>

        <button className="admin-logout" onClick={logout}>
          <FiLogOut />
          Déconnexion
        </button>
      </header>

      <main className="admin-dashboard-container">
        <div className="admin-page-heading">
          <div>
            <h1>Tableau de bord</h1>
            <p>Gérez les utilisateurs et les activités de Cloud Vault.</p>
          </div>
        </div>

        <section className="admin-stat-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon blue">
              <FiUsers />
            </div>

            <div>
              <span>Utilisateurs</span>
              <strong>{loading ? "..." : stats.users}</strong>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon purple">
              <FiMessageSquare />
            </div>

            <div>
              <span>Messages</span>
              <strong>{loading ? "..." : stats.messages}</strong>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon orange">
              <FiActivity />
            </div>

            <div>
              <span>Messages non lus</span>
              <strong>{loading ? "..." : stats.unread}</strong>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon green">
              <FiHardDrive />
            </div>

            <div>
              <span>Stockage utilisé</span>
              <strong>{loading ? "..." : formatStorage(stats.storage)}</strong>
            </div>
          </div>
        </section>

        <section className="admin-actions-grid">
          <Link to="/admin/users" className="admin-action-card">
            <div className="admin-action-icon">
              <FiUsers />
            </div>

            <div>
              <h2>Utilisateurs</h2>
              <p>Créer, consulter et supprimer les comptes utilisateurs.</p>
            </div>

            <FiArrowRight className="admin-action-arrow" />
          </Link>

          <Link to="/admin/messages" className="admin-action-card">
            <div className="admin-action-icon">
              <FiMessageSquare />
            </div>

            <div>
              <h2>Messages</h2>
              <p>Lire les demandes et répondre aux utilisateurs.</p>
            </div>

            <FiArrowRight className="admin-action-arrow" />
          </Link>
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;
