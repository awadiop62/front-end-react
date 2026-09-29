import { useState } from 'react';
import TopBar from './BarreSuperieure';
import SideNav from './NavigationLaterale';

export default function AppShell({ children }) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="app-shell">
      <TopBar
        onToggleNav={() => setNavOpen((o) => !o)}
      />
      <div className="app-shell__body">
        <SideNav open={navOpen} onClose={() => setNavOpen(false)} />
        <main className="app-shell__main">
          <div className="container app-shell__content">{children}</div>
        </main>
      </div>
    </div>
  );
}
