import React, { useEffect, useState, useCallback } from 'react';
import { Header } from "../components/Header";
import { MuseumView } from "../views/MuseumView";
import { CharacterData } from '../types';
import { getRawCharactersByUser, deleteRecord, saveCharacter } from '../services/supabaseDatabaseService';
import { hashData } from '../utils/helpers';
import { parseImportFile } from '../utils/exportUtils';

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

  const handleDuplicate = async (character: CharacterData) => {
    if (!user) return;
    try {
      const duplicate: CharacterData = {
        ...character,
        id: 'new',
        name: `${character.name} (Duplicate)`,
        version: 1,
        status: 'draft',
        createdAt: Date.now(),
      };
      
      const hash = await hashData(duplicate.originalPrompt + Date.now().toString());
      const res = await saveCharacter(user.id, duplicate, hash);
      
      if (res) {
        await loadCharacters();
      }
    } catch (err) {
      console.error("Duplication failed:", err);
      alert("Failed to duplicate character. Please try again.");
    }
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

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    try {
      const imported = await parseImportFile(file);
      if (imported.length === 0) {
        alert("No valid character data found in the selected file.");
        return;
      }

      // Sequential import to avoid race conditions and ensure unique hashes
      for (let i = 0; i < imported.length; i++) {
        const char = imported[i];
        // Ensure unique hash even if imported rapidly
        const salt = `${i}-${Math.random().toString(36).substring(7)}`;
        const hash = await hashData(char.originalPrompt + salt + Date.now().toString());
        await saveCharacter(user.id, { ...char, id: 'new' }, hash);
      }
      
      await loadCharacters();
      alert(`Successfully imported ${imported.length} archetypes into your collection.`);
    } catch (err) {
      console.error("Import failed:", err);
      alert("Import failed. Ensure the file is a valid .json or .zip archive exported from Kamana Forge.");
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
        onDuplicate={handleDuplicate}
        onImport={handleImport}
      />
    </>
  );
}