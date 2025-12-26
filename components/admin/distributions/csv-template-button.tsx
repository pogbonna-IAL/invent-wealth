"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

interface CSVTemplateButtonProps {
  distributionId: string;
}

export function CSVTemplateButton({ distributionId }: CSVTemplateButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Fetch payouts for this distribution
      const response = await fetch(`/api/admin/distributions/${distributionId}/payouts`);
      if (!response.ok) {
        throw new Error("Failed to fetch payouts");
      }

      const data = await response.json();
      const payouts = data.payouts || [];

      // Create CSV content
      const headers = ["payout_id", "investor_name", "investor_email", "shares", "amount", "status", "paid_at"];
      const rows = payouts.map((payout: any) => [
        payout.id,
        payout.user.name || "",
        payout.user.email || "",
        payout.sharesAtRecord,
        Number(payout.amount).toFixed(2),
        payout.status,
        payout.paidAt ? new Date(payout.paidAt).toISOString() : "",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row: any[]) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `payouts-template-${distributionId.slice(0, 8)}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading template:", error);
      alert("Failed to download template. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleDownload} disabled={isDownloading}>
      {isDownloading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      Download CSV Template
    </Button>
  );
}

