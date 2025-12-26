"use client";

import { Users, TrendingUp, Shield, Award } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Stat {
  value: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const stats: Stat[] = [
  {
    value: "500+",
    label: "Active Investors",
    icon: <Users className="h-6 w-6" />,
    color: "text-blue-600",
  },
  {
    value: "₦2.5B+",
    label: "Total Invested",
    icon: <TrendingUp className="h-6 w-6" />,
    color: "text-green-600",
  },
  {
    value: "100%",
    label: "Secure & Regulated",
    icon: <Shield className="h-6 w-6" />,
    color: "text-orange-600",
  },
  {
    value: "4.8/5",
    label: "Investor Rating",
    icon: <Award className="h-6 w-6" />,
    color: "text-yellow-600",
  },
];

export function SocialProof() {
  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="p-6 text-center border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg bg-background/50"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3 ${stat.color}`}>
                {stat.icon}
              </div>
              <div className="text-2xl md:text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

