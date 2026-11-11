const AdminFooter = () => {
  return (
    <footer className="border-t bg-white py-6 text-center text-xs text-slate-500">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© 2026 MedsZop Inc. All rights reserved. Secure Administrative Interface.</p>
        <p className="text-[11px] text-slate-400">Strict Server-Side RBAC Enforcement Active</p>
      </div>
    </footer>
  );
};

export default AdminFooter;

