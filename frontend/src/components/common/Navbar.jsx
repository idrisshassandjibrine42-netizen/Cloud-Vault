import { Link } from "react-router-dom";
import { Menu, X, Cloud, LogIn, UserPlus } from "lucide-react";
import { useState } from "react";

function Navbar() {
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* LOGO */}
        <Link to="/" className="logo">
          <div className="logo-icon">
            <Cloud size={22} />
          </div>

          <span>Cloud Vault</span>
        </Link>

        {/* MENU DESKTOP */}
        <nav className="desktop-menu">
          <a href="#features">Fonctionnalités</a>

          <a href="#security">Sécurité</a>

          <a href="#about">Notre promesse</a>

          <Link to="/admin/login" className="nav-login">
            <LogIn size={18} />
            Admin
          </Link>

          <Link to="/login" className="nav-login">
            <LogIn size={18} />
            Connexion
          </Link>

          <Link to="/register" className="nav-register">
            <UserPlus size={18} />
            Inscription
          </Link>
        </nav>

        {/* BOUTON MOBILE */}
        <button
          className="mobile-menu-button"
          onClick={() => setMobileMenu(!mobileMenu)}
        >
          {mobileMenu ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* MENU MOBILE */}
      {mobileMenu && (
        <div className="mobile-menu">
          <a href="#features" onClick={() => setMobileMenu(false)}>
            Fonctionnalités
          </a>

          <a href="#security" onClick={() => setMobileMenu(false)}>
            Sécurité
          </a>

          <a href="#about" onClick={() => setMobileMenu(false)}>
            Notre promesse
          </a>

          <Link to="/login" onClick={() => setMobileMenu(false)}>
            Connexion
          </Link>

          <Link to="/register" onClick={() => setMobileMenu(false)}>
            Inscription
          </Link>
        </div>
      )}
    </header>
  );
}

export default Navbar;
