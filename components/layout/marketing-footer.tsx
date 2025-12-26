import Link from "next/link";
import { Mail } from "lucide-react";

export function MarketingFooter() {
  return (
    <footer
      className="border-t bg-muted/50"
      role="contentinfo"
      aria-label="Site footer"
    >
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div>
            <h3 className="mb-4 font-semibold text-lg">InventWealth</h3>
            <p className="text-sm text-muted-foreground">
              Fractional property ownership made simple. Invest in premium
              properties and earn passive income.
            </p>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="mb-4 font-semibold">Platform</h4>
            <ul className="space-y-2 text-sm" role="list">
              <li>
                <Link
                  href="/properties"
                  className="text-muted-foreground hover:text-[#253E8D] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                >
                  Properties
                </Link>
              </li>
              <li>
                <Link
                  href="/how-it-works"
                  className="text-muted-foreground hover:text-[#253E8D] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="/fees"
                  className="text-muted-foreground hover:text-[#253E8D] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                >
                  Fees
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-muted-foreground hover:text-[#253E8D] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="mb-4 font-semibold">Company</h4>
            <ul className="space-y-2 text-sm" role="list">
              <li>
                <Link
                  href="/about"
                  className="text-muted-foreground hover:text-[#253E8D] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-muted-foreground hover:text-[#253E8D] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/terms"
                  className="text-muted-foreground hover:text-[#253E8D] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/privacy"
                  className="text-muted-foreground hover:text-[#253E8D] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4 font-semibold">Contact</h4>
            <a
              href="mailto:support@inventwealth.com"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-[#253E8D] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
              aria-label="Send email to support"
            >
              <Mail className="h-4 w-4" />
              support@inventwealth.com
            </a>
          </div>
        </div>

        {/* Risk Disclaimer */}
        <div className="mt-8 border-t pt-8">
          <p className="text-xs text-muted-foreground max-w-3xl">
            <strong className="font-semibold">Risk Disclaimer:</strong>{" "}
            Investing in fractional property ownership carries inherent risks.
            Property values can fluctuate, rental income may vary, and there are
            no guarantees of returns. Past performance does not guarantee future
            results. Please invest only what you can afford to lose and consider
            seeking advice from a qualified financial advisor. All investments are
            subject to market risks.
          </p>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Invent Alliance Limited. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

