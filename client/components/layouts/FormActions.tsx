import React from "react";
import CompleteButton from "@/components/ui/CompleteButton";
import DraftButton from "@/components/ui/DraftButton";
import CancelButton from "@/components/ui/CancelButton";

export default function FormActions({ onSave, onDraft, onCancel }: { onSave?: () => void, onDraft?: () => void, onCancel?: () => void }) {
    return (
        <div className="fixed bottom-0 left-[var(--sidebar-width)] right-0 bg-[#F6F3F2] backdrop-blur-md border-t border-gray-100 p-4 px-8 flex items-center justify-between z-40">
            <DraftButton onClick={onDraft} />

            <div className="flex items-center gap-4">
                <CancelButton onClick={onCancel} />
                <CompleteButton onClick={onSave} />
            </div>
        </div>
    );
}
