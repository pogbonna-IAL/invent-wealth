"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Info } from "lucide-react";

export function HowWeCalculateModal() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Info className="mr-2 h-4 w-4" />
          How We Calculate
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>How We Calculate Your Distributions</DialogTitle>
          <DialogDescription>
            Understanding how rental income is distributed to investors
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          <div>
            <h3 className="font-semibold mb-2">Step 1: Calculate Net Distributable Income</h3>
            <p className="text-sm text-muted-foreground mb-2">
              For each rental period, we calculate the net distributable income:
            </p>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm">
              <div className="mb-2">
                <span className="text-muted-foreground">Gross Revenue</span>
                <span className="float-right font-semibold">$X,XXX</span>
              </div>
              <div className="mb-2">
                <span className="text-muted-foreground">- Operating Costs</span>
                <span className="float-right font-semibold text-red-600">-$XXX</span>
              </div>
              <div className="mb-2">
                <span className="text-muted-foreground">- Management Fee</span>
                <span className="float-right font-semibold text-red-600">-$XXX</span>
              </div>
              <div className="pt-2 border-t">
                <span className="font-semibold">= Net Distributable Income</span>
                <span className="float-right font-bold text-green-600">$X,XXX</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Step 2: Calculate Total Outstanding Shares</h3>
            <p className="text-sm text-muted-foreground mb-2">
              We determine how many shares have been purchased:
            </p>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm">
              <div>
                <span className="text-muted-foreground">Total Outstanding Shares</span>
                <span className="float-right font-semibold">= Total Shares - Available Shares</span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                (or sum of all confirmed investments)
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Step 3: Calculate Your Payout</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Your payout is calculated proportionally based on your share ownership:
            </p>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm">
              <div className="mb-2">
                <span className="text-muted-foreground">Your Payout</span>
                <span className="float-right font-semibold">
                  = (Your Shares ÷ Total Outstanding Shares) × Net Distributable Income
                </span>
              </div>
            </div>
            <div className="mt-4 p-4 bg-primary/5 rounded-lg">
              <p className="text-sm font-semibold mb-2">Example:</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Property has 100,000 total shares</li>
                <li>• 80,000 shares have been purchased (20,000 available)</li>
                <li>• Net distributable income: $10,000</li>
                <li>• You own 5,000 shares</li>
                <li>• Your payout: (5,000 ÷ 80,000) × $10,000 = $625</li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Important Notes</h3>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>
                • <strong>Operating Costs:</strong> Include property maintenance, utilities, insurance, and other operational expenses.
              </li>
              <li>
                • <strong>Management Fee:</strong> A percentage fee for property management services (typically 10-15% of gross revenue).
              </li>
              <li>
                • <strong>Distribution Timing:</strong> Distributions are declared monthly based on rental statements and paid out to investors.
              </li>
              <li>
                • <strong>Share Ownership:</strong> Your payout is based on shares owned at the time of the rental period, not when you purchased them.
              </li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

