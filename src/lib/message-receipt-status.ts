export type MessageReceiptState = 'sent' | 'delivered' | 'read';

export function resolveMessageReceiptStatus(message: {
    status?: MessageReceiptState | null;
    delivered_at?: string | null;
    read_at?: string | null;
}): MessageReceiptState | null {
    if (message.status === 'sent' || message.status === 'delivered' || message.status === 'read') {
        return message.status;
    }

    if (message.read_at) {
        return 'read';
    }

    if (message.delivered_at) {
        return 'delivered';
    }

    return 'sent';
}
