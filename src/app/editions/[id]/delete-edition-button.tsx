"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { buttonVariants } from "@/app/components/button";
import { cn } from "@/lib/utils";

interface DeleteEditionButtonProps {
    readonly deleteAction: () => Promise<void>;
}

function ConfirmDeleteButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className={buttonVariants({ variant: "destructive", size: "sm" })}
        >
            {pending ? "Deleting..." : "Delete"}
        </button>
    );
}

export default function DeleteEditionButton({
    deleteAction,
}: Readonly<DeleteEditionButtonProps>) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className={buttonVariants({ variant: "destructive", size: "sm" })}
            >
                Delete edition
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
                        <h2 className="text-lg font-semibold text-foreground">
                            Delete edition?
                        </h2>

                        <p className="mt-2 text-sm text-muted-foreground">
                            This action cannot be undone. The edition will be permanently deleted.
                        </p>

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                    buttonVariants({ variant: "outline", size: "sm" }),
                                    "min-w-24",
                                )}
                            >
                                Cancel
                            </button>

                            <form action={deleteAction}>
                                <ConfirmDeleteButton />
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
