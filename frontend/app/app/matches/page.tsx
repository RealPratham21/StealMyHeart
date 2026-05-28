"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

interface Match {
  id: string;
  firstName: string;
  age: number;
  photoUrls: string[];
  lastMessage?: string;
  lastMessageAt?: string;
}

export default function MatchesPage() {
  const [newMatches, setNewMatches] = useState<Match[]>([]);
  const [conversations, setConversations] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [matchesData, conversationsData] = await Promise.all([
          apiFetch("/matches"),
          apiFetch("/conversations"),
        ]);
        
        // Filter out matches that already have conversations
        const conversationIds = new Set(conversationsData.map((c: any) => c.id));
        const filteredNewMatches = matchesData.filter((m: any) => !conversationIds.has(m.id));
        
        setNewMatches(filteredNewMatches);
        setConversations(conversationsData);
      } catch (error) {
        console.error("Failed to fetch matches:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* New Matches */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          New Matches
        </h2>
        
        {newMatches.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
            {newMatches.map((match) => (
              <Link
                key={match.id}
                href={`/app/messages/${match.id}`}
                className="flex-shrink-0 group"
              >
                <div className="relative">
                  <img
                    src={match.photoUrls?.[0] || "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=200&h=200&fit=crop"}
                    alt={match.firstName}
                    className="w-20 h-20 rounded-full object-cover border-2 border-primary group-hover:border-4 transition-all"
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Heart className="w-3 h-3 text-primary-foreground fill-primary-foreground" />
                  </div>
                </div>
                <p className="text-center mt-2 text-sm font-medium text-foreground">
                  {match.firstName}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-card rounded-xl border border-border">
            <Heart className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No new matches yet</p>
          </div>
        )}
      </section>

      {/* Messages */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Messages
        </h2>
        
        {conversations.length > 0 ? (
          <div className="flex flex-col gap-2">
            {conversations.map((match) => (
              <Link
                key={match.id}
                href={`/app/messages/${match.id}`}
                className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/30 transition-all"
              >
                <img
                  src={match.photoUrls?.[0] || "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=200&h=200&fit=crop"}
                  alt={match.firstName}
                  className="w-14 h-14 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-foreground">
                      {match.firstName}, {match.age}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {match.lastMessageAt ? formatDistanceToNow(new Date(match.lastMessageAt), { addSuffix: true }) : ""}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {match.lastMessage}
                  </p>
                </div>
                <MessageCircle className="w-5 h-5 text-muted-foreground" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-card rounded-xl border border-border">
            <MessageCircle className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">
              Start a conversation with your matches!
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
