import { expect, test } from "@playwright/test";
import { createEditionViaApi, hasAdminTestUser } from "./utils/api";
import { loginViaUi } from "./utils/auth";
import { createTestEdition } from "./utils/test-data";

function getAdminUser() {
    return {
        username: process.env.E2E_ADMIN_USERNAME ?? "",
        password: process.env.E2E_ADMIN_PASSWORD ?? "",
        email: `${process.env.E2E_ADMIN_USERNAME ?? "admin"}@sample.app`,
    };
}

test.describe("volunteer creation", () => {
    test("an admin can create a volunteer from the volunteers list", async ({ page, request }) => {
        test.skip(!hasAdminTestUser(), "Admin credentials not configured");

        const editionUri = await createEditionViaApi(request, createTestEdition());
        const uniqueSuffix = `${Date.now()}`;
        const volunteerName = `E2E Volunteer ${uniqueSuffix}`;
        const volunteerEmail = `volunteer-${uniqueSuffix}@example.com`;

        await loginViaUi(page, getAdminUser());
        await page.goto("/volunteers");

        const createLink = page.getByRole("link", { name: "New Volunteer" });
        await expect(createLink).toBeVisible();
        await createLink.click();

        await expect(page).toHaveURL(/\/volunteers\/new$/);
        await expect(page.getByRole("heading", { name: "New Volunteer", level: 1 })).toBeVisible();

        await page.getByLabel("Name").fill(volunteerName);
        await page.getByLabel("Email address").fill(volunteerEmail);
        await page.getByLabel("Phone number").fill("600123456");
        await page.getByLabel("Edition").selectOption(editionUri);
        await page.getByLabel("Volunteer type").selectOption("Judge");
        await page.getByRole("button", { name: "Create volunteer" }).click();

        await expect(page).toHaveURL(/\/volunteers$/);
        await expect(page.getByText(volunteerName, { exact: true })).toBeVisible();
        await expect(page.getByText(volunteerEmail, { exact: true })).toBeVisible();
    });
});
