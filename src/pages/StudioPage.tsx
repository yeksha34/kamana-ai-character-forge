
import { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { StudioView } from '../views/StudioView';
import { CharacterData } from '../types';
import { getIdFromHash } from '../hooks/useHashRouter';
import { fetchCharacterById } from '../services/supabaseDatabaseService';
import { useAppContext } from '../contexts/AppContext';

export function StudioPage(props: any) {
  const { user, onNavigate, onSignOut } = props;
  const { isGlobalNSFW } = useAppContext();
  const [character, setCharacter] = useState<CharacterData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const id = getIdFromHash() || 'new';
    setIsLoading(true);
    fetchCharacterById(id)
      .then((c: CharacterData) => {
        if (id === 'new') {
          c.isNSFW = isGlobalNSFW;
        }
        setCharacter(c);
      })
      .catch(err => console.error("Character fetch failed:", err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || !character) {
    return (
      <div className="min-h-screen flex items-center justify-center text-rose-900/40">
        <div className="animate-pulse serif-display italic text-2xl tracking-widest">Entering Studio…</div>
      </div>
    );
  }

  return (
    <>
      <Header
        user={user}
        onNavigate={onNavigate}
        onSignOut={onSignOut}
        currentRoute={window.location.hash}
      />
      <StudioView
        character={character}
        setCharacter={setCharacter}
      />
    </>
  );
}
