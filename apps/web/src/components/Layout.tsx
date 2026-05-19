import { Link } from "react-router-dom";
import { useI18n } from "@/context/AppContext";

export function Logo({ className = "logo" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 320 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(4, 8)">
        <path d="M8 44c2-8 6-14 12-18 3-2 7-3 10-2 2 1 3 3 2 5-1 2-4 3-6 2-3-1-5 1-7 4-2 4-3 9-2 14 1 4 3 7 6 9-2 0-4-1-5-3-2-3-3-7-3-11 0-2 0-4 1-6 1-2 2-3 4-4-1-1-3-1-4 0-3 2-5 5-6 9-1 3-1 7 0 10z" fill="#D4AF37"/>
        <path d="M20 26c4-6 10-10 16-10 4 0 8 2 10 5 2 3 2 7 0 10-2 4-6 6-10 6-5 0-10-3-13-7-1 4-1 8 1 12 2 4 5 7 9 9-4 1-8 0-11-3-4-4-6-10-6-16 0-4 1-8 4-11z" fill="#D4AF37"/>
        <line x1="0" y1="32" x2="6" y2="32" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      </g>
      <text x="56" y="42" fontFamily="'Barlow Condensed', sans-serif" fontSize="32" fontWeight="700" fontStyle="italic" fill="currentColor" letterSpacing="1">AT THE RACE</text>
      <line x1="56" y1="50" x2="310" y2="50" stroke="#D4AF37" strokeWidth="2"/>
    </svg>
  );
}

export function Header() {
  const { t, lang, setLang } = useI18n();

  return (
    <header className="header">
      <div className="container header-inner">
        <Link to="/"><Logo /></Link>
        <nav className="nav">
          <Link to="/" className="btn btn-ghost btn-sm">{t("nav.home")}</Link>
          <Link to="/predict" className="btn btn-ghost btn-sm">{t("nav.predict")}</Link>
          <Link to="/leaderboard" className="btn btn-ghost btn-sm">{t("nav.leaderboard")}</Link>
          <Link to="/admin" className="btn btn-secondary btn-sm">{t("nav.admin")}</Link>
          <button className="btn btn-ghost btn-sm" onClick={() => setLang(lang === "en" ? "ar" : "en")}>
            {lang === "en" ? "عربي" : "EN"}
          </button>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <p>&copy; {new Date().getFullYear()} AT THE RACE. All rights reserved.</p>
      </div>
    </footer>
  );
}
