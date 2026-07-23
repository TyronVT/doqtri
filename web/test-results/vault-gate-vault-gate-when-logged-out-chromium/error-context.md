# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: vault-gate.spec.ts >> vault gate when logged out
- Location: e2e/vault-gate.spec.ts:3:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('vault-gate')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByTestId('vault-gate')

```

```yaml
- 'heading "Application error: a client-side exception has occurred while loading 127.0.0.1 (see the browser console for more information)." [level=2]'
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test("vault gate when logged out", async ({ page }) => {
  4  |   await page.goto("/vault");
> 5  |   await expect(page.getByTestId("vault-gate")).toBeVisible();
     |                                                ^ Error: expect(locator).toBeVisible() failed
  6  |   await expect(
  7  |     page.getByRole("button", { name: /Log in with Freighter/i }),
  8  |   ).toBeVisible();
  9  | });
  10 | 
```