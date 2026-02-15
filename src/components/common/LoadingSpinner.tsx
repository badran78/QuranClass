export function LoadingSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-sm text-slate-500">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-100 border-t-brand-700" />
      <span>{label}</span>
    </div>
  );
}
