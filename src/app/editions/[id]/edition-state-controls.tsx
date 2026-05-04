"use client";

import { useMemo, useState } from "react";
import { EditionsService } from "@/api/editionApi";
import { useAuth } from "@/app/components/authentication";
import { Button } from "@/app/components/button";
import ConfirmDestructiveDialog from "@/app/components/confirm-destructive-dialog";
import ErrorAlert from "@/app/components/error-alert";
import { clientAuthProvider } from "@/lib/authProvider";
import { isAdmin as userIsAdmin } from "@/lib/authz";

interface EditionStateControlsProps {
    readonly editionId: string;
    readonly state?: string;
    readonly isAdmin: boolean;
}

const STATE_ORDER = ["DRAFT", "OPEN", "CLOSED"] as const;

type EditionState = (typeof STATE_ORDER)[number];

function normalizeState(state?: string): EditionState | null {
    if (state === "DRAFT" || state === "OPEN" || state === "CLOSED") {
        return state;
    }

    return null;
}

function getNextState(state?: string): EditionState | null {
    const normalizedState = normalizeState(state);

    if (!normalizedState) return null;
    if (normalizedState === "DRAFT") return "OPEN";
    if (normalizedState === "OPEN") return "CLOSED";

    return null;
}

function getStateBadgeClassName(state?: string): string {
    switch (normalizeState(state)) {
        case "DRAFT":
            return "bg-gray-100 text-gray-700 border-gray-200";
        case "OPEN":
            return "bg-green-100 text-green-700 border-green-200";
        case "CLOSED":
            return "bg-red-100 text-red-700 border-red-200";
        default:
            return "bg-muted text-muted-foreground border-border";
    }
}

export default function EditionStateControls({
    editionId,
    state,
    isAdmin,
}: EditionStateControlsProps) {
    const { user } = useAuth();
    const service = useMemo(() => new EditionsService(clientAuthProvider), []);

    const [currentState, setCurrentState] = useState(state ?? "UNKNOWN");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const nextState = getNextState(currentState);
    const canAdvanceState = isAdmin || userIsAdmin(user);

    async function handleConfirmTransition() {
        if (!nextState) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const updatedEdition = await service.updateEditionState(
                editionId,
                nextState,
            );

            setCurrentState(updatedEdition.state ?? nextState);
            setIsDialogOpen(false);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to update edition state.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="mt-3 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
                <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${getStateBadgeClassName(currentState)}`}
                >
                    {currentState}
                </span>

                {canAdvanceState && nextState && (
                    <Button
                        type="button"
                        size="sm"
                        disabled={isSubmitting}
                        onClick={() => setIsDialogOpen(true)}
                    >
                        {isSubmitting ? "Updating..." : `Advance to ${nextState}`}
                    </Button>
                )}
            </div>

            {error && <ErrorAlert message={error} />}

            {isDialogOpen && nextState && (
                <ConfirmDestructiveDialog
                    title="Advance edition state"
                    description={
                        <p>
                            Are you sure you want to change the edition state from
                            <span className="mx-1 font-semibold text-foreground">
                                {currentState}
                            </span>
                            to
                            <span className="mx-1 font-semibold text-foreground">
                                {nextState}
                            </span>
                            ?
                        </p>
                    }
                    confirmLabel={`Advance to ${nextState}`}
                    pendingLabel="Updating..."
                    onConfirm={handleConfirmTransition}
                    onCancel={() => {
                        if (!isSubmitting) {
                            setIsDialogOpen(false);
                        }
                    }}
                />
            )}
        </div>
    );
}
