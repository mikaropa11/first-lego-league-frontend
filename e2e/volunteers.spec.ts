import { APIRequestContext, expect, test } from "@playwright/test";
import { createEditionViaApi, getApiBaseUrl, hasAdminTestUser } from "./utils/api";
import { loginViaUi } from "./utils/auth";
import { createTestEdition } from "./utils/test-data";

function getAdminUser() {
    return {
        username: process.env.E2E_ADMIN_USERNAME ?? "",
        password: process.env.E2E_ADMIN_PASSWORD ?? "",
        email: `${process.env.E2E_ADMIN_USERNAME ?? "admin"}@sample.app`,
    };
}

function getBasicAuthHeader() {
    const adminUser = getAdminUser();
    return `Basic ${Buffer.from(`${adminUser.username}:${adminUser.password}`).toString("base64")}`;
}

async function createJudgeViaApi(
    request: APIRequestContext,
    judge: Readonly<{
        name: string;
        emailAddress: string;
        phoneNumber: string;
        edition: string;
        expert: boolean;
    }>
) {
    const response = await request.post(`${getApiBaseUrl()}/judges`, {
        headers: {
            Accept: "application/hal+json",
            "Content-Type": "application/json",
            Authorization: getBasicAuthHeader(),
        },
        data: judge,
    });

    expect(response.status(), await response.text()).toBe(201);
}

test("volunteers page renders redesigned summaries and either lanes or the empty state", async ({ page }) => {
    await page.goto("/volunteers");

    await expect(page.getByRole("heading", { name: "Volunteers", level: 1 })).toBeVisible();
    await expect(page.locator(".volunteers-page-summary-card")).toHaveCount(4);
    await expect(page.getByText("Total roster", { exact: true })).toBeVisible();
    await expect(page.getByText("Judges", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Referees", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Floaters", { exact: true }).first()).toBeVisible();

    const emptyState = page.getByText("No volunteers found");
    const volunteerLane = page.locator(".volunteers-page-section").first();

    await expect(emptyState.or(volunteerLane)).toBeVisible();
});

test.describe("volunteer creation", () => {
    test("an admin can create a volunteer from the redesigned list and open its detail page", async ({ page, request }) => {
        test.skip(!hasAdminTestUser(), "Admin credentials not configured");

        const editionUri = await createEditionViaApi(request, createTestEdition());
        const uniqueSuffix = `${Date.now()}`;
        const volunteerName = `E2E Volunteer ${uniqueSuffix}`;
        const volunteerEmail = `volunteer-${uniqueSuffix}@example.com`;

        await loginViaUi(page, getAdminUser());
        await page.goto("/volunteers");

        const createLink = page.getByRole("link", { name: "New volunteer", exact: true });
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

        const judgesSection = page.locator("section#judges");
        await expect(judgesSection.getByRole("heading", { name: "Judges", level: 2 })).toBeVisible();

        await judgesSection.getByLabel("Search judges").fill(volunteerName);

        const volunteerCard = judgesSection.locator("article", { hasText: volunteerName }).first();

        await expect(
            volunteerCard.getByRole("heading", { name: volunteerName, level: 3 })
        ).toBeVisible();
        await expect(volunteerCard.getByText(volunteerEmail, { exact: true })).toBeVisible();

        await volunteerCard.getByRole("link", { name: "View volunteer" }).click();

        await expect(page).toHaveURL(/\/volunteers\/.+/);
        await expect(page.getByRole("heading", { name: volunteerName, level: 1 })).toBeVisible();
        await expect(page.getByText("Role:")).toBeVisible();
        await expect(page.getByText("Judge", { exact: true }).first()).toBeVisible();
    });
});

test("judges search keeps redesigned pagination working", async ({ page, request }) => {
    test.skip(!hasAdminTestUser(), "Admin credentials not configured");

    const editionUri = await createEditionViaApi(request, createTestEdition());
    const uniquePrefix = `E2E Judge Batch ${Date.now()}`;
    const judgeNames = Array.from({ length: 7 }, (_, index) => `${uniquePrefix} ${index + 1}`);

    await Promise.all(
        judgeNames.map((name, index) =>
            createJudgeViaApi(request, {
                name,
                emailAddress: `judge-${Date.now()}-${index}@example.com`,
                phoneNumber: `6001234${String(index).padStart(2, "0")}`,
                edition: editionUri,
                expert: index % 2 === 0,
            })
        )
    );

    await page.goto("/volunteers");

    const judgesSection = page.locator("section#judges");
    await judgesSection.getByLabel("Search judges").fill(uniquePrefix);

    await expect(judgesSection.locator(".volunteers-page-pagination")).toBeVisible();
    await expect(judgesSection.locator(".volunteers-page-section__results")).toContainText(
        "Showing 1-6 of 7 matching judges"
    );
    await expect(judgesSection.locator(".volunteers-page-pagination__summary")).toContainText("of 2");
    await expect(
        judgesSection.getByRole("heading", { name: judgeNames[0], level: 3 })
    ).toBeVisible();
    await expect(
        judgesSection.getByRole("heading", { name: judgeNames[5], level: 3 })
    ).toBeVisible();
    await expect(
        judgesSection.getByRole("heading", { name: judgeNames[6], level: 3 })
    ).toHaveCount(0);

    await judgesSection.getByRole("button", { name: "Next page for judges" }).click();

    await expect(judgesSection.locator(".volunteers-page-pagination__helper")).toContainText(
        "Showing 7-7 of 7 judges."
    );
    await expect(
        judgesSection.getByRole("heading", { name: judgeNames[6], level: 3 })
    ).toBeVisible();
    await expect(
        judgesSection.getByRole("heading", { name: judgeNames[0], level: 3 })
    ).toHaveCount(0);
});
