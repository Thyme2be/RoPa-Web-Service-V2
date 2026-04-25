"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";

import Button from "./Button";

export default function LogoutButton() {
    const { logout } = useAuth();
    const [isLoading, setIsLoading] = React.useState(false);

    const handleLogout = async () => {
        setIsLoading(true);
        try {
            await logout();
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            onClick={handleLogout}
            isLoading={isLoading}
            variant="primary"
            className="w-full h-12 rounded-2xl"
            leftIcon={<span className="material-symbols-outlined font-bold">logout</span>}
            loadingText="กำลังออกจากระบบ..."
        >
            ออกจากระบบ
        </Button>
    );
}