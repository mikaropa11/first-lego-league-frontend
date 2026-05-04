import { expect, test } from "@playwright/test";
import { ScientificProjectsService } from "../src/api/scientificProjectApi";
import { createUserViaApi } from "./utils/api";
import { loginViaUi } from "./utils/auth";
import { createTestUser } from "./utils/test-data";

test("scientific projects page renders published content or the empty state", async ({ page }) => {
    await page.goto("/scientific-projects");

    await expect(page.getByRole("heading", { name: "Scientific Projects", level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Season projects overview", level: 2 })).toBeVisible();

    const emptyState = page.getByText("No scientific projects found");
    const projectCards = page.locator("tbody > tr");

    await expect(emptyState.or(projectCards.first())).toBeVisible();
});

test("scientific projects can be searched by team name from the URL", async ({ page }) => {
    const teamName = `no-project-team-${Date.now()}`;

    await page.goto("/scientific-projects?year=2099");
    await page.getByRole("searchbox", { name: "Search scientific projects by team name" }).fill(teamName);
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page).toHaveURL(new RegExp(`/scientific-projects\\?year=2099&teamName=${teamName}$`));
    await expect(page.getByText(`No scientific projects match "${teamName}".`)).toBeVisible();

    await page.getByRole("button", { name: "Clear" }).click();

    await expect(page).toHaveURL(/\/scientific-projects\?year=2099$/);
});

test("scientific project team-name search falls back to partial team id matches", async () => {
    const originalFetch = globalThis.fetch;
    const jsonResponse = (body: unknown) =>
        new Response(JSON.stringify(body), {
            status: 200,
            headers: { "content-type": "application/hal+json" },
        });

    globalThis.fetch = (async (input: RequestInfo | URL) => {
        const url = input.toString();

        if (url.endsWith("/scientificProjects/search/findByTeamName?teamName=Alpha")) {
            return jsonResponse({
                _embedded: { scientificProjects: [] },
                _links: { self: { href: url } },
            });
        }

        if (url.endsWith("/scientificProjects?size=1000")) {
            return jsonResponse({
                _embedded: {
                    scientificProjects: [
                        {
                            uri: "/scientificProjects/1",
                            comments: "Renewable energy in the context of the FLL",
                            score: 8,
                            _links: {
                                self: { href: "https://api.firstlegoleague.win/scientificProjects/1" },
                                team: { href: "https://api.firstlegoleague.win/scientificProjects/1/team" },
                            },
                        },
                    ],
                },
                _links: { self: { href: url } },
            });
        }

        if (url === "https://api.firstlegoleague.win/scientificProjects/1/team") {
            return jsonResponse({
                uri: "/teams/Test Team Alpha",
                id: "Test Team Alpha",
                _links: {
                    self: { href: "https://api.firstlegoleague.win/teams/Test%20Team%20Alpha" },
                },
            });
        }

        throw new Error(`Unexpected fetch: ${url}`);
    }) as typeof fetch;

    try {
        const service = new ScientificProjectsService({ getAuth: async () => null });
        const projects = await service.searchScientificProjectsByTeamName("Alpha");

        expect(projects).toHaveLength(1);
        expect(projects[0].comments).toBe("Renewable energy in the context of the FLL");
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test("authenticated users can open the new scientific project form", async ({ page, request }) => {
    const user = createTestUser("scientific-project");

    await createUserViaApi(request, user);
    await loginViaUi(page, user);

    await page.goto("/scientific-projects");
    await expect(page.getByRole("link", { name: "New Project", exact: true })).toBeVisible();

    await page.getByRole("link", { name: "New Project", exact: true }).click();

    await expect(page).toHaveURL(/\/scientific-projects\/new$/);
    await expect(page.getByRole("heading", { name: "New Scientific Project", level: 1 })).toBeVisible();
    await expect(page.getByLabel("Project name")).toBeVisible();
    await expect(page.locator("form").getByLabel("Edition")).toBeVisible();
    await expect(page.getByLabel("Team")).toBeVisible();
});

test("displays room column and correctly renders assigned or unassigned states", async ({ page }) => {
    // Note: ScientificProjectsPage is a Next.js Server Component. 
    // We dynamically verify the existing rows since we cannot intercept the server's fetch.
    await page.goto("/scientific-projects");

    // The Room column header must always be visible
    await expect(page.getByRole("columnheader", { name: "Room" })).toBeVisible();

    const emptyState = page.getByText("No scientific projects found");
    const projectRows = page.locator("tbody > tr");

    if (await emptyState.isVisible()) {
        return; // Nothing further to test if there are no projects
    }

    // Verify the first row correctly handles the room cell rendering (either a link or "—")
    const firstRow = projectRows.first();
    const roomCell = firstRow.locator("td").nth(2);

    const hasDash = await roomCell.getByText("—", { exact: true }).isVisible();
    const hasLink = await roomCell.getByRole("link").isVisible();
    
    expect(hasDash || hasLink).toBeTruthy();

    if (hasLink) {
        const href = await roomCell.getByRole("link").getAttribute("href");
        expect(href).toMatch(/\/project-rooms\/.+/);

        // Test navigation
        await roomCell.getByRole("link").click();
        await expect(page).toHaveURL(/\/project-rooms\/.+/);
    }
});
