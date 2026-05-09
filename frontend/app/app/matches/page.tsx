"use client";

import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";

const matches = [
  {
    id: 1,
    name: "Emma",
    age: 26,
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    matchedAt: "2 hours ago",
    lastMessage: null,
  },
  {
    id: 2,
    name: "Sophia",
    age: 24,
    photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop",
    matchedAt: "Yesterday",
    lastMessage: "Hey! How are you?",
  },
  {
    id: 3,
    name: "Olivia",
    age: 28,
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
    matchedAt: "3 days ago",
    lastMessage: "That sounds amazing!",
  },
  {
    id: 4,
    name: "Isabella",
    age: 25,
    photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop",
    matchedAt: "1 week ago",
    lastMessage: null,
  },
];

export default function MatchesPage() {
  const newMatches = matches.filter((m) => !m.lastMessage);
  const conversations = matches.filter((m) => m.lastMessage);

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
                    src={match.photo}
                    alt={match.name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-primary group-hover:border-4 transition-all"
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Heart className="w-3 h-3 text-primary-foreground fill-primary-foreground" />
                  </div>
                </div>
                <p className="text-center mt-2 text-sm font-medium text-foreground">
                  {match.name}
                </p>
                <p className="text-center text-xs text-muted-foreground">
                  {match.matchedAt}
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
                  src={match.photo}
                  alt={match.name}
                  className="w-14 h-14 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-foreground">
                      {match.name}, {match.age}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {match.matchedAt}
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
