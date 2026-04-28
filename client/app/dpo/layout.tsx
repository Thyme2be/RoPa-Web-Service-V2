import DPOSidebar from "@/components/layouts/DPOSidebar";
import TopBar from "@/components/layouts/TopBar";
import DPOGuard from "@/components/auth/DPOGuard";

export default function DPOLayout({ children }: { children: React.ReactNode }) {
    return (
        <DPOGuard>
            <div className="flex min-h-screen bg-surface-container-low">
                {/* Sidebar */}
                <DPOSidebar />

                <div className="flex-1 ml-[var(--sidebar-width)] flex flex-col">
                    {/* TopBar */}
                    <TopBar hideSearch />

                    {/* Main Content */}
                    <main className="flex-1 p-8 overflow-y-auto">
                        {children}
                    </main>
                </div>
            </div>
        </DPOGuard>
    );
}
