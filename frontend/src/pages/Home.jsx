import { Link } from "react-router-dom";

import {
  Cloud,
  Search,
  FolderOpen,
  Download,
  Share2,
  LockKeyhole,
  ArrowRight,
  FileText,
  Image,
  Video,
  Music,
} from "lucide-react";

function Home() {
  return (
    <main>
      {/* ================= HERO ================= */}

      <section className="hero">
        <div className="hero-content">
          <span className="hero-label">
            UN TYPE DE STOCKAGE PLUS SILENCIEUX
          </span>

          <h1>
            Vos fichiers.
            <br />
            <span>Sous votre ciel.</span>
          </h1>

          <p>
            Cloud Vault est un espace privé pour conserver vos documents,
            photos, vidéos, audios et projets en toute simplicité.
          </p>

          <div className="hero-buttons">
            <Link to="/register" className="btn-primary">
              Créer mon coffre-fort
              <ArrowRight size={19} />
            </Link>

            <Link to="/login" className="btn-secondary">
              Se connecter
            </Link>
          </div>
        </div>

        {/* APERÇU DU DASHBOARD */}

        <div className="hero-preview">
          <div className="preview-header">
            <div>
              <small>VOTRE ESPACE</small>

              <h3>Coffre-fort cloud</h3>
            </div>

            <Cloud size={28} />
          </div>

          <div className="preview-storage">
            <div className="storage-top">
              <span>Stockage utilisé</span>

              <strong>32%</strong>
            </div>

            <div className="storage-bar">
              <div></div>
            </div>

            <small>3,2 Go utilisés sur 10 Go</small>
          </div>

          <div className="preview-files">
            <div className="mini-file">
              <FileText size={20} />
              <span>Documents</span>
              <strong>24</strong>
            </div>

            <div className="mini-file">
              <Image size={20} />
              <span>Photos</span>
              <strong>128</strong>
            </div>

            <div className="mini-file">
              <Video size={20} />
              <span>Vidéos</span>
              <strong>18</strong>
            </div>

            <div className="mini-file">
              <Music size={20} />
              <span>Audios</span>
              <strong>32</strong>
            </div>
          </div>
        </div>
      </section>

      {/* ================= INTRO ================= */}

      <section className="intro" id="about">
        <span className="section-label">UN ESPACE QUI VOUS APPARTIENT</span>

        <h2>
          Un coin d'internet
          <br />
          pensé pour vous.
        </h2>

        <p>
          Vos fichiers méritent un endroit simple, organisé et accessible quand
          vous en avez besoin. Cloud Vault rassemble tout au même endroit.
        </p>
      </section>

      {/* ================= FEATURES ================= */}

      <section className="features" id="features">
        <div className="section-heading">
          <span className="section-label">FONCTIONNALITÉS</span>

          <h2>Tout ce dont vous avez besoin.</h2>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <FolderOpen />
            </div>

            <h3>Organisez vos fichiers</h3>

            <p>
              Créez des dossiers et sous-dossiers pour garder votre espace
              parfaitement organisé.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Search />
            </div>

            <h3>Retrouvez rapidement</h3>

            <p>
              Une barre de recherche et des filtres permettent de retrouver vos
              fichiers facilement.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Download />
            </div>

            <h3>Téléchargez</h3>

            <p>
              Accédez à vos fichiers et téléchargez-les quand vous en avez
              besoin.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Share2 />
            </div>

            <h3>Partagez</h3>

            <p>Créez un lien de partage pour envoyer un fichier à quelqu'un.</p>
          </div>
        </div>
      </section>

      {/* ================= SECURITY ================= */}

      <section className="security" id="security">
        <div className="security-icon">
          <LockKeyhole size={38} />
        </div>

        <div>
          <span className="section-label">VOTRE CONFIDENTIALITÉ</span>

          <h2>Votre espace reste privé.</h2>

          <p>
            Chaque utilisateur possède son propre espace. Les fichiers sont
            protégés et accessibles uniquement selon les autorisations définies.
          </p>
        </div>
      </section>

      {/* ================= CTA ================= */}

      <section className="cta">
        <div>
          <span className="section-label">COMMENCEZ MAINTENANT</span>

          <h2>
            Faites de la place
            <br />
            pour ce qui compte.
          </h2>
        </div>

        <Link to="/register" className="btn-primary">
          Créer mon espace
          <ArrowRight size={20} />
        </Link>
      </section>
    </main>
  );
}

export default Home;
