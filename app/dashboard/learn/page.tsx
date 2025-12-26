import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LearnPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Learn</h2>
        <p className="text-muted-foreground">
          Understand fractional property ownership and how it works
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>What is Fractional Ownership?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Fractional ownership allows multiple investors to own shares in a
              property. Instead of buying an entire property, you purchase shares
              and become a partial owner. This makes real estate investment
              accessible with lower capital requirements.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How Do Distributions Work?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Properties generate income through shortlet rentals. After
              deducting operating costs and management fees, the net income is
              distributed to shareholders proportionally based on their share
              ownership. Distributions are typically made monthly.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What Are the Risks?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Like any investment, fractional property ownership carries risks.
              Property values can fluctuate, rental income may vary, and there
              are no guarantees of returns. It's important to diversify your
              investments and only invest what you can afford to lose.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How Do I Get Started?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Getting started is simple. Browse available properties, review
              their details and investment terms, then purchase shares. You can
              start with as little as the minimum investment amount specified
              for each property.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

