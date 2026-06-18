import type { PlanSummary } from '@/src/types/plans';

export type PlanRankInfo = NonNullable<PlanSummary['plan_rank']>;

export function planRankName(rank?: PlanRankInfo | null): string | null {
    if (!rank) {
        return null;
    }
    return rank.name ?? rank.rank_name ?? null;
}

export function planRankSlug(rank?: PlanRankInfo | null): string | null {
    if (!rank) {
        return null;
    }
    return rank.slug ?? null;
}

/** Viz tone index from rank sort order (1–4 → chart colors). */
export function planRankToneIndex(rank?: PlanRankInfo | null): number {
    const order = rank?.sort_order ?? 1;
    return Math.max(0, Math.min(5, order - 1));
}
