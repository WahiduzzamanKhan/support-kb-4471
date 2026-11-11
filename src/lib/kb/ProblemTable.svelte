<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import tickets from '#lib/data/tickets-4471-split.json';
  import { groupByProblem, type Problem } from '#lib/kb/problems';

  type Filed = { url: string; state: string; by: string | null };
  let { ticket }: { ticket: number } = $props();

  const split = $derived(groupByProblem(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const ticketOf = (p: string): Filed | undefined => (tickets as Partial<Record<Problem, Filed>>)[p as Problem];
  const label = (url: string) => url.replace(/^.*\/issues\//, '#');
</script>

<p class="sum">
  <strong>{split.merged.length}</strong> reports merged into #{ticket} ·
  <strong>{split.groups.length}</strong>
  {split.groups.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>seen</th><th>ticket</th><th>state</th></tr>
  </thead>
  <tbody>
    {#each split.groups as g (g.problem)}
      {@const filed = ticketOf(g.problem)}
      <tr class:open={!filed || filed.state === 'open'}>
        <td><code>{g.problem}</code></td>
        <td>{g.reports.length}{#if g.alsoIn}<sup>*</sup>{/if}</td>
        <td class="tenants">{g.tenants.join(', ')}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td>{#if filed}<a href={filed.url}>{label(filed.url)}</a>{:else}no ticket yet{/if}</td>
        <td>{filed?.state ?? 'open'}{#if filed?.by}<br /><span class="by">{filed.by}</span>{/if}</td>
      </tr>
    {/each}
  </tbody>
</table>

{#each split.groups as g (g.problem)}
  {#if g.alsoIn}
    <p class="note">* {g.reports.length} {g.problem} reports are also counted under <code>{g.alsoIn}</code>, where the desk files them by tenant.</p>
  {/if}
{/each}

<style>
  .sum { font-size: 1.1rem; }
  .tenants { color: var(--muted); font-size: 0.85em; }
  .note { color: var(--muted); font-size: 0.85em; }
  .by { color: var(--muted); font-size: 0.85em; }
  .open td { background: var(--warn-bg); }
  .open td:last-child { color: var(--warn); font-weight: 600; }
</style>
