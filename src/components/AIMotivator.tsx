import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

type AIMode = 'coach' | 'study-help' | 'planner' | 'general';

const modeConfig: Record<AIMode, { label: string; emoji: string; prompts: string[] }> = {
  coach: { label: 'Coach', emoji: '🔥', prompts: ['Motivate me!', 'I feel lazy today', 'Celebrate my progress'] },
  'study-help': { label: 'Study', emoji: '📚', prompts: ['Give me a study tip', 'Explain Pomodoro technique', 'Quiz me on something'] },
  planner: { label: 'Planner', emoji: '📋', prompts: ['Plan my evening', 'Help me prioritize', 'Create a study schedule'] },
  general: { label: 'General', emoji: '💬', prompts: ['How to make friends in college?', 'Healthy snack ideas', 'Creative project ideas'] },
};

interface AIMotivatorProps {
  streak: number;
  completedMissions: number;
  totalMissions: number;
  totalXp: number;
}

const STREAM_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-motivator`;

const AIMotivator = ({ streak, completedMissions, totalMissions, totalXp }: AIMotivatorProps) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<AIMode>('coach');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    const userMsg: Message = { role: 'user', content: messageText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const resp = await fetch(STREAM_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: newMessages,
          context: { streak, completedMissions, totalMissions, totalXp },
          mode,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to connect');
      }

      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantContent = '';

      // Add empty assistant message
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              const finalContent = assistantContent;
              setMessages(prev =>
                prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: finalContent } : m))
              );
            }
          } catch {
            // partial JSON, ignore
          }
        }
      }

      if (!assistantContent) {
        setMessages(prev =>
          prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: "Keep going, you're doing great! 💪" } : m))
        );
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting right now. Keep pushing forward! 💪" }]);
    } finally {
      setLoading(false);
    }
  };

  const currentPrompts = modeConfig[mode].prompts;

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full gradient-primary shadow-lg flex items-center justify-center z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageCircle className="text-primary-foreground" size={24} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-4 left-4 sm:left-auto sm:w-[380px] max-h-[520px] rounded-2xl shadow-2xl bg-card border border-border flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="gradient-primary p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="text-primary-foreground" size={18} />
                <h3 className="font-semibold text-primary-foreground text-sm">QuestUp AI</h3>
              </div>
              <button onClick={() => setOpen(false)} className="text-primary-foreground/80 hover:text-primary-foreground">
                <X size={18} />
              </button>
            </div>

            {/* Mode selector */}
            <div className="flex gap-1 p-2 border-b border-border">
              {(Object.keys(modeConfig) as AIMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-all ${
                    mode === m
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {modeConfig[m].emoji} {modeConfig[m].label}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[180px] max-h-[300px]">
              {messages.length === 0 && (
                <div className="text-center py-4">
                  <Sparkles className="mx-auto text-primary mb-2" size={28} />
                  <p className="text-sm text-muted-foreground mb-3">Hey! I'm your QuestUp AI. Try asking me something!</p>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {currentPrompts.map(p => (
                      <button
                        key={p}
                        onClick={() => sendMessage(p)}
                        className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-foreground transition-colors"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'gradient-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown>{msg.content || '...'}</ReactMarkdown>
                      </div>
                    ) : msg.content}
                  </div>
                </motion.div>
              ))}

              {loading && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl px-3 py-2">
                    <Loader2 className="animate-spin text-muted-foreground" size={16} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-2 border-t border-border">
              <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask QuestUp AI..."
                  className="flex-1 text-sm h-9"
                />
                <Button type="submit" size="icon" disabled={loading || !input.trim()} className="gradient-primary border-0 h-9 w-9">
                  <Send size={14} className="text-primary-foreground" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIMotivator;
