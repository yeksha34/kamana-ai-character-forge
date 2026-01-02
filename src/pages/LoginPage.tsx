
import { LoginView } from "../views/LoginView";
import { Language } from "../i18n/translations";

export function LoginPage({
  onSignIn,
  isLoggingIn,
  language,
  isDevelopmentBypass
}: {
  onSignIn: () => void;
  isLoggingIn: boolean;
  language: Language;
  isDevelopmentBypass: boolean;
}) {
  return (
    <LoginView
      onSignIn={onSignIn}
      isLoggingIn={isLoggingIn}
      language={language}
      isDevelopmentBypass={isDevelopmentBypass}
    />
  );
}
