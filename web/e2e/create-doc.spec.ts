import { test, expect } from "@playwright/test";

/**
 * Create-doc smoke requires NEXT_PUBLIC_E2E_ADDRESS at build time
 * so WalletProvider skips Freighter.
 */
test("create doc opens workspace", async ({ page }) => {
  test.skip(
    !process.env.NEXT_PUBLIC_E2E_ADDRESS && !process.env.CI,
    "Set NEXT_PUBLIC_E2E_ADDRESS for create-doc smoke",
  );

  await page.goto("/vault");
  // If gate still shows, e2e address was not baked into the build
  const gate = page.getByTestId("vault-gate");
  if (await gate.isVisible().catch(() => false)) {
    test.skip(true, "Build missing NEXT_PUBLIC_E2E_ADDRESS");
  }

  await expect(page.getByRole("heading", { name: "Vault" })).toBeVisible();
  await page.getByTestId("new-plan").click();
  await expect(page).toHaveURL(/\/vault\/doc-/);
  await expect(page.getByRole("strong", { name: "Mindmap" })).toBeVisible();
});
