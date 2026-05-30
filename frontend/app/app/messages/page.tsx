"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

interface Conversation {
  id: string;
  firstName: string;
  age: number;
  photoUrls: string[];
  lastMessage?: string;
  lastMessageAt?: string;
}

export default function MessagesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConversations() {
      try {
        const data = await apiFetch("/conversations");
        setConversations(data);
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchConversations();
  }, []);

  const filteredConversations = conversations.filter((conv) =>
    conv.firstName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Conversations List */}
      {filteredConversations.length > 0 ? (
        <div className="flex flex-col gap-2">
          {filteredConversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/app/messages/${conv.id}`}
              className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all"
            >
              <div className="relative">
                <img
                  src={conv.photoUrls?.[0] || "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=200&h=200&fit=crop"}
                  alt={conv.firstName}
                  className="w-14 h-14 rounded-full object-cover"
                />
                <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-background rounded-full" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-foreground">
                    {conv.firstName}, {conv.age}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {conv.lastMessageAt ? formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true }) : "Just matched"}
                  </span>
                </div>
                <p className="text-sm truncate text-muted-foreground">
                  {conv.lastMessage || "Matched! Send a message ✨"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No messages yet
          </h2>
          <p className="text-muted-foreground">
            When you match with someone, you can start a conversation here.
          </p>
        </div>
      )}
    </div>
  );
}
