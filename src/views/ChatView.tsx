import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CharacterData, ChatNode, ChatSession, AIProvider, MessageLength } from '../types';
import { Send, ArrowLeft, User as UserIcon, RefreshCw, Sparkles, UserCheck, GitFork, History, X } from 'lucide-react';
import { ForgeManager } from '../services/forge/ForgeManager';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { fetchChatSession, saveChatSession } from '../services/supabaseDatabaseService';
import { useViewport } from '../hooks/useViewport';

interface ChatViewProps {
  character: CharacterData;
  onNavigate?: (route: string) => void;
  isFullScreen?: boolean;
}

export const ChatView: React.FC<ChatViewProps> = (props) => {
  const { isMobile } = useViewport();
  const { user: authUser } = useAuth();
  const { userSecrets, models: dbModels } = useAppContext();
  
  const [session, setSession] = useState<ChatSession | null>(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');
  const [userName, setUserName] = useState(() => localStorage.getItem('kamana_user_name') || authUser?.name || 'User');
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { localStorage.setItem('kamana_user_name', userName); }, [userName]);

  const activeMessages = useMemo(() => {
    if (!session || !session.activeNodeId) return [];
    const path: ChatNode[] = [];
    let currId: string | null = session.activeNodeId;
    const nodeMap = new Map<string, ChatNode>(session.nodes.map(n => [n.id, n]));
    while (currId) {
      const node = nodeMap.get(currId);
      if (!node) break;
      path.unshift(node);
      currId = node.parentId;
    }
    return path;
  }, [session]);

  useEffect(() => {
    if (!authUser || !props.character.id) return;
    fetchChatSession(props.character.id, authUser.id).then(saved => {
      if (saved) setSession(saved);
      else {
        const initial: ChatNode = { id: crypto.randomUUID(), parentId: null, role: 'model', text: props.character.fields.find(f => f.label.toLowerCase().includes('message'))?.value || "*The character awaits your soul...*", timestamp: Date.now() };
        const sess: ChatSession = { id: `chat-${authUser.id}-${props.character.id}`, characterId: props.character.id!, userId: authUser.id, nodes: [initial], activeNodeId: initial.id, updatedAt: Date.now() };
        setSession(sess);
        saveChatSession(sess);
      }
    });
  }, [props.character.id, authUser?.id]);

  const handleSend = async (parentIdOverride?: string) => {
    if (!input.trim() || isTyping || !session) return;
    const parentId = parentIdOverride || session.activeNodeId;
    const userNode: ChatNode = { id: crypto.randomUUID(), parentId, role: 'user', text: input, timestamp: Date.now() };
    setSession(p => p ? { ...p, nodes: [...p.nodes, userNode], activeNodeId: userNode.id, updatedAt: Date.now() } : null);
    const userText = input; setInput(''); setIsTyping(true);
    try {
      const modelMeta = dbModels.find(m => m.id === selectedModel);
      const provider = modelMeta?.provider || AIProvider.GEMINI;
      const service = ForgeManager.getProvider(provider, userSecrets[provider]);
      const history = activeMessages.slice(-5).map(m => `${m.role === 'user' ? userName : props.character.name}: ${m.text}`).join('\n');
      const prompt = `You are ${props.character.name}.\nRules: ${props.character.systemRules}\nContext: ${history}\n${userName}: ${userText}\nResponse:`;
      const response = await service.refinePrompt({ prompt, tags: [], isNSFW: props.character.isNSFW, modelId: selectedModel });
      const modelNode: ChatNode = { id: crypto.randomUUID(), parentId: userNode.id, role: 'model', text: response.trim(), timestamp: Date.now() };
      setSession(p => p ? { ...p, nodes: [...p.nodes, modelNode], activeNodeId: modelNode.id, updatedAt: Date.now() } : null);
    } finally { setIsTyping(false); }
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [activeMessages, isTyping]);

  return (
    <div className={`flex flex-col bg-black relative overflow-hidden ${props.isFullScreen ? 'h-full w-full' : 'h-[85vh] max-w-6xl mx-auto rounded-[3rem] border border-rose-900/30 shadow-2xl'}`}>
      {/* IMMERSIVE SCENARIO BACKGROUND */}
      <div className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-[5s]" style={{ backgroundImage: `url(${props.character.scenarioImageUrl})` }} />
      <div className="absolute inset-0 z-[1] bg-black/60 backdrop-blur-sm" />
      
      <header className="relative z-20 flex-shrink-0 flex items-center justify-between p-4 lg:p-8 bg-black/40 border-b border-rose-950/20 backdrop-blur-xl">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-2xl border-2 border-rose-600/30 overflow-hidden shadow-xl flex-shrink-0"><img src={props.character.characterImageUrl} className="w-full h-full object-cover" alt="" /></div>
          <div className="min-w-0">
            <h3 className="text-lg lg:text-2xl serif-display italic text-rose-50 truncate">{props.character.name}</h3>
            <div className="flex items-center gap-3 opacity-40">
               <span className="text-[7px] lg:text-[8px] font-black uppercase text-rose-100 tracking-widest flex items-center gap-1.5"><History className="w-2.5 h-2.5" /> {session?.nodes.length} Nodes</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 lg:gap-6">
          <div className="hidden sm:flex items-center gap-3 px-4 py-2.5 bg-rose-950/20 rounded-full border border-rose-900/20">
            <UserCheck className="w-3.5 h-3.5 text-rose-500" />
            <input value={userName} onChange={(e) => setUserName(e.target.value)} className="bg-transparent border-none text-[9px] font-black uppercase text-rose-200 outline-none w-20" placeholder="User Name" />
          </div>
          <div className="flex items-center gap-3 px-4 py-2.5 bg-rose-950/20 rounded-full border border-rose-900/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="bg-transparent border-none text-[9px] font-black uppercase text-rose-200 outline-none cursor-pointer">
              {dbModels.filter(m => m.type === 'text').map(m => <option key={m.id} value={m.id} className="bg-black">{m.name}</option>)}
            </select>
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 lg:p-12 space-y-10 relative z-10 custom-scrollbar scroll-smooth pb-32">
        {activeMessages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group/msg animate-in fade-in slide-in-from-bottom-2 duration-500`}>
            <div className={`flex gap-4 lg:gap-6 max-w-[90%] lg:max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-10 h-10 lg:w-14 lg:h-14 rounded-2xl flex-shrink-0 flex items-center justify-center border shadow-xl ${msg.role === 'user' ? 'bg-rose-900/20 border-rose-500/40' : 'bg-black/80 border-rose-900/30'}`}>
                {msg.role === 'user' ? <UserIcon className="w-5 h-5 lg:w-7 lg:h-7 text-rose-50" /> : <img src={props.character.characterImageUrl} className="w-full h-full object-cover" alt="" />}
              </div>
              <div className="flex flex-col gap-3">
                <div className={`p-5 lg:p-10 rounded-[1.5rem] lg:rounded-[3rem] text-sm lg:text-lg leading-relaxed shadow-2xl ${msg.role === 'user' ? 'bg-rose-800/10 text-rose-50 border border-rose-700/30 rounded-tr-none' : 'bg-rose-950/40 text-rose-100 border border-rose-900/30 rounded-tl-none backdrop-blur-md'}`}>
                   {msg.text.split('\n').map((l, i) => <p key={i} className="mb-2 last:mb-0">{l}</p>)}
                </div>
                <div className={`flex transition-all duration-300 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} ${session?.activeNodeId === msg.id ? 'opacity-100' : 'opacity-0 group-hover/msg:opacity-100'}`}>
                   <button onClick={() => setSession(p => p ? ({ ...p, activeNodeId: msg.id }) : null)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest ${session?.activeNodeId === msg.id ? 'bg-rose-600 text-white' : 'bg-black/60 border border-rose-900/30 text-rose-500 hover:bg-rose-950/40'}`}>
                      <GitFork className="w-3 h-3" /> {session?.activeNodeId === msg.id ? 'Timeline Anchor' : 'Branch Here'}
                   </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {isTyping && <div className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-500 animate-pulse ml-16 lg:ml-20 flex items-center gap-3"><RefreshCw className="w-4 h-4 animate-spin" /> Awakening...</div>}
      </div>

      <footer className="relative z-30 p-6 lg:p-10 bg-black/90 border-t border-rose-950/40 shadow-2xl pb-10 lg:pb-12">
        <div className="max-w-4xl mx-auto flex items-end gap-4 lg:gap-8">
           {isMobile && (
             <input value={userName} onChange={(e) => setUserName(e.target.value)} className="bg-rose-950/20 border border-rose-900/20 rounded-xl px-3 py-3 text-[8px] font-black uppercase text-rose-200 outline-none w-16 mb-2" placeholder="User" />
           )}
           <textarea 
             rows={1} 
             value={input} 
             onChange={(e) => setInput(e.target.value)} 
             onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} 
             placeholder={`Speak with ${props.character.name}...`} 
             className="flex-1 bg-black/40 border border-rose-950/60 rounded-[1.5rem] lg:rounded-[2.5rem] px-6 lg:px-10 py-5 lg:py-8 text-base lg:text-xl text-rose-100 focus:border-rose-600/50 outline-none transition-all resize-none max-h-40 custom-scrollbar" 
           />
           <button onClick={() => handleSend()} disabled={!input.trim() || isTyping} className="p-6 lg:p-9 bg-rose-600 text-white rounded-[1.5rem] lg:rounded-[2.5rem] hover:bg-rose-500 shadow-2xl active:scale-90 disabled:opacity-20 transition-all flex-shrink-0">
             <Send className="w-6 h-6 lg:w-8 lg:h-8" />
           </button>
        </div>
      </footer>
    </div>
  );
};