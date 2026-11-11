import React from "react";

export default function AdminFooter() {
  return (
    <footer className="border-t border-border bg-card/50 py-3 px-6 text-center text-xs text-muted-foreground shrink-0">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© 2026 MedsZop Healthcare Inc. All rights reserved. Confidential Administrator Console.</p>
        <div className="flex items-center gap-3 text-[11px]">
          <span>Protected by Render API Gateway & Cloudflare</span>
          <span>•</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">RBAC Active</span>
        </div>
      </div>
    </footer>
  );
}
