"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

export default function TypewriterResponse({ 
  content, 
  speed = 10, 
  onComplete 
}: { 
  content: string; 
  speed?: number;
  onComplete?: () => void;
}) {
  const [displayedContent, setDisplayedContent] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < content.length) {
      const timeout = setTimeout(() => {
        setDisplayedContent((prev) => prev + content[index]);
        setIndex((prev) => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [index, content, speed, onComplete]);

  return (
    <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted prose-pre:p-2">
      {displayedContent}
    </ReactMarkdown>
  );
}
