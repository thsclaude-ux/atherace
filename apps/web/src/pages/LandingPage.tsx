import { Link } from "react-router-dom";
import { useI18n } from "@/context/AppContext";
import { Header, Footer } from "@/components/Layout";

export function LandingPage() {
  const { t } = useI18n();

  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="container hero-content">
            <h1 className="display">{t("hero.title")}</h1>
            <div className="gold-line" />
            <p className="hero-subtitle">{t("hero.subtitle")}</p>
            <div className="hero-actions">
              <Link to="/predict" className="btn btn-primary btn-lg">{t("hero.cta.predict")}</Link>
              <Link to="/leaderboard" className="btn btn-secondary btn-lg">{t("hero.cta.leaderboard")}</Link>
            </div>
          </div>
        </section>

        <section className="features">
          <div className="container">
            <h2 className="display text-center" style={{ marginBottom: "2rem" }}>{t("features.title")}</h2>
            <div className="grid grid-3">
              <div className="card glass text-center">
                <div className="feature-icon">⚡</div>
                <h3>{t("features.speed")}</h3>
                <p className="text-muted">{t("features.speed.desc")}</p>
              </div>
              <div className="card glass text-center">
                <div className="feature-icon">🔒</div>
                <h3>{t("features.secure")}</h3>
                <p className="text-muted">{t("features.secure.desc")}</p>
              </div>
              <div className="card glass text-center">
                <div className="feature-icon">🌍</div>
                <h3>{t("features.global")}</h3>
                <p className="text-muted">{t("features.global.desc")}</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
