import { memo, useMemo } from "react";
import type { LeaderboardEntry } from "@atr/shared";
import { useI18n } from "@/context/AppContext";
import { Header, Footer } from "@/components/Layout";
import { useSmartPolling, createEtagFetcher } from "@/hooks/useSmartPolling";

const RankBadge = memo(function RankBadge({ rank }: { rank: number }) {
  const cls = rank === 1 ? "rank-1" : rank === 2 ? "rank-2" : rank === 3 ? "rank-3" : "rank-n";
  return <span className={`rank ${cls}`}>{rank}</span>;
});

export function LeaderboardPage() {
  const { t } = useI18n();
  const fetcher = useMemo(() => createEtagFetcher<LeaderboardEntry[]>("/leaderboard"), []);
  const { data: entries, loading, error } = useSmartPolling({
    fetcher,
    intervalMs: 15000,
  });

  return (
    <>
      <Header />
      <main className="container" style={{ padding: "2rem 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <h1 className="display">{t("leaderboard.title")}</h1>
          <span className="badge badge-live">LIVE</span>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading && !entries ? (
          <p className="text-muted">Loading...</p>
        ) : !entries || entries.length === 0 ? (
          <div className="card text-center"><p className="text-muted">No participants yet</p></div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            {entries.map((e) => (
              <div className="lb-item" key={e.userId}>
                <RankBadge rank={e.rank} />
                <div style={{ flex: 1 }}>
                  <strong>{e.name || "Anonymous"}</strong>
                </div>
                <span className="text-gold" style={{ fontWeight: 700, fontSize: "1.125rem" }}>{e.score}</span>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
