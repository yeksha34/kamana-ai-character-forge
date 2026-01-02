
import React, { useState } from 'react';
import { X, Plus, Hash } from 'lucide-react';

interface TagManagerProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
}

export const TagManager: React.FC<TagManagerProps> = ({ tags, onTagsChange }) => {
  const [input, setInput] = useState('');

  const addTag = () => {
    const trimmed = input.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      onTagsChange([...tags, trimmed]);
      setInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(t => t !== tagToRemove));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <span key={tag} className="flex items-center gap-2 px-4 py-1.5 bg-rose-950/40 border border-rose-900/20 rounded-full text-[10px] font-bold text-rose-300 uppercase tracking-widest group">
            <Hash className="w-3 h-3 opacity-40" />
            {tag}
            <button onClick={() => removeTag(tag)} className="hover:text-white transition-colors">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTag()}
          placeholder="टॅग जोडा (Add Tag)..."
          className="flex-1 bg-black/20 border border-rose-950/40 rounded-xl px-4 py-2 text-[11px] text-rose-100 focus:border-rose-700/50 outline-none transition-all"
        />
        <button onClick={addTag} className="p-2 bg-rose-900/20 border border-rose-900/40 text-rose-400 rounded-xl hover:bg-rose-800 hover:text-white transition-all">
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
