
import { useAuth } from "./contexts/AuthContext";
import { useHashRouter } from "./hooks/useHashRouter";
import { AppLayout } from "./layout/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { MuseumPage } from "./pages/MuseumPage";
import { StudioPage } from "./pages/StudioPage";
import { useState } from "react";
import { Language } from "./i18n/translations";

function App() {
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('kamana_lang') as Language) || 'mr');

  const auth = useAuth();
  const { route, navigate } = useHashRouter(
    auth.user ? "#/studio" : "#/login"
  );
  if (auth.isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  }

  return (
    <AppLayout>
      {route === "#/login" && (
        <LoginPage
          onSignIn={auth.signIn}
          isLoggingIn={auth.isLoggingIn}
          language={language}
          isDevelopmentBypass={auth.isDevelopmentBypass}
        />
      )}

      {route.startsWith("#/studio") && (
        <StudioPage
          {...auth}
          language={language}
          onNavigate={navigate}
        />
      )}

      {route === "#/museum" && (
        <MuseumPage
          {...auth}
          language={language}
          onNavigate={navigate}
        />
      )}
    </AppLayout>
  );
}

export default App;
