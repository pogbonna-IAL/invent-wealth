import { test, expect } from "@playwright/test";

test.describe("Smoke Tests", () => {
  test.describe("Marketing Pages", () => {
    test("homepage loads and renders correctly", async ({ page }) => {
      await page.goto("/");
      await expect(page).toHaveTitle(/InventWealth/);
      
      // Check for key elements
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByRole("link", { name: /properties/i })).toBeVisible();
      
      // Check navigation is visible
      const nav = page.getByRole("navigation");
      await expect(nav).toBeVisible();
    });

    test("properties page loads and shows properties", async ({ page }) => {
      await page.goto("/properties");
      await expect(page.getByRole("heading", { name: /Available Properties|Properties/i })).toBeVisible();
      
      // Check page loaded without errors
      await expect(page.locator("body")).toBeVisible();
    });

    test("how-it-works page loads", async ({ page }) => {
      await page.goto("/how-it-works");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page).toHaveTitle(/InventWealth/);
    });

    test("fees page loads", async ({ page }) => {
      await page.goto("/fees");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page).toHaveTitle(/InventWealth/);
    });

    test("faq page loads", async ({ page }) => {
      await page.goto("/faq");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page).toHaveTitle(/InventWealth/);
    });

    test("about page loads", async ({ page }) => {
      await page.goto("/about");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });

    test("contact page loads", async ({ page }) => {
      await page.goto("/contact");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  });

  test.describe("Authentication Flow", () => {
    test("sign in page loads", async ({ page }) => {
      await page.goto("/auth/signin");
      await expect(page.getByRole("heading", { name: /Sign In/i })).toBeVisible();
      
      // Check for email input
      const emailInput = page.getByLabel(/email/i);
      await expect(emailInput).toBeVisible();
    });

    test("dashboard requires authentication", async ({ page }) => {
      await page.goto("/dashboard");
      // Should redirect to sign in
      await expect(page).toHaveURL(/.*signin/);
    });

    test("dev login flow works", async ({ page }) => {
      // Skip if dev credentials not enabled
      test.skip(
        process.env.NEXT_PUBLIC_ENABLE_DEV_CREDENTIALS !== "true",
        "Dev credentials not enabled"
      );

      await page.goto("/auth/signin");
      
      // Switch to dev login tab if available
      const devTab = page.getByRole("tab", { name: /dev|credentials/i });
      if (await devTab.isVisible()) {
        await devTab.click();
      }

      // Fill in dev credentials
      const emailInput = page.getByLabel(/email/i);
      const passwordInput = page.getByLabel(/password/i);
      
      if (await emailInput.isVisible() && await passwordInput.isVisible()) {
        await emailInput.fill("test@example.com");
        await passwordInput.fill("password");
        
        // Submit form
        const submitButton = page.getByRole("button", { name: /sign in|login/i });
        await submitButton.click();
        
        // Should redirect to dashboard
        await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
      }
    });
  });

  test.describe("Dashboard Overview", () => {
    test("dashboard overview shows for authenticated user", async ({ page }) => {
      // Skip if dev credentials not enabled
      test.skip(
        process.env.NEXT_PUBLIC_ENABLE_DEV_CREDENTIALS !== "true",
        "Dev credentials not enabled"
      );

      // First, sign in
      await page.goto("/auth/signin");
      
      const devTab = page.getByRole("tab", { name: /dev|credentials/i });
      if (await devTab.isVisible()) {
        await devTab.click();
      }

      const emailInput = page.getByLabel(/email/i);
      const passwordInput = page.getByLabel(/password/i);
      
      if (await emailInput.isVisible() && await passwordInput.isVisible()) {
        await emailInput.fill("demo@inventwealth.com");
        await passwordInput.fill("password");
        
        const submitButton = page.getByRole("button", { name: /sign in|login/i });
        await submitButton.click();
        
        // Wait for redirect
        await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
        
        // Check for dashboard elements
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        
        // Check for navigation
        const nav = page.getByRole("navigation");
        await expect(nav).toBeVisible();
        
        // Check that page loaded without errors
        await expect(page.locator("body")).toBeVisible();
        
        // Check for dashboard sections (may be empty but should exist)
        const mainContent = page.locator("main, [role='main']");
        await expect(mainContent.first()).toBeVisible();
      }
    });

    test("dashboard redirects unauthenticated users", async ({ page }) => {
      await page.goto("/dashboard");
      // Should redirect to sign in
      await expect(page).toHaveURL(/.*signin/);
    });
  });

  test.describe("Error Handling", () => {
    test("404 page shows for non-existent routes", async ({ page }) => {
      await page.goto("/non-existent-page-12345");
      // Should show 404 or redirect to home
      const heading = page.getByRole("heading", { name: /404|not found/i });
      const homeLink = page.getByRole("link", { name: /home|go home/i });
      
      // Either 404 page or redirect
      if (await heading.isVisible().catch(() => false)) {
        await expect(heading).toBeVisible();
      } else {
        // Might redirect to home
        await expect(page).toHaveURL("/");
      }
    });
  });
});

