import { Suspense, useState, lazy } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import TabNav from "./TabNav";

const AuthModal = lazy(() => import("./AuthModal"));

function Layout() {
  const { user, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="mx-auto p-5 rounded-2xl min-h-[calc(100vh-2.5rem)]">
      <TabNav
        showFavorites={!!user}
        user={user}
        onLoginClick={() => setShowAuthModal(true)}
        onLogout={logout}
      />

      <Suspense
        fallback={
          <div className="text-center py-10 text-light-gray">Loading...</div>
        }
      >
        <Outlet />
      </Suspense>

      {showAuthModal && (
        <Suspense fallback={null}>
          <AuthModal onClose={() => setShowAuthModal(false)} />
        </Suspense>
      )}
    </div>
  );
}

export default Layout;
