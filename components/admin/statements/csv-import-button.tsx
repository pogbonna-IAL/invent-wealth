"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CSVImportButtonProps {
  onImport: (items: Array<{ description: string; amount: number; category?: string }>) => void;
}

const VALID_CATEGORIES = ["GENERAL_OPERATIONS", "MARKETING", "MAINTENANCE"] as const;

export function CSVImportButton({ onImport }: CSVImportButtonProps) {
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      // Detect header row and format (2-column or 3-column)
      const firstLine = lines[0]?.toLowerCase() || '';
      const hasHeader = firstLine.includes('description') || firstLine.includes('category');
      const hasCategoryColumn = hasHeader && firstLine.includes('category');
      
      const dataLines = hasHeader ? lines.slice(1) : lines;
      
      const items: Array<{ description: string; amount: number; category?: string }> = [];
      const invalidCategories: string[] = [];
      
      for (const line of dataLines) {
        if (!line.trim()) continue;
        
        // Parse CSV line - handle quoted and unquoted values
        const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
        
        let category: string | undefined;
        let description = '';
        let amountStr = '';
        
        if (parts.length === 3) {
          // Format: Category,Description,Amount
          category = parts[0].trim();
          description = parts[1].trim();
          amountStr = parts[2].trim();
        } else if (parts.length === 2) {
          // Format: Description,Amount (backward compatible)
          // Check if first part looks like a category
          const firstPart = parts[0].trim().toUpperCase();
          if (VALID_CATEGORIES.includes(firstPart as any)) {
            // It's actually Category,Description format (missing amount)
            // Treat as Description,Amount instead
            description = parts[0].trim();
            amountStr = parts[1].trim();
          } else {
            // Standard Description,Amount format
            description = parts[0].trim();
            amountStr = parts[1].trim();
          }
        } else if (parts.length > 3) {
          // More than 3 columns - take first 3
          category = parts[0].trim();
          description = parts[1].trim();
          amountStr = parts[2].trim();
        } else {
          // Invalid format - skip this line
          continue;
        }
        
        // Validate and parse
        if (!description || !amountStr) continue;
        
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) continue;
        
        // Validate category if provided
        let validCategory: string | undefined;
        if (category) {
          const categoryUpper = category.toUpperCase();
          if (VALID_CATEGORIES.includes(categoryUpper as any)) {
            validCategory = categoryUpper;
          } else {
            // Invalid category - store for warning but still import the item
            if (!invalidCategories.includes(category)) {
              invalidCategories.push(category);
            }
            // Item will be imported without category (uncategorized)
          }
        }
        
        items.push({
          description: description.trim(),
          amount,
          category: validCategory,
        });
      }
      
      if (items.length === 0) {
        alert(
          "No valid cost items found in CSV.\n\n" +
          "Expected formats:\n" +
          "1. Category,Description,Amount (e.g., GENERAL_OPERATIONS,Utilities,1500.00)\n" +
          "2. Description,Amount (e.g., Utilities,1500.00)\n\n" +
          "Valid categories: GENERAL_OPERATIONS, MARKETING, MAINTENANCE"
        );
        return;
      }
      
      // Show warning if there were invalid categories
      if (invalidCategories.length > 0) {
        const warningMsg = 
          `Imported ${items.length} items successfully.\n\n` +
          `Warning: Invalid category values found and ignored:\n${invalidCategories.join(', ')}\n\n` +
          `Valid categories are: ${VALID_CATEGORIES.join(', ')}\n` +
          `Items with invalid categories were imported as uncategorized.`;
        alert(warningMsg);
      }
      
      onImport(items);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error("CSV import error:", error);
      alert(
        "Failed to import CSV file. Please check the format.\n\n" +
        "Supported formats:\n" +
        "1. Category,Description,Amount (e.g., GENERAL_OPERATIONS,Utilities,1500.00)\n" +
        "2. Description,Amount (e.g., Utilities,1500.00)\n\n" +
        "Valid categories: GENERAL_OPERATIONS, MARKETING, MAINTENANCE"
      );
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="csv-import" className="text-sm">Import from CSV</Label>
      <div className="flex items-center gap-2">
        <Input
          id="csv-import"
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          disabled={isImporting}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
        >
          <Upload className="mr-2 h-4 w-4" />
          {isImporting ? "Importing..." : "Import CSV"}
        </Button>
        <span className="text-xs text-muted-foreground">
          Format: Category,Description,Amount or Description,Amount
        </span>
      </div>
    </div>
  );
}

