import { useState, useEffect } from "react";
import { ROUNDS, MIN_HORSE, MAX_HORSE } from "@atr/shared";
import { api, getOrCreateUserId, getSessionToken, storeSessionToken } from "@/lib/api";
import { useI18n } from "@/context/AppContext";
import { Header, Footer } from "@/components/Layout";

export function PredictPage() {
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [validated, setValidated] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [rounds, setRounds] = useState<number[]>(Array(ROUNDS).fill(0));
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const userId = getOrCreateUserId();

  useEffect(() => {
    api<{ submitted: boolean }>(`/predictions/status?userId=${userId}`)
      .then((d) => { if (d.submitted) setSuccess(true); })
      .catch(() => {});
  }, [userId]);

  const validateCode = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await api<{ sessionToken: string }>(`/codes/validate?code=${encodeURIComponent(code)}&userId=${userId}`);
      storeSessionToken(data.sessionToken);
      setValidated(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Validation failed");
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    setError("");
    if (!consent) { setError("Consent required"); return; }
    if (rounds.some((r) => r < MIN_HORSE)) { setError("Complete all rounds"); return; }
    setLoading(true);
    try {
      await api("/predictions", {
        method: "POST",
        body: {
          code: code.toUpperCase(),
          userId,
          rounds,
          name,
          phone,
          consentAccepted: true,
          sessionToken: getSessionToken(),
        },
      });
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <Header />
        <main className="container-narrow" style={{ padding: "3rem 0" }}>
          <div className="card glass text-center">
            <h2 className="display text-gold">{t("predict.success")}</h2>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container-narrow" style={{ padding: "2rem 0" }}>
        <h1 className="display" style={{ marginBottom: "1.5rem" }}>{t("predict.title")}</h1>

        {error && <div className="alert alert-error">{error}</div>}

        {!validated ? (
          <div className="card">
            <div className="field">
              <label className="label">{t("predict.code")}</label>
              <input className="input" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={8} placeholder="XXXXXXXX" />
            </div>
            <button className="btn btn-primary" onClick={validateCode} disabled={loading || code.length < 4}>
              {t("predict.validate")}
            </button>
          </div>
        ) : (
          <div className="card">
            <div className="field">
              <label className="label">{t("predict.name")}</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="field">
              <label className="label">{t("predict.phone")}</label>
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>

            <div className="rounds-grid" style={{ marginBottom: "1.5rem" }}>
              {rounds.map((val, i) => (
                <div className="round-picker" key={i}>
                  <label>{t("predict.round")} {i + 1}</label>
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

            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", fontSize: "0.875rem" }}>
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              {t("predict.consent")}
            </label>

            <button className="btn btn-primary btn-lg" onClick={submit} disabled={loading}>
              {t("predict.submit")}
            </button>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
