"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DPOGuard({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<"loading" | "authorized" | "unauthorized">("loading");
    const router = useRouter();

    useEffect(() => {
        const checkDPO = async () => {
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
                    console.log("[DPOGuard] User data received:", user);
                    if (user.role?.toUpperCase() === "DPO") {
                        setStatus("authorized");
                    } else {
                        console.warn("[DPOGuard] Unauthorized role:", user.role);
                        setStatus("unauthorized");
                    }
                } else {
                    console.error("[DPOGuard] API error:", response.status);
                    setStatus("unauthorized");
                }
            } catch (error) {
                console.error("[DPOGuard] Auth check failed:", error);
                setStatus("unauthorized");
            }
        };

        checkDPO();
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
                Unauthorized access: DPO permissions required.
            </div>
        );
    }

    return <>{children}</>;
}
