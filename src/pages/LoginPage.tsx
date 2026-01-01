import { LoginView } from "@/views/LoginView";
import { Language } from "@/i18n/translations";

export function LoginPage({
  onSignIn,
  isLoggingIn,
  language
}: {
  onSignIn: () => void;
  isLoggingIn: boolean;
  language: Language;
}) {
  return (
    <LoginView
      onSignIn={onSignIn}
      isLoggingIn={isLoggingIn}
      language={language}
    />
  );
}
