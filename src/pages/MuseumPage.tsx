
import { Header } from "../components/Header";
import { MuseumView } from "../views/MuseumView";
import { CharacterData } from "../types";

export function MuseumPage({
  user,
  characters,
  isNSFW,
  language,
  onToggleNSFW,
  onNavigate,
  onSignOut,
  onEdit,
  onDelete
}: any) {
  return (
    <>
      <Header
        user={user}
        isNSFW={isNSFW}
        onToggleNSFW={onToggleNSFW}
        onNavigate={onNavigate}
        onSignOut={onSignOut}
        language={language}
        onLanguageChange={() => {}}
      />
      <MuseumView
        characters={characters}
        onNavigate={onNavigate}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </>
  );
}
