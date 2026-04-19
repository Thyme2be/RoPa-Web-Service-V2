"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<"loading" | "authorized" | "unauthorized">("loading");
    const router = useRouter();

    useEffect(() => {
        // Temporarily disabled for UI viewing
        setStatus("authorized");
        /*
        const checkAdmin = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setStatus("unauthorized");
                return;
            }

            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const user = await response.json();
                    console.log("[AdminGuard] User data received:", user);
                    if (user.role?.toUpperCase() === "ADMIN") {
                        setStatus("authorized");
                    } else {
                        console.warn("[AdminGuard] Unauthorized role:", user.role);
                        setStatus("unauthorized");
                    }
                } else {
                    console.error("[AdminGuard] API error:", response.status);
                    setStatus("unauthorized");
                }
            } catch (error) {
                console.error("[AdminGuard] Auth check failed:", error);
                setStatus("unauthorized");
            }
        };

        checkAdmin();
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
                Unauthorized access: Admin permissions required.
            </div>
        );
    }

    return <>{children}</>;
}
