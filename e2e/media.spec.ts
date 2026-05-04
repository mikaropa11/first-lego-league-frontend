import { expect, test } from "@playwright/test";
import { createEditionViaApi, createMediaViaApi, hasAdminTestUser } from "./utils/api";
import { createTestEdition, createTestMedia } from "./utils/test-data";

function getEditionHref(editionUri: string) {
    const pathname = editionUri.startsWith("http")
        ? new URL(editionUri).pathname
        : editionUri;
    const editionId = pathname.split("/").filter(Boolean).at(-1);

    if (!editionId) {
        throw new Error(`Could not extract edition id from ${editionUri}`);
    }

    return `/editions/${encodeURIComponent(decodeURIComponent(editionId))}`;
}

test("media gallery opens a media detail page and navigates between items", async ({ page, request }) => {
    test.skip(!hasAdminTestUser(), "Admin credentials not configured");

    const editionUri = await createEditionViaApi(request, createTestEdition());
    const firstMedia = createTestMedia("e2e-media-first");
    const secondMedia = createTestMedia("e2e-media-second");

    await createMediaViaApi(request, firstMedia, editionUri);
    await createMediaViaApi(request, secondMedia, editionUri);

    await page.goto(getEditionHref(editionUri));

    await page.getByRole("button", { name: /Media\s+2\s+items/ }).click();
    await page.getByRole("button", { name: "Open media 1" }).click();
    await page.getByRole("link", { name: /View detail/ }).click();

    await expect(page).toHaveURL(new RegExp(`/media\\?url=${encodeURIComponent(firstMedia.url)}`));
    await expect(page.getByRole("heading", { name: "Media not found" })).toBeHidden();
    await expect(page.getByRole("link", { name: /Open original/ })).toHaveAttribute("href", firstMedia.url);

    await page.getByRole("button", { name: "Next media" }).click();
    await expect(page).toHaveURL(new RegExp(`/media\\?url=${encodeURIComponent(secondMedia.url)}`));

    await page.getByRole("button", { name: "Previous media" }).click();
    await expect(page).toHaveURL(new RegExp(`/media\\?url=${encodeURIComponent(firstMedia.url)}`));
});
