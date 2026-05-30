"use client";

import { useState, useRef, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Send, MoreVertical, Phone, Video, Image, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { fetchMe } from "@/lib/me";
import { useChat } from "@/hooks/useChat";

interface Message {
  id: string;
  text: string;
  sender: "me" | "them";
  time: string;
}

interface Contact {
  id: string;
  firstName: string;
  age: number;
  photoUrls: string[];
  online: boolean;
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [contact, setContact] = useState<Contact | null>(null);
  const [me, setMe] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  const { messages, setMessages, sendMessage } = useChat(me?.id, resolvedParams.id);

  useEffect(() => {
    async function fetchData() {
      try {
        const [meData, messagesData, matchesData] = await Promise.all([
          fetchMe(),
          apiFetch(`/messages/${resolvedParams.id}`),
          apiFetch("/matches"),
        ]);
        
        setMe(meData);
        
        // Find contact info from matches
        const contactInfo = matchesData.find((m: any) => m.id === resolvedParams.id);
        if (contactInfo) {
          setContact({
            id: contactInfo.id,
            firstName: contactInfo.firstName,
            age: contactInfo.age,
            photoUrls: contactInfo.photoUrls,
            online: true, // Simplified for now
          });
        }

        // Map backend messages to frontend format
        const mappedMessages = messagesData.map((m: any) => ({
          id: m.id || Math.random().toString(),
          sender_id: m.senderId,
          receiver_id: m.receiver_id || resolvedParams.id, // Fallback for historical data
          content: m.content,
          created_at: m.createdAt,
        }));
        
        setMessages(mappedMessages);
      } catch (error) {
        console.error("Failed to fetch chat data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [resolvedParams.id, setMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading || !contact) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleSend = () => {
    if (!newMessage.trim()) return;
    sendMessage(newMessage);
    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] -m-6">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-background">
        <div className="flex items-center gap-3">
          <Link
            href="/app/messages"
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          
          <div className="relative">
            <img
              src={contact.photoUrls?.[0] || "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=200&h=200&fit=crop"}
              alt={contact.firstName}
              className="w-10 h-10 rounded-full object-cover"
            />
            {contact.online && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
            )}
          </div>
          
          <div>
            <h2 className="font-semibold text-foreground">
              {contact.firstName}, {contact.age}
            </h2>
            <p className="text-xs text-muted-foreground">
              {contact.online ? "Online now" : "Last seen recently"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {/* Match notice */}
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm">
            <Heart className="w-4 h-4 fill-primary" />
            You matched with {contact.firstName}!
          </div>
        </div>

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender_id === me.id ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                message.sender_id === me.id
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md"
              }`}
            >
              <p>{message.content}</p>
              <p
                className={`text-xs mt-1 ${
                  message.sender_id === me.id ? "text-primary-foreground/70" : "text-muted-foreground"
                }`}
              >
                {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-background">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-3"
        >
          <button
            type="button"
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Image className="w-5 h-5" />
          </button>
          
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1"
          />
          
          <Button
            type="submit"
            size="icon"
            disabled={!newMessage.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
