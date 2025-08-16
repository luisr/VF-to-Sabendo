
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  actions?: ReactNode;
}

export default function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    // FIX: Add responsive classes.
    // - On small screens (default): flex-col, items-start (stacks vertically)
    // - On medium screens and up (md): flex-row, items-center, justify-between (horizontal layout)
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {actions && (
        // FIX: Allow action buttons to wrap on smaller screens
        <div className="flex flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
