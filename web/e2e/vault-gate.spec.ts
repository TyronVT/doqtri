import { test, expect } from "@playwright/test";

test("vault gate when logged out", async ({ page }) => {
  await page.goto("/vault");
  await expect(page.getByTestId("vault-gate")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Log in with Freighter/i }),
  ).toBeVisible();
});
