"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuditorGuard({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<"loading" | "authorized" | "unauthorized">("loading");
    const router = useRouter();

    useEffect(() => {
        // Temporarily disabled for UI viewing
        setStatus("authorized");
        /*
        const checkAuditor = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setStatus("unauthorized");
                return;
            }

            try {
                const response = await fetch("https://ropa-web-service-v2.onrender.com/auth/me", {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const user = await response.json();
                    console.log("[AuditorGuard] User data received:", user);
                    if (user.role?.toUpperCase() === "AUDITOR") {
                        setStatus("authorized");
                    } else {
                        console.warn("[AuditorGuard] Unauthorized role:", user.role);
                        setStatus("unauthorized");
                    }
                } else {
                    console.error("[AuditorGuard] API error:", response.status);
                    setStatus("unauthorized");
                }
            } catch (error) {
                console.error("[AuditorGuard] Auth check failed:", error);
                setStatus("unauthorized");
            }
        };

        // checkAuditor();
        */
    }, []);

    if (status === "loading") {
        return null;
    }

    if (status === "unauthorized") {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                padding: '20px',
                fontFamily: 'sans-serif',
                fontSize: '16px',
                color: '#000',
                zIndex: 9999
            }}>
                Unauthorized access: Auditor permissions required.
            </div>
        );
    }

    return <>{children}</>;
}
