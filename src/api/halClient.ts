import {
    ApiError,
    AuthenticationError,
    NetworkError,
    NotFoundError,
    ServerError,
    ValidationError,
    ConflictError,
} from "@/types/errors";
import type { HalPage } from "@/types/pagination";
import halfred, { Resource } from "halfred";

const PROD_API_BASE_URL = "https://api.firstlegoleague.win";
type HalRequestBody = Record<string, unknown> | Resource;

// Env variables starting with NEXT_PUBLIC_ are available to the client.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || PROD_API_BASE_URL;

export function mergeHal<T>(obj: Resource): (T & Resource) {
    return Object.assign(obj, halfred.parse(obj)) as T & Resource;
}

export function mergeHalArray<T>(objs: Resource[]): (T & Resource)[] {
    return objs.map(o => Object.assign(o, halfred.parse(o)) as T & Resource);
}

/**
 * Fetches a HAL collection and returns a merged array of resources
 * @param path - API endpoint path
 * @param authProvider - Authentication strategy
 * @param embeddedKey - Key for embedded array in HAL response
 */
export async function fetchHalCollection<T>(
    path: string,
    authProvider: { getAuth: () => Promise<string | null> },
    embeddedKey: string
): Promise<(T & Resource)[]> {
    const resource = await getHal(path, authProvider);
    const embedded = resource.embeddedArray(embeddedKey) || [];
    return mergeHalArray<T>(embedded);
}

/**
 * Fetches a paginated HAL collection using ?page=N&size=N query parameters.
 * Inspects _links.next and _links.prev to derive hasNext / hasPrev.
 *
 * @param path        - API endpoint path (without query params)
 * @param authProvider - Authentication strategy
 * @param embeddedKey - Key for embedded array in HAL response
 * @param page        - 0-based page index
 * @param size        - Page size
 */
export async function fetchHalPagedCollection<T>(
    path: string,
    authProvider: { getAuth: () => Promise<string | null> },
    embeddedKey: string,
    page: number,
    size: number
): Promise<HalPage<T & Resource>> {
    const sep = path.includes("?") ? "&" : "?";
    const resource = await getHal(`${path}${sep}page=${page}&size=${size}`, authProvider);
    const items = mergeHalArray<T>(resource.embeddedArray(embeddedKey) || []);
    return {
        items,
        hasNext: !!resource.link("next"),
        hasPrev: !!resource.link("prev"),
        currentPage: page,
    };
}

/**
 * Fetches a single HAL resource and returns it merged
 * @param path - API endpoint path
 * @param authProvider - Authentication strategy
 */
export async function fetchHalResource<T>(
    path: string,
    authProvider: { getAuth: () => Promise<string | null> }
): Promise<T & Resource> {
    const resource = await getHal(path, authProvider);
    return mergeHal<T>(resource);
}

/**
 * Creates a HAL resource via POST with null-check
 * @param path - API endpoint path
 * @param data - Resource data to create
 * @param authProvider - Authentication strategy
 * @param resourceName - Name of resource for error messages (lowercase)
 */
export async function createHalResource<T>(
    path: string,
    data: HalRequestBody,
    authProvider: { getAuth: () => Promise<string | null> },
    resourceName: string
): Promise<T & Resource> {
    const resource = await postHal(path, data, authProvider);
    if (!resource) {
        throw new ApiError(
            `Failed to create ${resourceName}: No response from server`,
            500,
            true
        );
    }
    return mergeHal<T>(resource);
}

/**
 * Updates a HAL resource via PUT with null-check
 * @param path - API endpoint path
 * @param data - Resource data to update
 * @param authProvider - Authentication strategy
 * @param resourceName - Name of resource for error messages (lowercase)
 */
export async function updateHalResource<T>(
    path: string,
    data: HalRequestBody,
    authProvider: { getAuth: () => Promise<string | null> },
    resourceName: string
): Promise<T & Resource> {
    const resource = await putHal(path, data, authProvider);
    if (!resource) {
        throw new ApiError(
            `Failed to update ${resourceName}: No response from server`,
            500,
            true
        );
    }
    return mergeHal<T>(resource);
}

/**
 * Safely parses response body as HAL+JSON, returning null for empty responses
 * Handles 204 No Content, empty bodies, and invalid JSON gracefully
 * @param res - HTTP Response object
 * @returns Parsed HAL Resource or null for empty responses
 * @throws ApiError if JSON parsing fails
 */
async function parseResponseBody(res: Response): Promise<Resource | null> {
    // Check for explicit no-content status
    if (res.status === 204) {
        return null;
    }
    
    // Check Content-Length header
    const contentLength = res.headers.get("content-length");
    if (contentLength === "0") {
        return null;
    }
    
    // Clone response to peek at body without consuming it
    const clonedRes = res.clone();
    const text = await clonedRes.text();
    
    // Treat empty or whitespace-only bodies as null
    if (!text || text.trim() === "") {
        return null;
    }
    
    // Parse JSON with explicit SyntaxError handling
    try {
        return halfred.parse(await res.json());
    } catch (error) {
        if (error instanceof SyntaxError) {
            throw new ApiError(
                "Server returned invalid JSON response",
                res.status,
                true,
                error
            );
        }
        throw error;
    }
}

/**
 * Handles fetch errors and HTTP status codes, converting them to specific error types
 */
async function handleApiError(error: unknown, res?: Response): Promise<never> {
    // Handle network errors (fetch failures - API unavailable)
    if (error instanceof TypeError) {
        throw new NetworkError(undefined, error);
    }

    // Handle HTTP status codes
    if (res && !res.ok) {
        const status = res.status;

        // Try to parse error message from response body
        let errorMessage: string | undefined;
        try {
            const contentType = res.headers.get("content-type");
            if (contentType?.toLowerCase().includes("json")) {
                const errorBody = await res.json();
                errorMessage = errorBody.message || errorBody.error || errorBody.detail;
            }
        } catch {
            // Ignore JSON parsing errors, use default messages
        }

        // Map status codes to specific error types
        switch (status) {
            case 404:
                throw new NotFoundError(errorMessage, error);
            case 401:
            case 403:
                throw new AuthenticationError(errorMessage, status, error);
            case 400:
                throw new ValidationError(errorMessage, error);
            case 409:
                throw new ConflictError(errorMessage, error);
            case 500:
            case 502:
            case 503:
            case 504:
                throw new ServerError(errorMessage, status, error);
            default:
                throw new ApiError(
                    errorMessage || "An error occurred. Please try again.",
                    status,
                    true,
                    error
                );
        }
    }

    // Fallback for unknown errors
    throw new ApiError("An unexpected error occurred. Please try again.", undefined, true, error);
}

/**
 * Executes a HAL HTTP request with common error handling
 * @param config - Request configuration
 * @returns Resource or null for 204 responses
 */
async function executeHalRequest(config: {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    path: string;
    authProvider: { getAuth: () => Promise<string | null> };
    body?: HalRequestBody;
}): Promise<Resource | null> {
    let path = config.path;
    
    if (path.startsWith("http")) {
        try {
            const url = new URL(path);
            const baseUrl = new URL(API_BASE_URL);
            if (url.hostname === baseUrl.hostname) {
                path = url.pathname + url.search;
            }
        } catch (e) {
            // If URL parsing fails, fallback to original path
        }
    }

    const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
    const authorization = await config.authProvider.getAuth();
    
    const headers: HeadersInit = {
        "Accept": "application/hal+json",
        ...(authorization ? { Authorization: authorization } : {}),
    };
    
    // Add Content-Type for methods with body
    if (config.body) {
        headers["Content-Type"] = "application/json";
    }
    
    try {
        const res = await fetch(url, {
            method: config.method,
            headers,
            ...(config.body ? { body: JSON.stringify(config.body) } : {}),
            cache: "no-store",
        });
        
        if (!res.ok) {
            await handleApiError(new Error(`HTTP ${res.status}`), res);
            throw new Error("Unreachable");
        }
        
        // GET returns parsed Resource directly, others may return null (204)
        if (config.method === 'GET') {
            // Use parseResponseBody for consistent empty body handling
            const resource = await parseResponseBody(res);
            if (!resource) {
                throw new ApiError(
                    "GET request returned empty response",
                    res.status,
                    true
                );
            }
            return resource;
        }
        
        return await parseResponseBody(res);
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        await handleApiError(error);
        throw new Error("Unreachable");
    }
}

export async function getHal(path: string, authProvider: { getAuth: () => Promise<string | null> }): Promise<Resource> {
    return await executeHalRequest({ 
        method: 'GET', 
        path, 
        authProvider 
    }) as Resource;
}

export async function putHal(path: string, body: HalRequestBody, authProvider: { getAuth: () => Promise<string | null> }): Promise<Resource | null> {
    return await executeHalRequest({ 
        method: 'PUT', 
        path, 
        authProvider, 
        body 
    });
}

export async function deleteHal(path: string, authProvider: { getAuth: () => Promise<string | null> }): Promise<Resource | null> {
    return await executeHalRequest({ 
        method: 'DELETE', 
        path, 
        authProvider 
    });
}

export async function postHal(path: string, body: HalRequestBody, authProvider: { getAuth: () => Promise<string | null> }): Promise<Resource | null> {
    return await executeHalRequest({ 
        method: 'POST', 
        path, 
        authProvider, 
        body 
    });
}

export async function patchHal(path: string, body: HalRequestBody, authProvider: { getAuth: () => Promise<string | null> }): Promise<Resource | null> {
    return await executeHalRequest({ 
        method: 'PATCH', 
        path, 
        authProvider, 
        body 
    });
}