export function PageLoader() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "60vh",
      color: "var(--atr-text-muted, #8B9CB3)",
    }}>
      <div style={{ textAlign: "center" }}>
        <div className="display text-gold" style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>AT THE RACE</div>
        <p>Loading...</p>
      </div>
    </div>
  );
}
