interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

/** Friendly, centred empty state. Every list should render one instead of a blank page. */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4">
      {icon && (
        <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-brand-soft text-brand flex items-center justify-center">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-ink mb-1.5">{title}</h3>
      {description && <p className="text-muted text-sm mb-6 max-w-sm mx-auto">{description}</p>}
      {action && <div className="inline-flex">{action}</div>}
    </div>
  );
}
