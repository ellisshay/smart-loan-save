import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-chat`;

const QUICK_REPLIES = [
  "כמה עולה השירות?",
  "מה ההבדל מיועץ רגיל?",
  "האם זה מתאים לי?",
  "איך מתחילים?",
];

const WELCOME_MESSAGE: Msg = {
  role: "assistant",
  content: "שלום! אני EasyBot 👋\nיש לך שאלות על משכנתאות? אני כאן.\nאפשר לשאול על תהליך, עלויות, או סתם להבין אם EasyMorte מתאים לך.",
};

export default function PublicChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [showPulse, setShowPulse] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!open) setShowPulse(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([WELCOME_MESSAGE]);
    }
  }, [open]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Msg = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setUserMessageCount(prev => prev + 1);

    let assistantSoFar = "";
    const conversationHistory = [...messages, userMsg].slice(-10).map(m => ({
      role: m.role, content: m.content,
    }));

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          message: text,
          conversation_history: conversationHistory,
        }),
      });

      if (resp.status === 429) {
        toast({ title: "יותר מדי בקשות", description: "נסה שוב בעוד כמה שניות", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      if (resp.status === 402) {
        toast({ title: "שגיאה", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      if (!resp.ok || !resp.body) throw new Error("Failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && prev.length > 1 && prev[prev.length - 2]?.role === "user") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error("Public chat error:", e);
      setMessages(prev => [...prev, { role: "assistant", content: "מצטער, אירעה שגיאה. נסה שוב." }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  const showCTA = userMessageCount >= 2;

  return (
    <>
      {/* Floating button - bottom RIGHT, blue */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-5 py-3 text-white shadow-lg hover:shadow-xl transition-shadow"
            style={{ backgroundColor: "#1A56DB" }}
          >
            <MessageCircle size={20} />
            <span className="text-sm font-semibold">שאל אותי</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel - bottom RIGHT */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[calc(100vw-3rem)] sm:w-[400px] h-[520px] max-h-[80vh] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header - blue */}
            <div className="flex items-center justify-between px-4 py-3 text-white" style={{ backgroundColor: "#1A56DB" }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                  🤖
                </div>
                <div>
                  <h3 className="text-sm font-bold">EasyBot</h3>
                  <p className="text-[10px] opacity-80 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                    כאן לעזור
                  </p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/10 rounded">
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === "user"
                      ? "text-white rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`} style={msg.role === "user" ? { backgroundColor: "#1A56DB" } : undefined}>
                    {msg.content}
                  </div>
                </div>
              ))}

              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}

              {/* Quick replies - only after welcome */}
              {messages.length === 1 && !isLoading && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {QUICK_REPLIES.map((qr) => (
                    <button
                      key={qr}
                      onClick={() => sendMessage(qr)}
                      className="text-xs px-3 py-1.5 rounded-full transition-colors text-white hover:opacity-90"
                      style={{ backgroundColor: "#1A56DB20", color: "#1A56DB", border: "1px solid #1A56DB30" }}
                    >
                      {qr}
                    </button>
                  ))}
                </div>
              )}

              {/* CTA banner after 2+ user messages */}
              {showCTA && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl p-4 text-white text-center space-y-2"
                  style={{ backgroundColor: "#1A56DB" }}
                >
                  <p className="text-sm font-bold">רוצה ניתוח אישי של המשכנתא שלך?</p>
                  <p className="text-xs opacity-90">₪197 בלבד</p>
                  <Link
                    to="/intake"
                    className="inline-flex items-center gap-1 bg-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-white/90 transition-colors"
                    style={{ color: "#1A56DB" }}
                  >
                    <ArrowLeft size={14} />
                    התחל עכשיו
                  </Link>
                </motion.div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
              className="flex items-center gap-2 p-3 border-t border-border"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="שאל אותי משהו..."
                className="flex-1 bg-muted/50 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1A56DB]/30"
                disabled={isLoading}
                dir="rtl"
              />
              <Button
                type="submit"
                size="icon"
                className="h-9 w-9 rounded-xl shrink-0"
                style={{ backgroundColor: "#1A56DB" }}
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
