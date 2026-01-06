import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CharacterData, ChatNode, ChatSession, AIProvider, MessageLength } from '../types';
import { Send, User as UserIcon, RefreshCw, Sparkles, UserCheck, GitFork, History } from 'lucide-react';
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
  const [density, setDensity] = useState<MessageLength>(MessageLength.MEDIUM);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { localStorage.setItem('kamana_user_name', userName); }, [userName]);

  const replaceUserTags = (text: string) => {
    if (!text) return "";
    return text.replace(/\{\{user\}\}/gi, userName);
  };

  const activeMessages = useMemo(() => {
    if (!session || !session.activeNodeId) return [];
    const path: ChatNode[] = [];
    let currId: string | null = session.activeNodeId;
    const nodeMap = new Map<string, ChatNode>(session.nodes.map(n => [n.id, n]));
    while (currId) {
      const node = nodeMap.get(currId);
      if (!node) break;
      path.unshift({ ...node, text: replaceUserTags(node.text) });
      currId = node.parentId;
    }
    return path;
  }, [session, userName]);

  useEffect(() => {
    if (!authUser || !props.character.id) return;
    fetchChatSession(props.character.id, authUser.id).then(saved => {
      if (saved) setSession(saved);
      else {
        const firstMsgField = props.character.fields.find(f => f.label.toLowerCase().includes('message'));
        const initialText = firstMsgField ? firstMsgField.value : "*The character awaits your soul...*";
        const initial: ChatNode = { id: crypto.randomUUID(), parentId: null, role: 'model', text: initialText, timestamp: Date.now() };
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
    
    const updatedNodes = [...session.nodes, userNode];
    const interimSession = { ...session, nodes: updatedNodes, activeNodeId: userNode.id, updatedAt: Date.now() };
    setSession(interimSession);
    saveChatSession(interimSession);

    const userText = input; setInput(''); setIsTyping(true);
    try {
      const modelMeta = dbModels.find(m => m.id === selectedModel);
      const provider = modelMeta?.provider || AIProvider.GEMINI;
      const service = ForgeManager.getProvider(provider, userSecrets[provider]);
      
      const history = activeMessages.slice(-8).map(m => `${m.role === 'user' ? userName : props.character.name}: ${m.text}`).join('\n');
      const sysRules = replaceUserTags(props.character.systemRules || "");
      const prompt = `You are ${props.character.name}.\nRULES: ${sysRules}\nHISTORY:\n${history}\n${userName}: ${userText}\nResponse:`;
      
      const response = await service.refinePrompt({ 
        prompt, 
        tags: [], 
        isNSFW: props.character.isNSFW, 
        modelId: selectedModel,
        responseLength: density 
      });

      const responseText = typeof response === 'string' ? response : response.text;
      const modelNode: ChatNode = { id: crypto.randomUUID(), parentId: userNode.id, role: 'model', text: responseText.trim(), timestamp: Date.now() };
      
      const finalSession = { ...interimSession, nodes: [...updatedNodes, modelNode], activeNodeId: modelNode.id, updatedAt: Date.now() };
      setSession(finalSession);
      saveChatSession(finalSession);
    } finally { setIsTyping(false); }
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [activeMessages, isTyping]);

  return (
    <div className={`flex flex-col bg-black relative overflow-hidden ${props.isFullScreen ? 'h-full w-full' : 'h-[85vh] max-w-7xl mx-auto rounded-[3rem] border border-rose-900/30 shadow-2xl'}`}>
      {/* IMMERSIVE SCENARIO BACKGROUND - REDUCED BLUR */}
      <div className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-[5s]" style={{ backgroundImage: `url(${props.character.scenarioImageUrl})` }} />
      <div className="absolute inset-0 z-[1] bg-black/50 backdrop-blur-[1px]" />
      
      <header className="relative z-20 flex-shrink-0 flex items-center justify-between p-3 lg:p-6 bg-black/40 border-b border-rose-950/20 backdrop-blur-xl">
        <div className="flex items-center gap-3 lg:gap-4 min-w-0">
          <div className="w-10 h-10 lg:w-14 lg:h-14 rounded-xl border-2 border-rose-600/30 overflow-hidden shadow-xl flex-shrink-0"><img src={props.character.characterImageUrl} className="w-full h-full object-cover" alt="" /></div>
          <div className="min-w-0">
            <h3 className="text-sm lg:text-xl serif-display italic text-rose-50 truncate">{props.character.name}</h3>
            <span className="text-[7px] lg:text-[8px] font-black uppercase text-rose-500/60 tracking-widest flex items-center gap-1.5"><History className="w-2.5 h-2.5" /> {session?.nodes.length} Nodes</span>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          <div className="flex items-center gap-1 lg:gap-2 bg-rose-950/30 p-0.5 lg:p-1 rounded-full border border-rose-900/20">
             {(['short', 'medium', 'large'] as MessageLength[]).map(l => (
               <button key={l} onClick={() => setDensity(l)} className={`px-2 lg:px-3 py-1 rounded-full text-[6px] lg:text-[7px] font-black uppercase tracking-tighter transition-all ${density === l ? 'bg-rose-600 text-white' : 'text-rose-900 hover:text-rose-500'}`}>
                 {l === 'short' ? 'Whisper' : l === 'medium' ? 'Echo' : 'Log'}
               </button>
             ))}
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-950/30 rounded-full border border-rose-900/20 max-w-[80px] lg:max-w-none overflow-hidden">
            <Sparkles className="w-3 h-3 text-amber-500 flex-shrink-0" />
            <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="bg-transparent border-none text-[7px] lg:text-[8px] font-black uppercase text-rose-200 outline-none cursor-pointer p-0">
              {dbModels.filter(m => m.type === 'text').map(m => <option key={m.id} value={m.id} className="bg-black">{m.name.split(' ')[0]}</option>)}
            </select>
          </div>
        </div>
      </header>

      {/* MESSAGE LIST - ENSURE OVERFLOW WORK ON ALL DEVICES */}
      <div ref={scrollRef} className={`flex-1 overflow-y-auto ${isMobile ? 'p-4 space-y-8' : 'p-10 space-y-10'} relative z-10 custom-scrollbar scroll-smooth`}>
        {activeMessages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group/msg animate-in fade-in slide-in-from-bottom-2 duration-500`}>
            <div className={`flex gap-3 lg:gap-5 max-w-[95%] lg:max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl flex-shrink-0 flex items-center justify-center border shadow-xl ${msg.role === 'user' ? 'bg-rose-900/40 border-rose-500/40' : 'bg-black/90 border-rose-900/40'}`}>
                {msg.role === 'user' ? <UserIcon className="w-4 h-4 lg:w-6 lg:h-6 text-rose-50" /> : <img src={props.character.characterImageUrl} className="w-full h-full object-cover rounded-xl" alt="" />}
              </div>
              <div className="flex flex-col gap-2">
                <div className={`p-4 lg:p-8 rounded-[1.5rem] lg:rounded-[2.5rem] ${isMobile ? 'text-[14px]' : 'text-lg'} leading-relaxed shadow-2xl ${msg.role === 'user' ? 'bg-rose-900/20 text-rose-50 border border-rose-700/30 rounded-tr-none' : 'bg-rose-950/60 text-rose-100 border border-rose-900/30 rounded-tl-none backdrop-blur-[1px]'}`}>
                   {msg.text.split('\n').map((l, i) => <p key={i} className="mb-2 last:mb-0">{l}</p>)}
                </div>
                <div className={`flex transition-all duration-300 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} ${session?.activeNodeId === msg.id ? 'opacity-100' : 'opacity-0 group-hover/msg:opacity-100'}`}>
                   <button onClick={() => setSession(p => p ? ({ ...p, activeNodeId: msg.id }) : null)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[7px] font-black uppercase tracking-widest ${session?.activeNodeId === msg.id ? 'bg-rose-600 text-white' : 'bg-black/60 border border-rose-900/30 text-rose-500'}`}>
                      <GitFork className="w-2.5 h-2.5" /> Branch
                   </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {isTyping && <div className="text-[9px] font-black uppercase tracking-[0.4em] text-rose-500 animate-pulse ml-12 lg:ml-16 flex items-center gap-3"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Awakening...</div>}
        <div className="h-4 lg:h-8" />
      </div>

      <footer className={`relative z-30 p-4 lg:p-8 bg-black/90 border-t border-rose-950/50 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]`}>
        <div className="max-w-5xl mx-auto flex items-end gap-3 lg:gap-6">
           <div className="flex flex-col gap-2 flex-1">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-950/20 border border-rose-900/20 rounded-xl w-fit">
                <UserCheck className="w-3 h-3 text-rose-500" />
                <input value={userName} onChange={(e) => setUserName(e.target.value)} className="bg-transparent border-none text-[8px] font-black uppercase text-rose-200 outline-none w-20" placeholder="User Name" />
             </div>
             <textarea 
               rows={1} 
               value={input} 
               onChange={(e) => setInput(e.target.value)} 
               onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} 
               placeholder={`Message ${props.character.name}...`} 
               className="w-full bg-rose-950/10 border border-rose-950/60 rounded-2xl lg:rounded-[2rem] px-5 lg:px-8 py-3 lg:py-6 text-sm lg:text-xl text-rose-100 focus:border-rose-600/50 outline-none transition-all resize-none max-h-32 custom-scrollbar shadow-inner" 
             />
           </div>
           <button onClick={() => handleSend()} disabled={!input.trim() || isTyping} className="p-4 lg:p-8 bg-rose-600 text-white rounded-2xl lg:rounded-[2rem] hover:bg-rose-500 shadow-2xl active:scale-90 disabled:opacity-20 transition-all flex-shrink-0 mb-1">
             <Send className="w-5 h-5 lg:w-8 lg:h-8" />
           </button>
        </div>
      </footer>
    </div>
  );
};