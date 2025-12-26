import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-4 font-semibold">InventWealth</h3>
            <p className="text-sm text-muted-foreground">
              Fractional property ownership made simple. Invest in premium
              properties and earn passive income.
            </p>
          </div>
          <div>
            <h4 className="mb-4 font-semibold">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/properties" className="text-muted-foreground hover:text-[#253E8D] transition-colors">
                  Properties
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-muted-foreground hover:text-[#253E8D] transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/learn" className="text-muted-foreground hover:text-[#253E8D] transition-colors">
                  Learn
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-[#253E8D] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-[#253E8D] transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold">Contact</h4>
            <p className="text-sm text-muted-foreground">
              support@inventwealth.com
            </p>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Invent Alliance Limited. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

