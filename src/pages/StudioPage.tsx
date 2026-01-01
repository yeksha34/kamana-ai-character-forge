import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { StudioView } from '@/views/StudioView';
import { CharacterData } from '@/types';
import { getIdFromHash } from '@/hooks/useHashRouter';
import { fetchCharacterById } from '@/services/supabaseDatabaseService';


export function StudioPage(props: any) {
  const {
    user,
    language,
    onNavigate,
    onSignOut,
    onToggleNSFW,
    setLanguage,
    ...studioProps
  } = props;

  const [character, setCharacter] = useState<CharacterData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const id = getIdFromHash() || 'new';

    fetchCharacterById(id)
      .then((c: CharacterData) => setCharacter(c))
      .finally(() => setIsLoading(false));

  }, []);

  if (isLoading || !character) {
    return (
      <div className="min-h-screen flex items-center justify-center text-rose-900/40">
        Loading studio…
      </div>
    );
  }

  return (
    <>
      <Header
        user={user}
        isNSFW={character.isNSFW}
        onToggleNSFW={onToggleNSFW}
        onNavigate={onNavigate}
        onSignOut={onSignOut}
        language={language}
        onLanguageChange={setLanguage}
      />

      <StudioView
        {...studioProps}
        language={language}
        character={character}
        setCharacter={setCharacter}
      />
    </>
  );
}
