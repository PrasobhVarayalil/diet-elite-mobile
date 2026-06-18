/** Apply Laravel 422 validation errors to a field error map. */
export function applyValidationErrors(
    errors: Record<string, string[]> | undefined,
    setFieldError: (field: string, message: string) => void,
): boolean {
    if (!errors || Object.keys(errors).length === 0) {
        return false;
    }

    for (const [field, messages] of Object.entries(errors)) {
        setFieldError(field, messages[0] ?? 'Invalid value.');
    }

    return true;
}

export function firstFieldError(errors: Record<string, string>): string | null {
    const values = Object.values(errors);
    return values.length > 0 ? values[0] : null;
}
