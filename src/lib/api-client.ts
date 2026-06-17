import { apiUrl } from '@/src/lib/config';
import type { ApiErrorResponse, ApiMethod, ApiResult, ApiSuccessResponse } from '@/src/types/api';

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
    authToken = token;
}

export function getAuthToken(): string | null {
    return authToken;
}

function normalizeErrors(
    errors?: Record<string, string[] | string>,
): Record<string, string[]> | undefined {
    if (!errors) {
        return undefined;
    }

    return Object.fromEntries(
        Object.entries(errors).map(([key, value]) => [
            key,
            Array.isArray(value) ? value : [value],
        ]),
    );
}

async function parseJsonBody(response: Response): Promise<ApiSuccessResponse | ApiErrorResponse | null> {
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
        return null;
    }

    try {
        return (await response.json()) as ApiSuccessResponse | ApiErrorResponse;
    } catch {
        return null;
    }
}

export async function apiRequest<T = Record<string, unknown>>(
    path: string,
    method: ApiMethod,
    body?: unknown,
): Promise<ApiResult<T>> {
    try {
        const headers: Record<string, string> = {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Client': 'mobile',
        };

        if (authToken) {
            headers.Authorization = `Bearer ${authToken}`;
        }

        const response = await fetch(apiUrl(path), {
            method,
            headers,
            ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        });

        const payload = await parseJsonBody(response);

        if (response.status === 422) {
            const errorPayload = payload as ApiErrorResponse | null;
            return {
                ok: false,
                status: 422,
                message: errorPayload?.message ?? 'The given data was invalid.',
                errors: normalizeErrors(errorPayload?.errors),
            };
        }

        if (!response.ok) {
            const errorPayload = payload as ApiErrorResponse | null;
            return {
                ok: false,
                status: response.status,
                message:
                    errorPayload?.message ??
                    (response.status === 401
                        ? 'Please sign in again.'
                        : response.status >= 500
                          ? 'Something went wrong. Please try again.'
                          : 'Request failed. Please try again.'),
                errors: normalizeErrors(errorPayload?.errors),
            };
        }

        const successPayload = payload as ApiSuccessResponse<T> | null;

        return {
            ok: true,
            status: response.status,
            message: successPayload?.message ?? 'Success.',
            data: successPayload?.data,
        };
    } catch {
        return {
            ok: false,
            status: 0,
            message: 'Network error. Check API URL and your connection.',
        };
    }
}

export function apiGet<T = Record<string, unknown>>(path: string) {
    return apiRequest<T>(path, 'GET');
}

export function apiPost<T = Record<string, unknown>>(path: string, body: unknown) {
    return apiRequest<T>(path, 'POST', body);
}

export function apiPut<T = Record<string, unknown>>(path: string, body: unknown) {
    return apiRequest<T>(path, 'PUT', body);
}

export function apiDelete<T = Record<string, unknown>>(path: string) {
    return apiRequest<T>(path, 'DELETE');
}
