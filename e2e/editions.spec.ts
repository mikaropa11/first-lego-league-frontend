import { expect, test } from "@playwright/test";

test("editions page renders the current archive page and links to an edition detail page", async ({ page }) => {
    await page.goto("/editions");

    await expect(page.getByRole("heading", { name: "Editions", level: 1 })).toBeVisible();
    await expect(
        page.getByText("Search by year, venue or state", { exact: true }),
    ).toBeVisible();
    await expect(
        page.getByRole("searchbox", { name: "Search editions by year, venue or state" }),
    ).toBeVisible();

    const emptyState = page.getByText("No editions found");
    const editionCards = page.locator(".editions-page-grid > li");
    const firstEditionLink = page.locator('.editions-page-grid a[href^="/editions/"]').first();

    await expect(emptyState.or(editionCards.first())).toBeVisible();

    if (await emptyState.isVisible()) {
        return;
    }

    expect(await editionCards.count()).toBeLessThanOrEqual(6);

    const paginationSummary = page.locator(".pagination-controls__page-number");

    if (await paginationSummary.count()) {
        await expect(paginationSummary).toHaveText("1");

        const nextPageLink = page.getByRole("link", { name: "Next" });

        await expect(nextPageLink).toBeVisible();
        await nextPageLink.click();

        await expect(page).toHaveURL(/\/editions\?page=2$/);
        await expect(paginationSummary).toHaveText("2");
        await expect(editionCards.first()).toBeVisible();
    }

    await firstEditionLink.click();

    await expect(page).toHaveURL(/\/editions\/.+$/);
    await expect(page.getByRole("heading", { name: "Participating Teams", level: 2 })).toBeVisible();
});

test("editions page can be filtered from the search box", async ({ page }) => {
    const searchQuery = `edition-${Date.now()}`;

    await page.goto("/editions");

    const searchBox = page.getByRole("searchbox", {
        name: "Search editions by year, venue or state",
    });

    await expect(searchBox).toBeVisible();
    await searchBox.fill(searchQuery);

    await expect(
        page.getByText(
            `No editions match "${searchQuery}". Try a different year, venue or state.`,
        ),
    ).toBeVisible();
});
