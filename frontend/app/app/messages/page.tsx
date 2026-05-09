"use client";

import Link from "next/link";
import { MessageCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const conversations = [
  {
    id: 1,
    name: "Emma",
    age: 26,
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    lastMessage: "Hey! How was your day?",
    time: "2m ago",
    unread: true,
    online: true,
  },
  {
    id: 2,
    name: "Sophia",
    age: 24,
    photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop",
    lastMessage: "That restaurant looks amazing! Let's go this weekend.",
    time: "1h ago",
    unread: false,
    online: true,
  },
  {
    id: 3,
    name: "Olivia",
    age: 28,
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
    lastMessage: "You: I had a great time yesterday!",
    time: "3h ago",
    unread: false,
    online: false,
  },
  {
    id: 4,
    name: "Isabella",
    age: 25,
    photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop",
    lastMessage: "Can't wait to see you again!",
    time: "Yesterday",
    unread: false,
    online: false,
  },
];

export default function MessagesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                conv.unread
                  ? "bg-primary/5 border-primary/20 hover:border-primary/40"
                  : "bg-card border-border hover:border-primary/30"
              }`}
            >
              <div className="relative">
                <img
                  src={conv.photo}
                  alt={conv.name}
                  className="w-14 h-14 rounded-full object-cover"
                />
                {conv.online && (
                  <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-background rounded-full" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`font-semibold ${conv.unread ? "text-foreground" : "text-foreground"}`}>
                    {conv.name}, {conv.age}
                  </h3>
                  <span className="text-xs text-muted-foreground">{conv.time}</span>
                </div>
                <p className={`text-sm truncate ${conv.unread ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                  {conv.lastMessage}
                </p>
              </div>
              
              {conv.unread && (
                <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0" />
              )}
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
