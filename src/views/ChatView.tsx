import React, { useState, useEffect, useRef } from 'react';
import { CharacterData, ChatMessage, AIProvider, MessageLength } from '../types';
import { GlassCard } from '../components/ui/GlassCard';
import { Send, ArrowLeft, Maximize2, User as UserIcon, Bot, RefreshCw, Sparkles, UserCircle, AlignLeft } from 'lucide-react';
import { ForgeManager } from '../services/forge/ForgeManager';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';

interface ChatViewProps {
  character: CharacterData;
  onNavigate?: (route: string) => void;
  isFullScreen?: boolean;
}

export const ChatView: React.FC<ChatViewProps> = ({ character, onNavigate, isFullScreen = false }) => {
  const { user: authUser } = useAuth();
  const { userSecrets, models: dbModels, t } = useAppContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [userName, setUserName] = useState(authUser?.name || 'User');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');
  const [msgLength, setMsgLength] = useState<MessageLength>(MessageLength.MEDIUM);
  const scrollRef = useRef<HTMLDivElement>(null);

  const replaceTags = (text: string) => {
    return text
      .replace(/\{\{user\}\}/gi, userName)
      .replace(/\{\{chat\}\}/gi, character.name);
  };

  useEffect(() => {
    const firstMsgField = character.fields.find(f => 
      f.label.toLowerCase().includes('first message') || 
      f.label.toLowerCase().includes('initial message') ||
      f.label.toLowerCase().includes('initial prompt')
    );
    
    if (firstMsgField && messages.length === 0) {
      setMessages([{
        role: 'model',
        text: firstMsgField.value,
        timestamp: Date.now()
      }]);
    }
  }, [character]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const modelData = dbModels.find(m => m.id === selectedModel);
      const provider = modelData?.provider || AIProvider.GEMINI;
      const service = ForgeManager.getProvider(provider, userSecrets[provider]);

      const characterContext = character.fields
        .map(f => `${f.label}: ${replaceTags(f.value)}`)
        .join('\n');
      
      const lengthInstruction = {
        [MessageLength.SHORT]: "Keep your response very brief, ideally 1-2 sentences. Focus on immediate reaction.",
        [MessageLength.MEDIUM]: "Provide a balanced response of 2-3 paragraphs with narrative detail.",
        [MessageLength.LARGE]: "Write an extensive, highly descriptive, multi-paragraph literary response."
      }[msgLength];

      const systemPrompt = `You are playing the character ${character.name}. 
      RULES: ${replaceTags(character.systemRules || '')}
      LENGTH: ${lengthInstruction}
      CONTEXT:
      ${characterContext}
      STAY IN CHARACTER. IMMERSION IS PARAMOUNT. Use the specific vocabulary defined above.
      Speaking to: ${userName}.
      Respond as the character directly.`;

      const conversationHistory = messages
        .slice(-10) // Limit context for performance/tokens
        .map(m => `${m.role === 'user' ? userName : character.name}: ${replaceTags(m.text)}`)
        .join('\n');
      
      const fullPrompt = `${systemPrompt}\n\nCONVERSATION:\n${conversationHistory}\n${userName}: ${input}\n${character.name}:`;

      const response = await service.refinePrompt({
        prompt: fullPrompt,
        tags: [], 
        isNSFW: character.isNSFW,
        modelId: selectedModel
      });

      setMessages(prev => [...prev, {
        role: 'model',
        text: response.replace(new RegExp(`^${character.name}:`, 'i'), '').trim(),
        timestamp: Date.now()
      }]);
    } catch (err) {
      console.error("Chat failed:", err);
      setMessages(prev => [...prev, {
        role: 'model',
        text: "*The connection flickers... a brief silence ensues.*",
        timestamp: Date.now()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderMarkdown = (text: string) => {
    const processedText = replaceTags(text);
    return processedText.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line.split(/(\*\*.*?\*\*|\*.*?\*)/).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) return <strong key={j} className="text-rose-200">{part.slice(2, -2)}</strong>;
          if (part.startsWith('*') && part.endsWith('*')) return <em key={j} className="text-rose-400/80 italic">{part.slice(1, -1)}</em>;
          return part;
        })}
        <br />
      </React.Fragment>
    ));
  };

  return (
    <div className={`flex flex-col overflow-hidden bg-black relative ${isFullScreen ? 'h-full w-full' : 'h-[85vh] w-full max-w-5xl rounded-[2.5rem] border border-rose-900/30 shadow-2xl'}`}>
      <div className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none" style={{ backgroundImage: `url(${character.scenarioImageUrl})` }}>
        <div className="absolute inset-0 bg-black/80" />
      </div>

      {/* Responsive Header */}
      <header className="relative z-40 p-4 md:p-6 flex items-center justify-between border-b border-rose-900/20 bg-black/40 backdrop-blur-2xl">
        <div className="flex items-center gap-3 min-w-0">
          {onNavigate && (
            <button onClick={() => onNavigate('#/museum')} className="p-2 hover:bg-rose-900/20 rounded-full text-rose-500 transition-all">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-rose-600/30 overflow-hidden flex-shrink-0">
            <img src={character.characterImageUrl} className="w-full h-full object-cover" alt={character.name} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm md:text-lg serif-display italic text-rose-50 truncate leading-none">{character.name}</h3>
            <input 
              type="text" 
              value={userName} 
              onChange={(e) => setUserName(e.target.value)}
              className="bg-transparent border-none text-[7px] md:text-[8px] font-black uppercase tracking-widest text-rose-500/60 outline-none w-full"
              placeholder="YOUR NAME"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden sm:flex items-center gap-1 p-1 bg-rose-950/40 rounded-lg border border-rose-900/20">
            <AlignLeft className="w-3 h-3 text-rose-500 ml-1" />
            <select 
              value={msgLength} 
              onChange={(e) => setMsgLength(e.target.value as MessageLength)}
              className="bg-transparent border-none text-[8px] font-black uppercase tracking-widest text-rose-200 outline-none cursor-pointer p-1"
            >
              <option value={MessageLength.SHORT} className="bg-black">{t.lengths.short}</option>
              <option value={MessageLength.MEDIUM} className="bg-black">{t.lengths.medium}</option>
              <option value={MessageLength.LARGE} className="bg-black">{t.lengths.large}</option>
            </select>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-rose-950/40 rounded-full border border-rose-900/20">
            <Sparkles className="w-3 h-3 text-amber-500 hidden md:block" />
            <select 
              value={selectedModel} 
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-transparent border-none text-[8px] font-black uppercase tracking-widest text-rose-200 outline-none cursor-pointer max-w-[80px] md:max-w-none"
            >
              {dbModels.filter(m => m.type === 'text').map(m => (
                <option key={m.id} value={m.id} className="bg-black">{m.name}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex relative z-10">
        {/* Desktop Side Portrait */}
        <div className="hidden lg:flex w-1/4 flex-col items-center justify-center p-8 border-r border-rose-900/10 bg-black/20">
           <img src={character.characterImageUrl} className="w-48 h-48 xl:w-64 xl:h-64 rounded-[3rem] object-cover border-4 border-rose-900/20 shadow-2xl" />
           <div className="mt-8 text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-900 block mb-2">IMMERSIVE MODE</span>
              <h4 className="text-2xl serif-display italic text-rose-50">{character.name}</h4>
           </div>
        </div>

        {/* Scrollable Message List */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar bg-black/30">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`flex gap-3 max-w-[90%] md:max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border ${msg.role === 'user' ? 'bg-rose-900/20 border-rose-500/30' : 'bg-black/60 border-rose-900/20'}`}>
                  {msg.role === 'user' ? <UserIcon className="w-4 h-4 text-rose-500" /> : <Bot className="w-4 h-4 text-rose-400" />}
                </div>
                <div className={`p-4 md:p-5 rounded-2xl md:rounded-3xl text-xs md:text-sm leading-relaxed ${msg.role === 'user' ? 'bg-rose-800/10 text-rose-50 border border-rose-700/20 rounded-tr-none' : 'bg-rose-950/10 text-rose-200 border border-rose-900/10 rounded-tl-none backdrop-blur-md'}`}>
                  {renderMarkdown(msg.text)}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
               <div className="flex gap-2 items-center bg-rose-950/20 px-4 py-2 rounded-full border border-rose-900/10 text-[8px] font-black text-rose-500 uppercase tracking-widest animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin" /> {character.name} is sculpting a response...
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Always Visible Footer Input */}
      <footer className="relative z-40 p-4 md:p-6 bg-black/60 backdrop-blur-3xl border-t border-rose-900/20">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="flex-1 relative">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isTyping ? `Waiting for ${character.name}...` : `Speak your desire to ${character.name}...`}
              disabled={isTyping}
              className="w-full bg-black/40 border border-rose-950/40 rounded-2xl px-6 py-4 text-sm md:text-base text-rose-100 placeholder:text-rose-900/40 focus:border-rose-600/40 outline-none transition-all"
            />
          </div>
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="p-4 bg-rose-600 text-white rounded-2xl hover:bg-rose-500 transition-all shadow-xl active:scale-95 disabled:opacity-20 flex-shrink-0"
          >
            <Send className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>
        <div className="flex justify-center gap-4 mt-4 text-[7px] font-black uppercase tracking-[0.4em] text-rose-900/60">
           <span>Engine: {selectedModel}</span>
           <span className="sm:hidden">Length: {msgLength}</span>
        </div>
      </footer>
    </div>
  );
};