import { SearchSelect, type SearchSelectItem } from '@/components/ui/SearchSelect';
import { useMemo } from 'react';

export type MessageContact = {
    id: string;
    contact_type?: 'dietitian' | 'client' | 'user';
    name: string;
    title?: string | null;
};

type Props = {
    contacts: MessageContact[];
    selected: MessageContact | null;
    onSelect: (contact: MessageContact | null) => void;
    label?: string;
};

function contactTypeLabel(type?: MessageContact['contact_type']): string | null {
    if (type === 'dietitian') {
        return 'Dietitian';
    }
    if (type === 'client') {
        return 'Client';
    }
    if (type === 'user') {
        return 'Team member';
    }
    return null;
}

function toSearchItem(contact: MessageContact): SearchSelectItem {
    const role = contactTypeLabel(contact.contact_type);
    const meta = [role, contact.title].filter(Boolean).join(' · ') || null;

    return {
        id: contact.id,
        label: contact.name,
        meta,
        keywords: [contact.title ?? '', role ?? ''].filter(Boolean),
    };
}

export function ContactPicker({ contacts, selected, onSelect, label = 'To' }: Props) {
    const items = useMemo(() => contacts.map(toSearchItem), [contacts]);

    return (
        <SearchSelect
            emptyHint="No contacts match your search."
            items={items}
            label={label}
            onClear={() => onSelect(null)}
            onSelect={(id) => {
                const match = contacts.find((c) => c.id === id) ?? null;
                onSelect(match);
            }}
            placeholder="Search name or role…"
            selectedId={selected?.id ?? null}
        />
    );
}
