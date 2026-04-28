import AdminSidebar from "@/components/layouts/AdminSidebar";
import TopBar from "@/components/layouts/TopBar";
import AdminGuard from "@/components/auth/AdminGuard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <AdminGuard>
            <div className="flex min-h-screen bg-background">
                {/* Sidebar */}
                <AdminSidebar />

                <div className="flex-1 ml-[var(--sidebar-width)] flex flex-col">
                    {/* TopBar */}
                    <TopBar hideSearch />

                    {/* Main Content */}
                    <main className="flex-1 p-8 overflow-y-auto">
                        {children}
                    </main>
                </div>
            </div>
        </AdminGuard>
    );
}


