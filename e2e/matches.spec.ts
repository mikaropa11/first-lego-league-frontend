import { expect, test } from "@playwright/test";
import { hasAdminTestUser } from "./utils/api";
import { loginViaUi } from "./utils/auth";

function getAdminUser() {
    return {
        username: process.env.E2E_ADMIN_USERNAME ?? "",
        password: process.env.E2E_ADMIN_PASSWORD ?? "",
        email: `${process.env.E2E_ADMIN_USERNAME ?? "admin"}@sample.app`,
    };
}

test.describe("matches create access", () => {
    test("an admin can access the create match page from the matches list", async ({ page }) => {
        test.skip(!hasAdminTestUser(), "Admin credentials not configured");

        await loginViaUi(page, getAdminUser());
        await page.goto("/matches");

        await expect(page.getByRole("heading", { name: "Matches", level: 1 })).toBeVisible();

        const createLink = page.getByRole("link", { name: /^New match$/i });
        await expect(createLink).toBeVisible();
        await createLink.click();

        await expect(page).toHaveURL(/\/matches\/new$/);
        await expect(page.getByRole("heading", { name: "New Match", level: 1 })).toBeVisible();
    });

    test("public users cannot access the create match page", async ({ page }) => {
        await page.goto("/matches");

        await expect(page.getByRole("heading", { name: "Matches", level: 1 })).toBeVisible();
        await expect(page.getByRole("link", { name: /^New match$/i })).toHaveCount(0);

        await page.goto("/matches/new");
        await expect(page).toHaveURL(/\/login$/);
    });
});
