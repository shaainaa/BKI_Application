export const sidebarShellClassName =
  'fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]';

export const sidebarNavClassName = 'mt-2 flex-1 space-y-2 overflow-y-auto px-2';

export function getSidebarItemClassName(active: boolean): string {
  return [
    'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
    active
      ? 'bg-[var(--color-accent)] text-white shadow-sm'
      : 'text-[var(--color-text-primary)] hover:bg-[var(--color-primary-50)] hover:text-[var(--color-accent)]',
  ].join(' ');
}

export function getSidebarSubItemClassName(active: boolean): string {
  return [
    'flex items-center gap-3 px-2 py-2 text-sm transition-colors',
    active
      ? 'font-bold text-[var(--color-accent)]'
      : 'font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
  ].join(' ');
}

export function getSidebarSubDotClassName(active: boolean): string {
  return active ? 'h-2 w-2 rounded-full bg-[var(--color-accent)]' : 'h-2 w-2 rounded-full bg-[var(--color-muted)]';
}
