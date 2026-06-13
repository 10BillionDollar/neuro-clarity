import { useState, useCallback } from "react";
import { API_BASE_URL } from "@/app/config";

export interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

export interface UseChatbotOptions {
  apiUrl?: string;
  maxHistory?: number;
  welcomeMessage?: string;
}

export function useChatbot(options: UseChatbotOptions = {}) {
  const {
    apiUrl = API_BASE_URL+"/chat",
    maxHistory = 10,
    welcomeMessage = "Hi I'm NEMA Chat, I can help with general medical questions. Please don't share personal identifying medical details."
  } = options;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      text: welcomeMessage,
      sender: "bot",
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: message,
      sender: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
          conversation_history: messages.slice(-maxHistory).map(msg => ({
            role: msg.sender === "user" ? "user" : "assistant",
            content: msg.text
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const data = await response.json();
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: data.reply || data.response || data.message || "Sorry, I couldn't process your request.",
        sender: "bot",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Chatbot error:", err);
      
      const errorBotMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble connecting. Please try again later.",
        sender: "bot",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorBotMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, messages, maxHistory, isLoading]);

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: Date.now().toString(),
        text: welcomeMessage,
        sender: "bot",
        timestamp: new Date()
      }
    ]);
    setError(null);
  }, [welcomeMessage]);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    resetError
  };
}
