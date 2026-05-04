"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Button } from "@/app/components/button";

interface ConfirmDestructiveDialogProps {
    readonly title: string;
    readonly description: ReactNode;
    readonly confirmLabel: string;
    readonly pendingLabel?: string;
    readonly onConfirm: () => Promise<void> | void;
    readonly onCancel: () => void;
}

export default function ConfirmDestructiveDialog({
    title,
    description,
    confirmLabel,
    pendingLabel = "Working...",
    onConfirm,
    onCancel,
}: ConfirmDestructiveDialogProps) {
    const [isPending, setIsPending] = useState(false);

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape" && !isPending) {
                onCancel();
            }
        }

        globalThis.addEventListener("keydown", handleKeyDown);

        return () => {
            globalThis.removeEventListener("keydown", handleKeyDown);
        };
    }, [isPending, onCancel]);

    async function handleConfirm() {
        if (isPending) return;

        setIsPending(true);

        try {
            await onConfirm();
        } finally {
            setIsPending(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !isPending) {
                    onCancel();
                }
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-dialog-title"
                className="w-full max-w-md border border-border bg-card p-6 text-card-foreground shadow-xl"
            >
                <div className="space-y-3">
                    <h2 id="confirm-dialog-title" className="text-lg font-semibold">
                        {title}
                    </h2>

                    <div className="text-sm leading-6 text-muted-foreground">
                        {description}
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap justify-end gap-3">
                    <Button
                        type="button"
                        variant="secondary"
                        disabled={isPending}
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>

                    <Button
                        type="button"
                        variant="destructive"
                        disabled={isPending}
                        onClick={handleConfirm}
                    >
                        {isPending ? pendingLabel : confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}
