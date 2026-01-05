
import { useAuth } from "./contexts/AuthContext";
import { useAppContext } from "./contexts/AppContext";
import { useHashRouter } from "./hooks/useHashRouter";
import { AppLayout } from "./layout/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { MuseumPage } from "./pages/MuseumPage";
import { StudioPage } from "./pages/StudioPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ChatPage } from "./pages/ChatPage";
import { useEffect } from "react";
import { MigrationService } from "./services/migrationService";

function App() {
  const auth = useAuth();
  const { language } = useAppContext();
  const { route, navigate } = useHashRouter("#/login");

  useEffect(() => {
    // Run data migrations/hydration whenever the app initializes
    MigrationService.runMigrations();
  }, []);

  useEffect(() => {
    if (auth.isLoading) return;

    // Normalize routes for easier checking
    const isAtLogin = route === "#/login" || route === "" || route === "#/";

    if (auth.user) {
      // If logged in, ONLY redirect if the user is stuck on a login or empty route.
      // This prevents "resets" from #/museum or #/chat when auth state refreshes.
      if (isAtLogin) {
        navigate("#/studio/new");
      }
    } else {
      // If NOT logged in, redirect to login unless already there.
      if (!isAtLogin) {
        navigate("#/login");
      }
    }
  }, [auth.isLoading, !!auth.user, route, navigate]);

  if (auth.isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-rose-500">
        <div className="w-16 h-16 border-4 border-rose-900 border-t-rose-500 rounded-full animate-spin mb-8" />
        <span className="serif-display italic text-2xl animate-pulse tracking-widest">
          Loading desire...
        </span>
      </div>
    );
  }

  // Determine view based on route and auth status
  const isLoginPage = route === "#/login" || !auth.user;

  return (
    <AppLayout>
      {isLoginPage ? (
        <LoginPage
          onSignIn={auth.signIn}
          isLoggingIn={auth.isLoggingIn}
          language={language}
          isDevelopmentBypass={auth.isDevelopmentBypass}
        />
      ) : (
        <>
          {route.startsWith("#/studio") && (
            <StudioPage
              key={route}
              user={auth.user}
              onSignOut={auth.signOut}
              onNavigate={navigate}
            />
          )}

          {route === "#/museum" && (
            <MuseumPage
              user={auth.user}
              onSignOut={auth.signOut}
              onNavigate={navigate}
            />
          )}

          {route === "#/settings" && (
            <SettingsPage
              user={auth.user}
              onSignOut={auth.signOut}
              onNavigate={navigate}
            />
          )}

          {route.startsWith("#/chat") && (
            <ChatPage
              user={auth.user}
              onSignOut={auth.signOut}
              onNavigate={navigate}
            />
          )}
        </>
      )}
    </AppLayout>
  );
}

export default App;
