export function buildLeaveWindow(
    startDate: string,
    endDate: string,
    startTime = '00:00',
    endTime = '23:59',
): { starts_at: string; ends_at: string } {
    const pad = (t: string) => (t.length === 5 ? `${t}:00` : t);

    return {
        starts_at: `${startDate}T${pad(startTime)}`,
        ends_at: `${endDate}T${pad(endTime)}`,
    };
}
