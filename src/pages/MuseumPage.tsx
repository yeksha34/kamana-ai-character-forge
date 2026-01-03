
import React, { useEffect, useState, useCallback } from 'react';
import { Header } from "../components/Header";
import { MuseumView } from "../views/MuseumView";
import { CharacterData } from '../types';
import { getRawCharactersByUser, deleteRecord } from '../services/supabaseDatabaseService';

interface MuseumPageProps {
  user: any;
  onNavigate: (route: string) => void;
  onSignOut: () => void;
}

export function MuseumPage({
  user,
  onNavigate,
  onSignOut
}: MuseumPageProps) {
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCharacters = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await getRawCharactersByUser(user.id);
      const mapped = data.map((item: any) => ({
        ...item.data,
        id: item.id,
        status: item.status,
        version: item.version
      }));
      setCharacters(mapped);
    } catch (err) {
      console.error("Failed to load museum:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadCharacters();
  }, [loadCharacters]);

  const handleEdit = (character: CharacterData) => {
    onNavigate(`#/studio/${character.id}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to destroy this creation?")) return;
    try {
      await deleteRecord(id);
      setCharacters(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-rose-900/40">
        <div className="animate-pulse serif-display italic text-2xl tracking-widest">Opening Gallery…</div>
      </div>
    );
  }

  return (
    <>
      <Header
        user={user}
        onNavigate={onNavigate}
        onSignOut={onSignOut}
        currentRoute="#/museum"
      />
      <MuseumView
        characters={characters}
        onNavigate={onNavigate}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </>
  );
}
