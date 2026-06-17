import { messageRoutesFor } from '@/src/lib/message-routes';
import type { AuthUser } from '@/src/types/auth';
import { useMemo } from 'react';

export function useMessageRoutes(user: AuthUser | null | undefined) {
    return useMemo(
        () => messageRoutesFor(user),
        [user?.role, user?.has_active_plan, user?.plan_access],
    );
}
