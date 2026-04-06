"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<"loading" | "authorized" | "unauthorized">("loading");
    const router = useRouter();

    useEffect(() => {
        const checkAdmin = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setStatus("unauthorized");
                return;
            }

            try {
                const response = await fetch("http://localhost:8000/users/me", {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const user = await response.json();
                    if (user.role === "Admin") {
                        setStatus("authorized");
                    } else {
                        setStatus("unauthorized");
                    }
                } else {
                    setStatus("unauthorized");
                }
            } catch (error) {
                console.error("Auth check failed:", error);
                setStatus("unauthorized");
            }
        };

        checkAdmin();
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
