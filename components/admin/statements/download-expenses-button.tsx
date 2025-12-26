"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useState } from "react";

interface DownloadExpensesButtonProps {
  statementId: string;
  propertyName: string;
  periodStart: Date;
  periodEnd: Date;
}

export function DownloadExpensesButton({
  statementId,
  propertyName,
  periodStart,
  periodEnd,
}: DownloadExpensesButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/admin/statements/${statementId}/download-expenses`);
      if (!response.ok) {
        throw new Error("Failed to download expenses");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Operating-Expenses-${propertyName.replace(/\s+/g, "-")}-${new Date(periodStart).toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download expenses statement. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={isDownloading}
    >
      <Download className="mr-2 h-4 w-4" />
      {isDownloading ? "Downloading..." : "Download Expenses"}
    </Button>
  );
}

