import { Suspense, useState, lazy } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import TabNav from "./TabNav";

const AuthModal = lazy(() => import("./AuthModal"));

function Layout() {
  const { user, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="px-8 py-5 min-h-[calc(100vh-2.5rem)]">
      <TabNav
        user={user}
        onLoginClick={() => setShowAuthModal(true)}
        onLogout={logout}
      />

      <div className="max-w-6xl mx-auto px-8 pt-2 pb-5">
        <Suspense
          fallback={
            <div className="text-center py-10 text-light-gray">Loading...</div>
          }
        >
          <Outlet />
        </Suspense>
      </div>

      {showAuthModal && (
        <Suspense fallback={null}>
          <AuthModal onClose={() => setShowAuthModal(false)} />
        </Suspense>
      )}
    </div>
  );
}

export default Layout;
