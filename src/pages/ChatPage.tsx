import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { ChatView } from '../views/ChatView';
import { CharacterData } from '../types';
import { fetchCharacterById } from '../services/supabaseDatabaseService';
import { getIdFromHash } from '../hooks/useHashRouter';

export function ChatPage({ user, onNavigate, onSignOut }: any) {
  const [character, setCharacter] = useState<CharacterData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const id = getIdFromHash();
    
    if (id && id !== 'new') {
      setIsLoading(true);
      fetchCharacterById(id)
        .then(setCharacter)
        .catch(err => console.error("Failed to fetch character for chat:", err))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-rose-900 border-t-rose-500 rounded-full animate-spin" />
          <div className="animate-pulse serif-display italic text-2xl text-rose-500 tracking-widest">Awakening Archetype…</div>
        </div>
      </div>
    );
  }

  if (!character || character.id === 'new') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-rose-500 p-8 text-center">
        <h2 className="text-4xl serif-display italic mb-4">Soul Not Found</h2>
        <p className="text-rose-900/60 uppercase text-[10px] font-black tracking-widest mb-8">The character you are looking for has faded into the void.</p>
        <button 
          onClick={() => onNavigate('#/museum')}
          className="px-8 py-4 bg-rose-900/20 border border-rose-900/40 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-rose-900/40 transition-all"
        >
          Return to Gallery
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-black overflow-hidden select-none">
      <Header
        user={user}
        onNavigate={onNavigate}
        onSignOut={onSignOut}
        currentRoute={window.location.hash}
      />
      <main className="flex-1 relative mt-20 md:mt-24">
        <ChatView 
          character={character} 
          onNavigate={onNavigate} 
          isFullScreen={true} 
        />
      </main>
    </div>
  );
}