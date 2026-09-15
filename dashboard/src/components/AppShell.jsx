import TopHeader from "./TopHeader.jsx";

export default function AppShell({ children }) {
  return (
    <div className="dashboard">
      <TopHeader />

      <main className="main-content">
        {children}
      </main>

      <footer>
        ParvatRakshak AI • Smart India Hackathon 2026 • SIH26001
      </footer>
    </div>
  );
}
