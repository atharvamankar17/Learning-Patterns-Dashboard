import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Loader2, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useClassSelection } from "@/contexts/ClassContext";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface Message {
    role: "user" | "assistant";
    text: string;
    loading?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Markdown-lite renderer: bold, bullets, line breaks
// ─────────────────────────────────────────────────────────────
function RenderMessage({ text }: { text: string }) {
    const lines = text.split("\n");
    return (
        <div className="space-y-1 text-sm leading-relaxed">
            {lines.map((line, i) => {
                if (!line.trim()) return <div key={i} className="h-1" />;

                // Bullet points
                const bulletMatch = line.match(/^[\-\*•]\s+(.+)/);
                if (bulletMatch) {
                    return (
                        <div key={i} className="flex gap-2 items-start">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-current shrink-0 opacity-60" />
                            <span dangerouslySetInnerHTML={{ __html: formatInline(bulletMatch[1]) }} />
                        </div>
                    );
                }

                // Numbered lists
                const numMatch = line.match(/^\d+\.\s+(.+)/);
                if (numMatch) {
                    return (
                        <div key={i} className="flex gap-2 items-start">
                            <span className="shrink-0 opacity-60 font-mono text-xs mt-0.5">{line.match(/^\d+/)![0]}.</span>
                            <span dangerouslySetInnerHTML={{ __html: formatInline(numMatch[1]) }} />
                        </div>
                    );
                }

                return (
                    <p key={i} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
                );
            })}
        </div>
    );
}

function formatInline(text: string): string {
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

// ─────────────────────────────────────────────────────────────
// Suggested quick prompts
// ─────────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
    "Who are the top at-risk students?",
    "Summarise overall class performance",
    "Are there any fairness concerns?",
    "Which cluster needs the most attention?",
];

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export function ChatBot() {
    const { selectedClass } = useClassSelection();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            text: `👋 Hi! I'm **PRAXIS AI**, your teaching assistant. I have live access to the data for **${selectedClass === "School" ? "the whole school" : selectedClass}**.\n\nAsk me anything — at-risk students, cluster insights, performance trends, fairness concerns, and more.`,
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Update greeting when class changes
    useEffect(() => {
        setMessages([
            {
                role: "assistant",
                text: `👋 Hi! I'm **PRAXIS AI**, your teaching assistant. I have live access to the data for **${selectedClass === "School" ? "the whole school" : selectedClass}**.\n\nAsk me anything — at-risk students, cluster insights, performance trends, fairness concerns, and more.`,
            },
        ]);
    }, [selectedClass]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    }, [open]);

    const sendMessage = async (text: string) => {
        if (!text.trim() || loading) return;

        const userMsg: Message = { role: "user", text: text.trim() };
        const loadingMsg: Message = { role: "assistant", text: "", loading: true };

        setMessages(prev => [...prev, userMsg, loadingMsg]);
        setInput("");
        setLoading(true);

        // Build history for API (exclude the loading placeholder)
        const history = messages.map(m => ({ role: m.role, text: m.text }));

        try {
            const res = await fetch("http://localhost:5001/api/gemini/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: text.trim(),
                    history,
                    className: selectedClass === "School" ? null : selectedClass,
                }),
            });

            const data = await res.json();
            const reply = data.reply || data.error || "Something went wrong.";

            setMessages(prev =>
                prev.map((m, i) =>
                    i === prev.length - 1 ? { role: "assistant", text: reply, loading: false } : m
                )
            );
        } catch {
            setMessages(prev =>
                prev.map((m, i) =>
                    i === prev.length - 1
                        ? { role: "assistant", text: "⚠️ Could not reach the server. Is the backend running?", loading: false }
                        : m
                )
            );
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    };

    return (
        <>
            {/* ── Floating Trigger Button ── */}
            <button
                onClick={() => setOpen(o => !o)}
                aria-label="Open AI assistant"
                className={cn(
                    "fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full shadow-2xl transition-all duration-300",
                    "h-14 w-14 bg-primary text-primary-foreground hover:scale-110 active:scale-95",
                    open && "rotate-180 bg-muted text-foreground"
                )}
            >
                {open ? <ChevronDown className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
                {!open && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 border-2 border-background animate-pulse" />
                )}
            </button>

            {/* ── Chat Panel ── */}
            <div
                className={cn(
                    "fixed bottom-24 right-6 z-50 flex flex-col rounded-2xl border bg-card shadow-2xl transition-all duration-300 origin-bottom-right",
                    "w-[380px] max-w-[calc(100vw-3rem)]",
                    open
                        ? "scale-100 opacity-100 pointer-events-auto h-[540px]"
                        : "scale-90 opacity-0 pointer-events-none h-[540px]"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b bg-primary/5 rounded-t-2xl">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
                            <Sparkles className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold leading-none">PRAXIS AI</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {selectedClass === "School" ? "All classes" : `Class ${selectedClass}`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live data
                        </span>
                        <button
                            onClick={() => setOpen(false)}
                            className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scroll-smooth">
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={cn(
                                "flex",
                                msg.role === "user" ? "justify-end" : "justify-start"
                            )}
                        >
                            <div
                                className={cn(
                                    "max-w-[88%] rounded-2xl px-3.5 py-2.5",
                                    msg.role === "user"
                                        ? "bg-primary text-primary-foreground rounded-br-sm"
                                        : "bg-muted text-foreground rounded-bl-sm"
                                )}
                            >
                                {msg.loading ? (
                                    <div className="flex items-center gap-2 py-0.5">
                                        <Loader2 className="h-3.5 w-3.5 animate-spin opacity-50" />
                                        <span className="text-xs opacity-50">Thinking...</span>
                                    </div>
                                ) : msg.role === "assistant" ? (
                                    <RenderMessage text={msg.text} />
                                ) : (
                                    <p className="text-sm leading-relaxed">{msg.text}</p>
                                )}
                            </div>
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>

                {/* Quick Prompts (only visible before any user message) */}
                {messages.length === 1 && (
                    <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                        {QUICK_PROMPTS.map(q => (
                            <button
                                key={q}
                                onClick={() => sendMessage(q)}
                                disabled={loading}
                                className="text-xs px-2.5 py-1 rounded-full border bg-background hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input */}
                <div className="border-t px-3 py-2.5 bg-card rounded-b-2xl">
                    <div className="flex items-end gap-2">
                        <Textarea
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about your students..."
                            rows={1}
                            disabled={loading}
                            className="resize-none min-h-[36px] max-h-[120px] text-sm bg-muted/50 border-0 focus-visible:ring-1 rounded-xl py-2 px-3"
                        />
                        <Button
                            size="icon"
                            onClick={() => sendMessage(input)}
                            disabled={loading || !input.trim()}
                            className="h-9 w-9 shrink-0 rounded-xl"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center mt-1.5">
                        Press Enter to send · Shift+Enter for new line
                    </p>
                </div>
            </div>
        </>
    );
}
