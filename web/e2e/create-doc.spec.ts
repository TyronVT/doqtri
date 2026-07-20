import { test, expect } from "@playwright/test";

/**
 * Create-doc smoke requires NEXT_PUBLIC_E2E_ADDRESS at *build* time
 * so WalletProvider skips Freighter (CI sets PLAYWRIGHT_E2E=1).
 */
test("create doc opens workspace", async ({ page }) => {
  test.skip(
    !process.env.PLAYWRIGHT_E2E && !process.env.CI,
    "Set PLAYWRIGHT_E2E=1 after building with NEXT_PUBLIC_E2E_ADDRESS",
  );

  await page.goto("/vault");
  await expect(page.getByRole("heading", { name: "Vault" })).toBeVisible({
    timeout: 15_000,
  });
  await page.getByTestId("new-plan").click();
  await expect(page).toHaveURL(/\/vault\/doc-/);
  await expect(page.getByText("Mindmap")).toBeVisible();
});
