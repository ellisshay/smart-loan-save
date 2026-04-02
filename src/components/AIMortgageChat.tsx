import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const QUICK_REPLIES = [
  "מה הציון הפיננסי שלי?",
  "הסבר לי את המסלול המומלץ",
  "כמה זמן לוקח התהליך?",
  "מה המסמכים שחסרים לי?",
];

export default function AIMortgageChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        supabase.from("profiles").select("first_name").eq("user_id", user.id).single()
          .then(({ data }) => { if (data?.first_name) setUserName(data.first_name); });
      }
    });
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Show welcome on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: `שלום ${userName || ""}! אני EasyBot 👋\nאני כאן לענות על כל שאלה לגבי המשכנתא שלך.\nמה תרצה לדעת?`,
      }]);
    }
  }, [open, userName]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !userId || isLoading) return;

    const userMsg: Msg = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

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
          user_id: userId,
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
        toast({ title: "שגיאה", description: "נגמרו הקרדיטים של ה-AI", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      if (!resp.ok || !resp.body) throw new Error("Failed to start stream");

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

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
            }
          } catch { /* ignore */ }
        }
      }

      // Save assistant message to DB
      if (assistantSoFar) {
        await supabase.from("chat_messages").insert({
          user_id: userId,
          role: "assistant",
          content: assistantSoFar,
        });
      }
    } catch (e) {
      console.error("Chat error:", e);
      setMessages(prev => [...prev, { role: "assistant", content: "מצטער, אירעה שגיאה. נסה שוב." }]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, messages, isLoading]);

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
          >
            <MessageCircle size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-6 z-50 w-[calc(100vw-3rem)] sm:w-[400px] h-[500px] max-h-[80vh] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center text-sm font-bold">
                  🤖
                </div>
                <div>
                  <h3 className="text-sm font-bold">EasyBot</h3>
                  <p className="text-[10px] opacity-80 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                    יועץ AI שלך
                  </p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-primary-foreground/10 rounded">
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}>
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert [&>p]:m-0">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : msg.content}
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

              {/* Quick replies */}
              {messages.length === 1 && !isLoading && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {QUICK_REPLIES.map((qr) => (
                    <button
                      key={qr}
                      onClick={() => sendMessage(qr)}
                      className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
                    >
                      {qr}
                    </button>
                  ))}
                </div>
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
                placeholder="שאל אותי על המשכנתא..."
                className="flex-1 bg-muted/50 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                disabled={isLoading}
                dir="rtl"
              />
              <Button
                type="submit"
                size="icon"
                className="h-9 w-9 rounded-xl shrink-0"
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
