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

      const characterContext = character.fields
        .map(f => `${f.label}: ${replaceTags(f.value)}`)
        .join('\n');
      
      const lengthInstruction = {
        [MessageLength.SHORT]: "Keep your response very brief, ideally 1-2 sentences. Focus on immediate reaction.",
        [MessageLength.MEDIUM]: "Provide a balanced response of 2-3 paragraphs with narrative detail.",
        [MessageLength.LARGE]: "Write an extensive, highly descriptive, multi-paragraph literary roleplay response."
      }[msgLength];

      const systemPrompt = `You are playing the character ${character.name}. 
      RULES AND CONSTRAINTS: 
      ${replaceTags(character.systemRules || '')}
      
      LENGTH CONSTRAINT: ${lengthInstruction}
      
      CHARACTER DEFINITION:
      ${characterContext}
      
      STAY IN CHARACTER. Do not break immersion. Use the language and tone defined above.
      The person you are talking to is named ${userName}.
      Respond as the character. Do not include your own name in the start of the message.`;

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
    const processedText = replaceTags(text);
    
    return processedText.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line.split(/(\*\*.*?\*\*|\*.*?\*)/).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="text-rose-200">{part.slice(2, -2)}</strong>;
          }
          if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={j} className="text-rose-400/80 italic">{part.slice(1, -1)}</em>;
          }
          return part;
        })}
        <br />
      </React.Fragment>
    ));
  };

  return (
    <div className={`relative flex flex-col overflow-hidden bg-black ${isFullScreen ? 'h-full w-full' : 'h-[80vh] w-full max-w-4xl rounded-[2rem] border border-rose-900/30 shadow-2xl'}`}>
      {/* Background Layer */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000 opacity-20 pointer-events-none"
        style={{ backgroundImage: `url(${character.scenarioImageUrl})` }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      </div>

      {/* Header */}
      <header className="relative z-30 p-4 md:p-6 flex flex-wrap items-center justify-between border-b border-rose-900/20 bg-black/60 backdrop-blur-xl gap-4">
        <div className="flex items-center gap-3 md:gap-4 flex-1">
          {onNavigate && (
            <button onClick={() => onNavigate('#/museum')} className="p-2 hover:bg-rose-900/20 rounded-full text-rose-500 transition-all">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-rose-600/30 overflow-hidden bg-rose-950">
              <img src={character.characterImageUrl} className="w-full h-full object-cover" alt={character.name} />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm md:text-lg serif-display italic text-rose-50 leading-none truncate">{character.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1 px-2 py-0.5 bg-rose-950/30 rounded border border-rose-900/20">
                <UserCircle className="w-2.5 h-2.5 text-rose-500" />
                <input 
                  type="text" 
                  value={userName} 
                  onChange={(e) => setUserName(e.target.value)}
                  className="bg-transparent border-none text-[8px] font-black uppercase tracking-widest text-rose-100 outline-none w-16 md:w-24 placeholder:text-rose-900/30"
                  placeholder="Your Name"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Response Length Toggle */}
          <div className="flex items-center gap-1 p-1 bg-rose-950/40 rounded-lg border border-rose-900/20">
            <AlignLeft className="w-3 h-3 text-rose-500 ml-1 hidden md:block" />
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

          <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-rose-950/40 rounded-full border border-rose-900/20">
            <Sparkles className="w-3 h-3 text-amber-500 hidden md:block" />
            <select 
              value={selectedModel} 
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-transparent border-none text-[8px] md:text-[9px] font-black uppercase tracking-widest text-rose-200 outline-none cursor-pointer"
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
      <div className="relative flex-1 overflow-hidden z-20 flex flex-col md:flex-row min-h-0">
        {/* Side Portrait (Desktop Only) */}
        <div className="hidden lg:flex w-1/4 flex-col items-center justify-center p-8 border-r border-rose-900/10">
           <div className="relative group max-w-full">
              <div className="absolute -inset-4 bg-rose-600/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-all duration-1000" />
              <img 
                src={character.characterImageUrl} 
                className="w-48 h-48 xl:w-64 xl:h-64 rounded-full object-cover border-4 border-rose-900/30 relative z-10 shadow-2xl transition-transform duration-700 group-hover:scale-105" 
                alt={character.name}
              />
           </div>
           <div className="mt-8 text-center space-y-2">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-rose-800">Interacting with</span>
              <h4 className="text-2xl xl:text-4xl serif-display italic text-rose-50">{character.name}</h4>
           </div>
        </div>

        {/* Message Thread */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 custom-scrollbar scroll-smooth bg-black/40"
        >
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
              <div className={`flex gap-3 md:gap-4 max-w-[90%] md:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex-shrink-0 flex items-center justify-center border ${msg.role === 'user' ? 'bg-rose-900/20 border-rose-700/30 text-rose-500' : 'bg-black/40 border-rose-900/30'}`}>
                  {msg.role === 'user' ? <UserIcon className="w-3 h-3 md:w-4 md:h-4" /> : <Bot className="w-3 h-3 md:w-4 md:h-4 text-rose-400" />}
                </div>
                <div className={`p-4 md:p-5 rounded-2xl md:rounded-3xl text-xs md:text-sm leading-relaxed ${msg.role === 'user' ? 'bg-rose-800/20 text-rose-100 rounded-tr-none border border-rose-700/20' : 'bg-rose-950/10 text-rose-200 rounded-tl-none border border-rose-900/20 backdrop-blur-md'}`}>
                  {renderMarkdown(msg.text)}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start animate-pulse">
               <div className="flex gap-3 items-center bg-black/60 p-3 rounded-2xl border border-rose-900/20">
                  <RefreshCw className="w-3 h-3 text-rose-500 animate-spin" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-rose-500">{character.name} is writing...</span>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <footer className="relative z-30 p-4 md:p-8 bg-black/80 backdrop-blur-xl border-t border-rose-900/10">
        <div className="max-w-4xl mx-auto flex items-center gap-3 md:gap-4">
          <div className="flex-1 relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500 to-rose-900 rounded-2xl blur opacity-5 group-focus-within:opacity-20 transition-all" />
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isTyping ? `${character.name} is speaking...` : `Speak to ${character.name}...`}
              disabled={isTyping}
              className="relative w-full bg-black/40 border border-rose-950/40 rounded-xl md:rounded-2xl px-5 py-4 md:px-8 md:py-5 text-sm md:text-base text-rose-100 placeholder:text-rose-900/30 focus:border-rose-600/50 outline-none transition-all disabled:opacity-50"
            />
          </div>
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="p-4 md:p-5 bg-rose-600 text-white rounded-xl md:rounded-2xl hover:bg-rose-500 transition-all shadow-xl active:scale-90 disabled:opacity-20 flex-shrink-0"
          >
            <Send className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>
        <p className="text-center mt-4 md:mt-6 text-[7px] md:text-[8px] font-black uppercase tracking-[0.4em] text-rose-950/50">
          Neural Forge active via {selectedModel}
        </p>
      </footer>
    </div>
  );
};