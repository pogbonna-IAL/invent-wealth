"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WhatsAppCTAProps {
  phoneNumber?: string;
  message?: string;
  className?: string;
}

export function WhatsAppCTA({ 
  phoneNumber = "+2349062764054",
  message = "Hello! I'm interested in learning more about InventWealth investment opportunities.",
  className = ""
}: WhatsAppCTAProps) {
  const handleClick = () => {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\D/g, "")}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <Button
      onClick={handleClick}
      size="lg"
      className={`bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}
    >
      <MessageCircle className="h-5 w-5 mr-2" />
      Chat on WhatsApp
    </Button>
  );
}

