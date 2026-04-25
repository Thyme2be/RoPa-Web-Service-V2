"use client";

import React from "react";

import Button from "./Button";

export default function CompleteButton({ onClick }: { onClick?: () => void }) {
    return (
        <Button
            variant="primary"
            size="lg"
            onClick={onClick}
        >
            เสร็จสิ้น
        </Button>
    );
}
