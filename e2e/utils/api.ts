import { APIRequestContext, expect } from "@playwright/test";
import { TestEdition, TestMedia, TestTeam, TestUser } from "./test-data";

type BasicAuthCredentials = Pick<TestUser, "username" | "password">;
const ALLOWED_WRITE_HOSTS = new Set(["localhost", "127.0.0.1", "api.firstlegoleague.win"]);

function trimTrailingSlashes(value: string) {
    let end = value.length;

    while (end > 0 && value.codePointAt(end - 1) === 47) {
        end -= 1;
    }

    return value.slice(0, end);
}

export function getApiBaseUrl() {
    const baseUrl = process.env.E2E_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;

    if (!baseUrl) {
        throw new Error("E2E_API_BASE_URL or NEXT_PUBLIC_API_BASE_URL must be set for Playwright API helpers.");
    }

    return trimTrailingSlashes(baseUrl);
}

function getAdminTestUser(): BasicAuthCredentials {
    const username = process.env.E2E_ADMIN_USERNAME;
    const password = process.env.E2E_ADMIN_PASSWORD;

    if (!username || !password) {
        throw new Error("E2E_ADMIN_USERNAME and E2E_ADMIN_PASSWORD must be set for E2E API write helpers.");
    }

    return { username, password };
}

export function hasAdminTestUser() {
    return Boolean(process.env.E2E_ADMIN_USERNAME && process.env.E2E_ADMIN_PASSWORD);
}

function assertSafeWriteTarget(baseUrl: string) {
    const hostname = new URL(baseUrl).hostname;
    const allowRemoteWrites = process.env.E2E_ALLOW_REMOTE_WRITES === "true";

    if (!ALLOWED_WRITE_HOSTS.has(hostname)) {
        throw new Error(`Refusing to run E2E write helpers against unapproved host: ${hostname}.`);
    }

    if (!allowRemoteWrites) {
        throw new Error("E2E_ALLOW_REMOTE_WRITES must be set to true before running E2E write helpers.");
    }
}

function getBasicAuthHeader(user: BasicAuthCredentials) {
    const token = Buffer.from(`${user.username}:${user.password}`).toString("base64");
    return `Basic ${token}`;
}

export async function createUserViaApi(request: APIRequestContext, user: TestUser) {
    const baseUrl = getApiBaseUrl();
    assertSafeWriteTarget(baseUrl);
    const response = await request.post(`${baseUrl}/users`, {
        headers: {
            Accept: "application/hal+json",
            "Content-Type": "application/json",
        },
        data: {
            id: user.username,
            email: user.email,
            password: user.password,
        },
    });

    expect(response.status(), await response.text()).toBe(201);
}

export async function createAdministratorViaApi(
    request: APIRequestContext,
    admin: TestUser
) {
    const baseUrl = getApiBaseUrl();
    const adminUser = getAdminTestUser();
    assertSafeWriteTarget(baseUrl);

    const response = await request.post(`${baseUrl}/administrators`, {
        headers: {
            Accept: "application/hal+json",
            "Content-Type": "application/json",
            Authorization: getBasicAuthHeader(adminUser),
        },
        data: {
            id: admin.username,
            email: admin.email,
            password: admin.password,
        },
    });

    expect(response.status(), await response.text()).toBe(201);
}

export async function createTeamViaApi(
    request: APIRequestContext,
    team: TestTeam
) {
    const baseUrl = getApiBaseUrl();
    const adminUser = getAdminTestUser();

    assertSafeWriteTarget(baseUrl);
    const response = await request.post(`${baseUrl}/teams`, {
        headers: {
            Accept: "application/hal+json",
            "Content-Type": "application/json",
            Authorization: getBasicAuthHeader(adminUser),
        },
        data: {
            name: team.name,
            city: team.city,
            category: team.category,
            foundationYear: team.foundationYear,
            educationalCenter: team.educationalCenter,
        },
    });

    expect(response.status(), await response.text()).toBe(201);
}

export async function createEditionViaApi(
    request: APIRequestContext,
    edition: TestEdition
) {
    const baseUrl = getApiBaseUrl();
    const adminUser = getAdminTestUser();

    assertSafeWriteTarget(baseUrl);
    const response = await request.post(`${baseUrl}/editions`, {
        headers: {
            Accept: "application/hal+json",
            "Content-Type": "application/json",
            Authorization: getBasicAuthHeader(adminUser),
        },
        data: edition,
    });

    expect(response.status(), await response.text()).toBe(201);

    const body = await response.json();
    const selfHref = body._links?.self?.href;
    expect(typeof selfHref, JSON.stringify(body)).toBe("string");

    return selfHref as string;
}

export async function createMediaViaApi(
    request: APIRequestContext,
    media: TestMedia,
    editionUri: string
) {
    const baseUrl = getApiBaseUrl();
    const adminUser = getAdminTestUser();

    assertSafeWriteTarget(baseUrl);
    const response = await request.post(`${baseUrl}/mediaContents`, {
        headers: {
            Accept: "application/hal+json",
            "Content-Type": "application/json",
            Authorization: getBasicAuthHeader(adminUser),
        },
        data: {
            url: media.url,
            type: media.type,
            edition: editionUri,
        },
    });

    expect(response.status(), await response.text()).toBe(201);
}
