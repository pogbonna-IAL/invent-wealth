"use client";

import { MessageCircle, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface FloatingWhatsAppProps {
  phoneNumber?: string;
  message?: string;
}

export function FloatingWhatsApp({ 
  phoneNumber = "+2349062764054",
  message = "Hello! I'm interested in learning more about InventWealth investment opportunities.",
}: FloatingWhatsAppProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Show after 3 seconds of page load
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleClick = () => {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\D/g, "")}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isExpanded ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-4 mb-3 w-64 border-2 border-green-500">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">Chat with us</p>
                <p className="text-xs text-muted-foreground">We typically reply in minutes</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsExpanded(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Button
            onClick={handleClick}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="sm"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Start Chat
          </Button>
        </div>
      ) : (
        <Button
          onClick={() => setIsExpanded(true)}
          size="icon"
          className="h-14 w-14 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 animate-bounce"
          aria-label="Open WhatsApp chat"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}

