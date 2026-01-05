import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { ChatView } from '../views/ChatView';
import { CharacterData } from '../types';
import { fetchCharacterById } from '../services/supabaseDatabaseService';

export function ChatPage({ user, onNavigate, onSignOut }: any) {
  const [character, setCharacter] = useState<CharacterData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const parts = window.location.hash.split('/');
    const id = parts[parts.length - 1];
    
    if (id && id !== 'chat') {
      setIsLoading(true);
      fetchCharacterById(id)
        .then(setCharacter)
        .catch(err => console.error("Failed to fetch character for chat:", err))
        .finally(() => setIsLoading(false));
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-rose-900/40">
        <div className="animate-pulse serif-display italic text-2xl tracking-widest">Waking character soul…</div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="min-h-screen flex items-center justify-center text-rose-500">
        <p>Character not found.</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-black overflow-hidden">
      <Header
        user={user}
        onNavigate={onNavigate}
        onSignOut={onSignOut}
        currentRoute={window.location.hash}
      />
      <div className="flex-1 mt-24">
        <ChatView 
          character={character} 
          onNavigate={onNavigate} 
          isFullScreen={true} 
        />
      </div>
    </div>
  );
}