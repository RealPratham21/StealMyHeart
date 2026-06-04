"use client";

import { Plus, MessageSquare, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatThread {
  id: string;
  title: string;
  createdAt: string;
}

export default function ChatSidebar({
  threads,
  activeId,
  onSelect,
  onNewChat,
  onDelete,
}: {
  threads: ChatThread[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="w-64 border-r border-border flex flex-col bg-muted/10 h-full">
      <div className="p-4 border-b border-border">
        <Button 
          onClick={onNewChat} 
          className="w-full flex items-center gap-2 justify-start"
          variant="outline"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {threads.map((thread) => (
          <div
            key={thread.id}
            className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
              activeId === thread.id
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted"
            }`}
            onClick={() => onSelect(thread.id)}
          >
            <MessageSquare className="w-4 h-4 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs truncate">{thread.title}</p>
              <p className="text-[10px] opacity-60">
                {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}
              </p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted-foreground/10 rounded transition-opacity">
                  <MoreVertical className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive flex items-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(thread.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    </div>
  );
}
