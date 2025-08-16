import type { ReactNode } from "react";
import { Package2 } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40 p-4">
        <div className="mb-8 flex items-center gap-2 text-2xl font-bold text-primary">
            <Package2 className="h-8 w-8" />
            <span>To Sabendo</span>
        </div>
      {children}
    </div>
  );
}
