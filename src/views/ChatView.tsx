import React, { useState, useEffect, useRef } from 'react';
import { CharacterData, ChatMessage, AIProvider } from '../types';
import { GlassCard } from '../components/ui/GlassCard';
import { Send, ArrowLeft, Maximize2, User as UserIcon, Bot, RefreshCw, Sparkles, UserCircle } from 'lucide-react';
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
  const { userSecrets, models: dbModels } = useAppContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [userName, setUserName] = useState(authUser?.name || 'User');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Helper to replace tags in text
  const replaceTags = (text: string) => {
    return text
      .replace(/\{\{user\}\}/gi, userName)
      .replace(/\{\{chat\}\}/gi, character.name);
  };

  // Initialize with the character's "First Message" if available
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
  }, [messages, isTyping, userName]);

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

      // Construct a testing context from character fields
      // We replace tags in the context as well so the AI knows the user's chosen name
      const characterContext = character.fields
        .map(f => `${f.label}: ${replaceTags(f.value)}`)
        .join('\n');
      
      const systemPrompt = `You are playing the character ${character.name}. 
      RULES AND CONSTRAINTS: 
      ${replaceTags(character.systemRules || '')}
      
      CHARACTER DEFINITION:
      ${characterContext}
      
      STAY IN CHARACTER. Do not break immersion. Use the language and tone defined above.
      The person you are talking to is named ${userName}.
      Respond as the character.`;

      const conversationHistory = messages
        .map(m => `${m.role === 'user' ? userName : character.name}: ${replaceTags(m.text)}`)
        .join('\n');
      
      const fullPrompt = `${systemPrompt}\n\nCONVERSATION HISTORY:\n${conversationHistory}\n${userName}: ${input}\n${character.name}:`;

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
        text: "*The character remains silent, lost in thought... (Error connecting to AI)*",
        timestamp: Date.now()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderMarkdown = (text: string) => {
    // Replace tags before rendering markdown components
    const processedText = replaceTags(text);
    
    return processedText.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line.split(/(\*\*.*?\*\*|\*.*?\*)/).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="text-rose-200">{part.slice(2, -2)}</strong>;
          }
          if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={j} className="text-rose-400/80">{part.slice(1, -1)}</em>;
          }
          return part;
        })}
        <br />
      </React.Fragment>
    ));
  };

  return (
    <div className={`relative flex flex-col overflow-hidden ${isFullScreen ? 'h-screen w-screen' : 'h-[800px] w-full max-w-4xl rounded-[3rem] border border-rose-900/30 shadow-2xl'}`}>
      {/* Background Layer: Scenario */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
        style={{ backgroundImage: `url(${character.scenarioImageUrl})` }}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      </div>

      {/* Header */}
      <header className="relative z-20 p-6 flex flex-wrap items-center justify-between border-b border-rose-900/20 bg-black/40 backdrop-blur-xl gap-4">
        <div className="flex items-center gap-4">
          {onNavigate && (
            <button onClick={() => onNavigate('#/museum')} className="p-2 hover:bg-rose-900/20 rounded-full text-rose-500 transition-all">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-rose-600/30 overflow-hidden bg-rose-950">
              <img src={character.characterImageUrl} className="w-full h-full object-cover" alt={character.name} />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
          </div>
          <div>
            <h3 className="text-lg serif-display italic text-rose-50 leading-none">{character.name}</h3>
            <span className="text-[8px] font-black uppercase tracking-widest text-rose-700">Interacting as </span>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-950/30 rounded-lg border border-rose-900/20 group/name">
            <UserCircle className="w-3.5 h-3.5 text-rose-500" />
            <input 
              type="text" 
              value={userName} 
              onChange={(e) => setUserName(e.target.value)}
              className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-rose-100 outline-none w-24 placeholder:text-rose-900/30"
              placeholder="Your Name"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 ml-auto">
          <div className="flex items-center gap-2 px-4 py-2 bg-rose-950/40 rounded-full border border-rose-900/20">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <select 
              value={selectedModel} 
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-transparent border-none text-[9px] font-black uppercase tracking-widest text-rose-200 outline-none cursor-pointer"
            >
              {dbModels.filter(m => m.type === 'text').map(m => (
                <option key={m.id} value={m.id} className="bg-black text-rose-100">{m.name}</option>
              ))}
            </select>
          </div>
          {!isFullScreen && onNavigate && (
            <button onClick={() => onNavigate(`#/chat/${character.id}`)} className="p-2 hover:bg-rose-900/20 rounded-full text-rose-500 transition-all">
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="relative flex-1 overflow-hidden z-10 flex flex-col md:flex-row">
        {/* Persistent Portrait Side (Desktop) */}
        <div className="hidden md:flex w-1/3 flex-col items-center justify-center p-8 border-r border-rose-900/10">
           <div className="relative group">
              <div className="absolute -inset-4 bg-rose-600/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-all duration-1000" />
              <img 
                src={character.characterImageUrl} 
                className="w-64 h-64 rounded-full object-cover border-4 border-rose-900/30 relative z-10 shadow-2xl transition-transform duration-700 group-hover:scale-105" 
                alt={character.name}
              />
           </div>
           <div className="mt-8 text-center space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-800">Interacting with</span>
              <h4 className="text-4xl serif-display italic text-rose-50">{character.name}</h4>
           </div>
        </div>

        {/* Message Thread */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar"
        >
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
              <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border ${msg.role === 'user' ? 'bg-rose-900/20 border-rose-700/30 text-rose-500' : 'bg-black/40 border-rose-900/30'}`}>
                  {msg.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4 text-rose-400" />}
                </div>
                <div className={`p-5 rounded-3xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-rose-800/20 text-rose-100 rounded-tr-none border border-rose-700/20' : 'bg-black/60 text-rose-200 rounded-tl-none border border-rose-900/20 backdrop-blur-md'}`}>
                  {renderMarkdown(msg.text)}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start animate-pulse">
               <div className="flex gap-4 items-center bg-black/40 p-4 rounded-2xl border border-rose-900/20">
                  <RefreshCw className="w-3 h-3 text-rose-500 animate-spin" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-rose-500">{character.name} is writing...</span>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <footer className="relative z-20 p-8 bg-gradient-to-t from-black via-black/80 to-transparent">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <div className="flex-1 relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500 to-rose-900 rounded-2xl blur opacity-10 group-focus-within:opacity-30 transition-all" />
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={`Speak to ${character.name} as ${userName}...`}
              className="relative w-full bg-black/60 border border-rose-950/40 rounded-2xl px-8 py-5 text-rose-100 placeholder:text-rose-900/40 focus:border-rose-600/50 outline-none transition-all"
            />
          </div>
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="p-5 bg-rose-600 text-white rounded-2xl hover:bg-rose-500 transition-all shadow-xl active:scale-90 disabled:opacity-20"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
        <p className="text-center mt-6 text-[8px] font-black uppercase tracking-[0.4em] text-rose-950">
          Artificial Soul powered by {selectedModel}
        </p>
      </footer>
    </div>
  );
};