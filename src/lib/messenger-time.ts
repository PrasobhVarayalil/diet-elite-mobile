/** Compact relative time for chat lists (today → time only). */
export function formatMessengerTime(iso: string | null | undefined): string {
    if (!iso) {
        return '';
    }

    try {
        const date = new Date(iso);
        const now = new Date();
        const sameDay =
            date.getDate() === now.getDate() &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear();

        if (sameDay) {
            return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
        }

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const isYesterday =
            date.getDate() === yesterday.getDate() &&
            date.getMonth() === yesterday.getMonth() &&
            date.getFullYear() === yesterday.getFullYear();

        if (isYesterday) {
            return 'Yesterday';
        }

        const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
        if (date.getTime() > weekAgo) {
            return date.toLocaleDateString(undefined, { weekday: 'short' });
        }

        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
        return '';
    }
}

/** Short time under a bubble (same day) or date. */
export function formatBubbleTime(iso: string | null | undefined): string {
    if (!iso) {
        return '';
    }

    try {
        const date = new Date(iso);
        const now = new Date();
        const sameDay =
            date.getDate() === now.getDate() &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear();

        if (sameDay) {
            return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
        }

        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    } catch {
        return '';
    }
}
