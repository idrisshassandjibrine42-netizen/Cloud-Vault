import { Link } from "react-router-dom";
import { Cloud, Mail, ShieldCheck } from "lucide-react";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* COLONNE 1 */}
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <div className="logo-icon">
              <Cloud size={22} />
            </div>

            <span>Cloud Vault</span>
          </Link>

          <p>
            Un espace privé et simple pour conserver vos fichiers, vos souvenirs
            et vos projets.
          </p>

          <div className="footer-security">
            <ShieldCheck size={18} />
            Vos fichiers restent protégés.
          </div>
        </div>

        {/* COLONNE 2 */}
        <div className="footer-column">
          <h3>Cloud Vault</h3>

          <Link to="/">Accueil</Link>

          <a href="#features">Fonctionnalités</a>

          <a href="#security">Sécurité</a>

          <a href="#about">Notre promesse</a>
        </div>

        {/* COLONNE 3 */}
        <div className="footer-column">
          <h3>Votre espace</h3>

          <Link to="/login">Connexion</Link>

          <Link to="/register">Inscription</Link>
        </div>

        {/* COLONNE 4 */}
        <div className="footer-column">
          <h3>Contact</h3>

          <a href="mailto:contact@cloudvault.com">
            <Mail size={17} />
            contact@cloudvault.com
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 Cloud Vault. Tous droits réservés.</p>

        <div>
          <span>Confidentialité</span>
          <span>Conditions</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
