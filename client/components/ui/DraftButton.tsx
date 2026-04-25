"use client";

import Button from "./Button";

export default function DraftButton({ onClick }: { onClick?: () => void }) {
    return (
        <Button
            variant="secondary"
            size="lg"
            onClick={onClick}
        >
            บันทึกฉบับร่าง
        </Button>
    );
}
