import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ROUNDS, MIN_HORSE, MAX_HORSE } from "@atr/shared";
import { api } from "@/lib/api";
import { useI18n, useAuth } from "@/context/AppContext";
import { Header, Logo } from "@/components/Layout";

type Tab = "dashboard" | "codes" | "winners" | "participants";

export function AdminPage() {
  const { t } = useI18n();
  const { token, login, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("dashboard");
  const [stats, setStats] = useState({ codes: 0, participants: 0 });

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api<unknown[]>("/codes", { token }).catch(() => []),
      api<unknown[]>("/leaderboard", { token }).catch(() => []),
    ]).then(([codes, lb]) => setStats({ codes: codes.length, participants: lb.length }));
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  if (!token) {
    return (
      <>
        <Header />
        <main className="container-narrow" style={{ padding: "3rem 0" }}>
          <div className="card glass" style={{ maxWidth: 400, margin: "0 auto" }}>
            <h2 className="display text-center" style={{ marginBottom: "1.5rem" }}>{t("admin.login")}</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleLogin}>
              <div className="field">
                <label className="label">{t("admin.email")}</label>
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="field">
                <label className="label">{t("admin.password")}</label>
                <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <button className="btn btn-primary" style={{ width: "100%" }} type="submit">{t("admin.login")}</button>
            </form>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <header className="header">
        <div className="container header-inner">
          <Link to="/"><Logo /></Link>
          <button className="btn btn-ghost btn-sm" onClick={logout}>{t("admin.logout")}</button>
        </div>
      </header>
      <div className="dashboard">
        <aside className="sidebar">
          <nav className="sidebar-nav">
            {(["dashboard", "codes", "winners", "participants"] as Tab[]).map((t_) => (
              <button key={t_} className={`sidebar-link ${tab === t_ ? "active" : ""}`} onClick={() => setTab(t_)}>
                {t(`admin.${t_}`)}
              </button>
            ))}
          </nav>
        </aside>
        <main className="dashboard-main">
          {tab === "dashboard" && <DashboardTab stats={stats} t={t} />}
          {tab === "codes" && <CodesTab token={token} t={t} />}
          {tab === "winners" && <WinnersTab token={token} t={t} />}
          {tab === "participants" && <ParticipantsTab token={token} t={t} />}
        </main>
      </div>
    </>
  );
}

function DashboardTab({ stats, t }: { stats: { codes: number; participants: number }; t: (k: string) => string }) {
  const exportData = () => {
    window.open(`/api/v1/export/participants`, "_blank");
  };

  return (
    <>
      <h2 className="display" style={{ marginBottom: "1.5rem" }}>{t("admin.dashboard")}</h2>
      <div className="grid grid-3" style={{ marginBottom: "2rem" }}>
        <div className="stat"><div className="stat-value">{stats.codes}</div><div className="stat-label">{t("admin.codes")}</div></div>
        <div className="stat"><div className="stat-value">{stats.participants}</div><div className="stat-label">{t("admin.participants")}</div></div>
        <div className="stat"><div className="stat-value">7</div><div className="stat-label">Rounds</div></div>
      </div>
      <button className="btn btn-secondary" onClick={exportData}>{t("admin.export")} Excel</button>
    </>
  );
}

function CodesTab({ token, t }: { token: string; t: (k: string) => string }) {
  const [codes, setCodes] = useState<Array<{ code: string; maxUses: number; usedCount: number }>>([]);
  const [maxUses, setMaxUses] = useState(1);

  const load = () => api<typeof codes>("/codes", { token }).then(setCodes);
  useEffect(() => { load(); }, [token]);

  const generate = async () => {
    await api("/codes", { method: "POST", body: { maxUses }, token });
    load();
  };

  return (
    <>
      <h2 className="display" style={{ marginBottom: "1.5rem" }}>{t("admin.codes")}</h2>
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="field">
          <label className="label">Max Uses</label>
          <input className="input" type="number" min={1} value={maxUses} onChange={(e) => setMaxUses(Number(e.target.value))} style={{ maxWidth: 120 }} />
        </div>
        <button className="btn btn-primary" onClick={generate}>{t("admin.generate")}</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Code</th><th>Max</th><th>Used</th><th></th></tr></thead>
          <tbody>
            {codes.map((c) => (
              <tr key={c.code}>
                <td><span className="badge badge-gold">{c.code}</span></td>
                <td>{c.maxUses}</td>
                <td>{c.usedCount}</td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={async () => { await api(`/codes/${c.code}`, { method: "DELETE", token }); load(); }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function WinnersTab({ token, t }: { token: string; t: (k: string) => string }) {
  const [rounds, setRounds] = useState<number[]>(Array(ROUNDS).fill(0));
  const [msg, setMsg] = useState("");

  const save = async () => {
    try {
      const result = await api<{ participantsUpdated: number }>("/race/winners", { method: "POST", body: { rounds }, token });
      setMsg(`Saved! ${result.participantsUpdated} participants scored.`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <>
      <h2 className="display" style={{ marginBottom: "1.5rem" }}>{t("admin.winners")}</h2>
      {msg && <div className="alert alert-success">{msg}</div>}
      <div className="card">
        <div className="rounds-grid" style={{ marginBottom: "1.5rem" }}>
          {rounds.map((val, i) => (
            <div className="round-picker" key={i}>
              <label>Round {i + 1}</label>
              <select className="select" value={val || ""} onChange={(e) => {
                const next = [...rounds];
                next[i] = Number(e.target.value);
                setRounds(next);
              }}>
                <option value="">—</option>
                {Array.from({ length: MAX_HORSE - MIN_HORSE + 1 }, (_, j) => MIN_HORSE + j).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <button className="btn btn-primary btn-lg" onClick={save}>{t("admin.save")}</button>
      </div>
    </>
  );
}

function ParticipantsTab({ token, t }: { token: string; t: (k: string) => string }) {
  const [entries, setEntries] = useState<Array<{ rank: number; name?: string; score: number; userId: string }>>([]);

  useEffect(() => {
    api<typeof entries>("/leaderboard", { token }).then(setEntries);
  }, [token]);

  return (
    <>
      <h2 className="display" style={{ marginBottom: "1.5rem" }}>{t("admin.participants")}</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>{t("leaderboard.rank")}</th><th>{t("leaderboard.name")}</th><th>{t("leaderboard.score")}</th></tr></thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.userId}>
                <td>{e.rank}</td>
                <td>{e.name || "—"}</td>
                <td className="text-gold">{e.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
