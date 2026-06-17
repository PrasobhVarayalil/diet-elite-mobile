import type { AuthUser } from '@/src/types/auth';
import { customerCanUseMessenger } from '@/src/lib/role-nav';
import { isAdmin, isAdvisor, isCustomer, isDietitian } from '@/src/lib/user-access';

export type MessageContactType = 'dietitian' | 'client' | 'user';

export type MessageApiPaths = {
    index: string;
    startClinical: ((contactId: string) => string) | null;
    startDirect: string | null;
    show: (threadId: string) => string;
    store: (threadId: string) => string;
};

export function messageRoutesFor(user: AuthUser | null | undefined): MessageApiPaths | null {
    if (isDietitian(user)) {
        return {
            index: '/api/v1/dietitian/messages',
            startClinical: (clientUserId: string) => `/api/v1/dietitian/clients/${clientUserId}/messages`,
            startDirect: '/api/v1/dietitian/messages/start',
            show: (threadId: string) => `/api/v1/dietitian/messages/${threadId}`,
            store: (threadId: string) => `/api/v1/dietitian/messages/${threadId}`,
        };
    }

    if (isCustomer(user) && customerCanUseMessenger(user)) {
        return {
            index: '/api/v1/messages',
            startClinical: null,
            startDirect: null,
            show: (threadId: string) => `/api/v1/messages/${threadId}`,
            store: (threadId: string) => `/api/v1/messages/${threadId}`,
        };
    }

    if (isAdmin(user)) {
        return {
            index: '/api/v1/admin/messages',
            startClinical: null,
            startDirect: '/api/v1/admin/messages/start',
            show: (threadId: string) => `/api/v1/admin/messages/${threadId}`,
            store: (threadId: string) => `/api/v1/admin/messages/${threadId}`,
        };
    }

    if (isAdvisor(user)) {
        return {
            index: '/api/v1/advisor/messages',
            startClinical: null,
            startDirect: '/api/v1/advisor/messages/start',
            show: (threadId: string) => `/api/v1/advisor/messages/${threadId}`,
            store: (threadId: string) => `/api/v1/advisor/messages/${threadId}`,
        };
    }

    return null;
}

export function customerStartPath(): string {
    return '/api/v1/messages/start';
}

export function resolveStartPath(
    routes: MessageApiPaths,
    contactType: MessageContactType | undefined,
    contactId: string,
): string | null {
    if (contactType === 'dietitian') {
        return customerStartPath();
    }

    if (contactType === 'client' && routes.startClinical) {
        return routes.startClinical(contactId);
    }

    if (routes.startDirect) {
        return routes.startDirect;
    }

    return null;
}

export function startRequestBody(
    contactType: MessageContactType | undefined,
    contactId: string,
    body: string,
): Record<string, string> {
    if (contactType === 'dietitian') {
        return { dietitian_id: contactId, body };
    }

    if (contactType === 'client') {
        return { body };
    }

    return { recipient_user_id: contactId, body };
}
