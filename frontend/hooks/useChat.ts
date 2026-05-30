import { useState, useEffect, useCallback, useRef } from "react";
import { WS_BASE_URL } from "@/lib/api";

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

export function useChat(userId: string | undefined, otherUserId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!userId) return;

    const socket = new WebSocket(`${WS_BASE_URL}/${userId}`);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // Only append if the message is part of this specific conversation
      if (
        (data.sender_id === userId && data.receiver_id === otherUserId) ||
        (data.sender_id === otherUserId && data.receiver_id === userId)
      ) {
        setMessages((prev) => [...prev, data]);
      }
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      socket.close();
    };
  }, [userId, otherUserId]);

  const sendMessage = useCallback((content: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && otherUserId) {
      socketRef.current.send(JSON.stringify({
        receiver_id: otherUserId,
        content: content
      }));
    }
  }, [otherUserId]);

  return { messages, setMessages, sendMessage };
}
