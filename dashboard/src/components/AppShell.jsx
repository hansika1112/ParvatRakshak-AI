import TopHeader from "./TopHeader.jsx";
import Sidebar from "./Sidebar.jsx";

export default function AppShell({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />

      <div className="app-shell-content">
        <TopHeader />

        <main className="main-content">
          {children}
        </main>

        <footer>
          ParvatRakshak AI • Smart India Hackathon 2026 • SIH26001
        </footer>
      </div>
    </div>
  );
}
