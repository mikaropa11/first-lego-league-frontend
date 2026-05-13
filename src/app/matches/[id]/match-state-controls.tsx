"use client";

import { useMemo, useState } from "react";
import { MatchesService, type MatchStateTransition } from "@/api/matchesApi";
import ErrorAlert from "@/app/components/error-alert";
import { Button } from "@/app/components/button";
import { clientAuthProvider } from "@/lib/authProvider";
import { parseErrorMessage } from "@/types/errors";
import { useRouter } from "next/navigation";

type MatchState = "SCHEDULED" | "IN_PROGRESS" | "FINISHED" | "COMPLETED";

interface MatchStateControlsProps {
    readonly matchId: string;
    readonly state?: string;
    readonly canManageState: boolean;
}

function normalizeState(state?: string): MatchState | null {
    const normalizedState = state?.trim().toUpperCase();

    if (
        normalizedState === "SCHEDULED" ||
        normalizedState === "IN_PROGRESS" ||
        normalizedState === "FINISHED" ||
        normalizedState === "COMPLETED"
    ) {
        return normalizedState;
    }

    return null;
}

function getNextState(state?: string): MatchStateTransition | null {
    const normalizedState = normalizeState(state);

    if (normalizedState === "SCHEDULED") {
        return "IN_PROGRESS";
    }

    if (normalizedState === "IN_PROGRESS") {
        return "FINISHED";
    }

    return null;
}

function getStateLabel(state?: string) {
    const normalizedState = normalizeState(state);

    if (!normalizedState) {
        return "Unknown";
    }

    if (normalizedState === "IN_PROGRESS") {
        return "In progress";
    }

    if (normalizedState === "SCHEDULED") {
        return "Scheduled";
    }

    return "Finished";
}

function getStateBadgeClassName(state?: string) {
    const normalizedState = normalizeState(state);

    if (normalizedState === "SCHEDULED") {
        return "border-slate-200 bg-slate-100 text-slate-700";
    }

    if (normalizedState === "IN_PROGRESS") {
        return "border-amber-200 bg-amber-100 text-amber-800";
    }

    if (normalizedState === "FINISHED" || normalizedState === "COMPLETED") {
        return "border-emerald-200 bg-emerald-100 text-emerald-700";
    }

    return "border-border bg-muted text-muted-foreground";
}

export default function MatchStateControls({
    matchId,
    state,
    canManageState,
}: Readonly<MatchStateControlsProps>) {
    const router = useRouter();
    const service = useMemo(() => new MatchesService(clientAuthProvider), []);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const nextState = getNextState(state);
    const stateLabel = getStateLabel(state);

    async function handleTransition() {
        if (!nextState) {
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await service.updateMatchState(matchId, nextState);
            router.refresh();
        } catch (e) {
            setError(parseErrorMessage(e) || "Failed to update match state.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
                <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${getStateBadgeClassName(state)}`}
                >
                    {stateLabel}
                </span>

                {canManageState && nextState && (
                    <Button
                        type="button"
                        size="sm"
                        loading={isSubmitting}
                        loadingText="Updating..."
                        onClick={handleTransition}
                    >
                        {nextState === "IN_PROGRESS" ? "Start Match" : "Finish Match"}
                    </Button>
                )}
            </div>

            {error && <ErrorAlert message={error} />}
        </div>
    );
}
