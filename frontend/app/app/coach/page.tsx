"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Sparkles, User, Bot, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import ReactMarkdown from 'react-markdown';
import ChatSidebar from "@/components/ChatSidebar";
import TypewriterResponse from "@/components/TypewriterResponse";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isTyping?: boolean;
}

interface ChatThread {
  id: string;
  title: string;
  createdAt: string;
}

export default function AICoachPage() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [thoughtState, setThoughtState] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchThreads = useCallback(async () => {
    try {
      const data = await apiFetch("/ai/chats");
      setThreads(data);
    } catch (err) {
      console.error("Failed to fetch chats:", err);
    }
  }, []);

  const loadChat = async (id: string) => {
    setActiveChatId(id);
    setIsLoading(true);
    try {
      const data = await apiFetch(`/ai/chats/${id}`);
      setMessages(data.map((m: any, idx: number) => ({
        id: idx.toString(),
        role: m.role,
        content: m.content
      })));
    } catch (err) {
      console.error("Failed to load chat messages:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setActiveChatId(null);
    setMessages([{
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your AI Dating Coach. I can help you analyze your type, improve your bio, or find people with specific vibes. What's on your mind?"
    }]);
  };

  const deleteChat = async (id: string) => {
    try {
      await apiFetch(`/ai/chats/${id}`, { method: "DELETE" });
      setThreads(prev => prev.filter(t => t.id !== id));
      if (activeChatId === id) startNewChat();
    } catch (err) {
      console.error("Failed to delete chat:", err);
    }
  };

  useEffect(() => {
    fetchThreads();
    startNewChat();
  }, [fetchThreads]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thoughtState]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);
    
    const states = ["Analyzing patterns...", "Comparing vibes...", "Formulating insights..."];
    let stateIdx = 0;
    const stateInterval = setInterval(() => {
      setThoughtState(states[stateIdx % states.length]);
      stateIdx++;
    }, 2500);

    try {
      const data = await apiFetch("/ai/coach", {
        method: "POST",
        body: JSON.stringify({ 
          question: currentInput,
          chatId: activeChatId 
        })
      });

      if (!activeChatId) {
        setActiveChatId(data.chatId);
        fetchThreads();
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        isTyping: true
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AI Coach Error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again."
      }]);
    } finally {
      clearInterval(stateInterval);
      setThoughtState(null);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] max-w-6xl mx-auto bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      <ChatSidebar 
        threads={threads} 
        activeId={activeChatId} 
        onSelect={loadChat}
        onNewChat={startNewChat}
        onDelete={deleteChat}
      />

      <div className="flex-1 flex flex-col bg-background">
        {/* Header */}
        <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">AI Dating Coach</h2>
              <p className="text-[10px] text-muted-foreground">Context-Aware Analysis</p>
            </div>
          </div>
          {activeChatId && (
             <p className="text-xs text-muted-foreground italic hidden sm:block">
               Ongoing Conversation
             </p>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm ${
                  m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                  m.role === 'user' 
                    ? 'bg-primary text-primary-foreground rounded-tr-none shadow-md' 
                    : 'bg-muted/50 text-foreground rounded-tl-none border border-border/50'
                }`}>
                  {m.isTyping ? (
                    <TypewriterResponse 
                      content={m.content} 
                      speed={15} 
                      onComplete={() => {
                        setMessages(prev => prev.map(msg => 
                          msg.id === m.id ? { ...msg, isTyping: false } : msg
                        ));
                      }}
                    />
                  ) : (
                    <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted prose-pre:p-2">
                      {m.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl bg-muted/30 text-foreground rounded-tl-none flex items-center gap-2 border border-border/30">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-xs italic text-muted-foreground">{thoughtState || "Thinking..."}</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 border-t border-border bg-background/50 backdrop-blur-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2 relative max-w-3xl mx-auto"
          >
            <Input
              placeholder="Ask about your type, your bio, or dating patterns..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="pr-12 py-6 rounded-xl shadow-inner border-border/50 focus-visible:ring-primary/20"
            />
            <Button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="absolute right-1.5 top-1.5 h-9 w-9 p-0 rounded-lg shadow-sm"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
          <p className="text-[10px] text-muted-foreground text-center mt-3 opacity-60">
            The coach analyzes your history and provides data-backed dating insights.
          </p>
        </div>
      </div>
    </div>
  );
}
