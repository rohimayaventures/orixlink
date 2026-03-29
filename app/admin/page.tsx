import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { loadAdminDashboardData } from "@/lib/admin/dashboardData";
import AdminDashboardClient from "./AdminDashboardClient";

type Search = { q?: string; p?: string; sp?: string };

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { admin } = await requireAdmin();
  const sp = await searchParams;
  const q = sp.q ?? "";
  const usersPage = Math.max(1, parseInt(sp.p ?? "1", 10) || 1);
  const subsPage = Math.max(1, parseInt(sp.sp ?? "1", 10) || 1);
  const data = await loadAdminDashboardData(admin, {
    q,
    usersPage,
    subsPage,
  });
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "40vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#080C14",
            color: "#C8A96E",
            fontFamily: "var(--font-display), serif",
          }}
        >
          Loading admin…
        </div>
      }
    >
      <AdminDashboardClient data={data} />
    </Suspense>
  );
}
