import { expect, test } from "@playwright/test";
import { createTeamViaApi, hasAdminTestUser } from "./utils/api";
import { loginViaUi } from "./utils/auth";
import { createTestTeam } from "./utils/test-data";

function formatTeamCategory(category: string) {
    return category
        .toLowerCase()
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

function getAdminUser() {
    return {
        username: process.env.E2E_ADMIN_USERNAME ?? "",
        password: process.env.E2E_ADMIN_PASSWORD ?? "",
        email: `${process.env.E2E_ADMIN_USERNAME ?? "admin"}@sample.app`,
    };
}

test("teams page renders a created team in the roster", async ({ page, request }) => {
    const canCreateTeam = hasAdminTestUser();
    const team = canCreateTeam ? createTestTeam() : null;

    if (team) {
        await createTeamViaApi(request, team);
    }

    await page.goto("/teams");

    await expect(page.getByRole("heading", { name: "Teams", level: 1 })).toBeVisible();

    if (!team) {
        const emptyState = page.getByText("No teams found");
        const teamCards = page.locator(".teams-page-grid > li");

        await expect(emptyState.or(teamCards.first())).toBeVisible();
        return;
    }

    const createdTeamCard = page.locator("article", { hasText: team.name }).first();

    await expect(createdTeamCard.getByRole("heading", { name: team.name, level: 3 })).toBeVisible();
    await expect(createdTeamCard.getByText(team.city, { exact: true })).toBeVisible();
    await expect(createdTeamCard.getByText(formatTeamCategory(team.category), { exact: true })).toBeVisible();
    await expect(createdTeamCard.getByText(`${team.foundationYear}`, { exact: true })).toBeVisible();
    await expect(createdTeamCard.getByText(team.educationalCenter, { exact: true })).toBeVisible();
});

test.describe("team create access", () => {
    test("an admin can access the create team page from the teams list", async ({ page }) => {
        test.skip(!hasAdminTestUser(), "Admin credentials not configured");

        await loginViaUi(page, getAdminUser());
        await page.goto("/teams");

        const createLink = page.getByRole("link", { name: "Create new team" });
        await expect(createLink).toBeVisible();
        await createLink.click();

        await expect(page).toHaveURL(/\/teams\/new$/);
        await expect(page.getByRole("heading", { name: "New Team", level: 1 })).toBeVisible();
    });

    test("public users cannot access the create team page", async ({ page }) => {
        await page.goto("/teams");

        await expect(page.getByRole("link", { name: "Create new team" })).toHaveCount(0);

        await page.goto("/teams/new");
        await expect(page).toHaveURL(/\/login$/);
    });
});

test("the team creation form surfaces the missing member t-shirt size validation", async ({ page }) => {
    test.skip(!hasAdminTestUser(), "Admin credentials not configured");

    const uniqueSuffix = `${Date.now()}`;
    const teamName = `UI Team ${uniqueSuffix}`;
    const coachEmail = `coach-${uniqueSuffix}@example.com`;

    await loginViaUi(page, getAdminUser());
    await page.goto("/teams/new");

    await page.getByLabel("Team name").fill(teamName);
    await page.getByLabel("Category").selectOption("CHALLENGE");
    await page.getByLabel("Educational center").fill("UI Test School");
    await page.getByLabel("Location").fill("Igualada");
    await page.getByLabel("Inscription date").fill(new Date().toISOString().slice(0, 10));
    await page.getByLabel("Foundation year").fill("2020");

    await page.locator("#member-name-0").fill("Alex Member");
    await page.locator("#member-age-0").fill("11");
    await page.locator("#member-gender-0").selectOption("MALE");

    await page.locator("#coach-name-0").fill("Coach Rivera");
    await page.locator("#coach-email-0").fill(coachEmail);
    await page.locator("#coach-phone-0").fill("600123123");

    await page.getByRole("button", { name: "Create team" }).click();

    await expect(page).toHaveURL(/\/teams\/new$/);
    await expect(page.getByRole("alert")).toContainText("Member 1 t-shirt size is required.");
    await expect(page.getByLabel("Team name")).toHaveValue(teamName);
});
