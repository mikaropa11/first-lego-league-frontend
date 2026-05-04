export type TestUser = {
    username: string;
    email: string;
    password: string;
};

export type TestTeam = {
    name: string;
    city: string;
    category: string;
    foundationYear: number;
    educationalCenter: string;
};

export type TestEdition = {
    year: number;
    venueName: string;
    description: string;
};

export type TestMedia = {
    url: string;
    type: string;
};

function randomSuffix() {
    return `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
}

function createPassword() {
    return crypto.randomUUID();
}

export function createTestUser(prefix = "e2e-user"): TestUser {
    const username = `${prefix}-${randomSuffix()}`;

    return {
        username,
        email: `${username}@example.com`,
        password: createPassword(),
    };
}

export function createTestTeam(prefix = "E2E Team"): TestTeam {
    return {
        name: `${prefix} ${randomSuffix()}`,
        city: "Igualada",
        category: "CHALLENGE",
        foundationYear: new Date().getUTCFullYear(),
        educationalCenter: "E2E Test School",
    };
}

export function createTestEdition(): TestEdition {
    return {
        year: 2200 + Math.floor(Math.random() * 7000),
        venueName: `E2E Venue ${randomSuffix()}`,
        description: "Edition created by Playwright media tests.",
    };
}

export function createTestMedia(prefix = "e2e-media"): TestMedia {
    return {
        url: `https://example.com/${prefix}-${randomSuffix()}.jpg`,
        type: "image/jpeg",
    };
}
