// What a report in a merged ticket is really about. causes.ts says which date bug a tenant hits;
// this file adds the reports the desk read as a one-day move (desk-notes.json), which no date flip explains.
import { causeOf, uniqueById, type Cause, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = Cause | 'one-day';
export const PROBLEMS: readonly Problem[] = ['parser', 'hint', 'one-day'];

export type ProblemGroup = {
  problem: Problem | 'unplaced';
  reports: Report[];
  // Reports also counted under another problem: the desk files a one-day move where its tenant puts it.
  alsoIn: Cause | null;
  tenants: string[];
  firstSeen: string;
  lastSeen: string;
};

function group(problem: ProblemGroup['problem'], rs: Report[], alsoIn: Cause | null = null): ProblemGroup {
  const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
  return {
    problem,
    reports: rs,
    alsoIn,
    tenants: [...new Set(rs.map((r) => r.tenant))].sort(),
    firstSeen: days[0],
    lastSeen: days[days.length - 1],
  };
}

// Counted the desk's way (CauseTable): every report under its cause, by tenant. One-day moves get a
// row of their own on top, since they need their own fix, but stay counted where they are filed.
export function groupByProblem(
  reports: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): { merged: Report[]; groups: ProblemGroup[] } {
  const merged = uniqueById(reports).filter((r) => r.mergedInto === ticket);
  const byCause = new Map<Cause | 'unplaced', Report[]>();
  for (const r of merged) {
    const c = causeOf(r, tenantOf(r)) ?? 'unplaced';
    byCause.set(c, [...(byCause.get(c) ?? []), r]);
  }
  const groups = [...byCause.entries()].map(([c, rs]) => group(c, rs)).sort((a, b) => b.reports.length - a.reports.length);
  const moved = merged.filter((r) => oneDayMove.includes(r.id));
  if (moved.length) {
    const filed = [...new Set(moved.map((r) => causeOf(r, tenantOf(r))))];
    groups.push(group('one-day', moved, filed.length === 1 ? filed[0] : null));
  }
  return { merged, groups };
}
