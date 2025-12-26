"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { importPayoutsCSV } from "@/app/actions/admin/payouts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface CSVImportButtonProps {
  distributionId: string;
}

export function CSVImportButton({ distributionId }: CSVImportButtonProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [csvData, setCsvData] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvData(text);
      setError(null);
    };
    reader.onerror = () => {
      setError("Failed to read file");
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvData.trim()) {
      setError("Please select a CSV file or paste CSV data");
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      const result = await importPayoutsCSV({
        distributionId,
        csvData,
      });

      if (result.success) {
        alert(`Successfully imported ${result.updated} payout(s)`);
        setIsOpen(false);
        setCsvData("");
        router.refresh();
      } else {
        const errorMessage = 
          ("errors" in result && result.errors && result.errors.length > 0)
            ? result.errors.join("\n")
            : ("error" in result && result.error ? result.error : "Failed to import payouts");
        setError(errorMessage || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default">
          <Upload className="mr-2 h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Payouts from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to update multiple payouts at once. The CSV should include payout_id, status, amount, and paid_at columns.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file">Select CSV File</Label>
            <input
              ref={fileInputRef}
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="csv-data">Or Paste CSV Data</Label>
            <Textarea
              id="csv-data"
              value={csvData}
              onChange={(e) => {
                setCsvData(e.target.value);
                setError(null);
              }}
              rows={10}
              placeholder="payout_id,status,amount,paid_at&#10;clx123...,PAID,1500.00,2024-01-15T10:00:00Z"
              className="font-mono text-sm"
            />
          </div>

          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive whitespace-pre-wrap">
              {error}
            </div>
          )}

          <div className="rounded-md bg-muted p-3 text-sm">
            <p className="font-semibold mb-2">CSV Format:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>First row must be headers: payout_id, status, amount, paid_at</li>
              <li>status must be either PENDING or PAID</li>
              <li>amount must be a positive number</li>
              <li>paid_at must be ISO datetime format (YYYY-MM-DDTHH:mm:ssZ) or empty</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isImporting}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isImporting || !csvData.trim()}>
            {isImporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

