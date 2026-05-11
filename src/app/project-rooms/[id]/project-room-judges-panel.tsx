"use client";

import { ProjectRoomsService } from "@/api/projectRoomApi";
import ErrorAlert from "@/app/components/error-alert";
import { Button } from "@/app/components/button";
import { Input } from "@/app/components/input";
import { Label } from "@/app/components/label";
import { clientAuthProvider } from "@/lib/authProvider";
import { getEncodedResourceId } from "@/lib/halRoute";
import { parseErrorMessage } from "@/types/errors";
import { CheckCircle, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, startTransition, useEffect, useMemo, useState } from "react";

export interface JudgeSnapshot {
    readonly id?: string;
    readonly uri?: string;
    readonly name?: string;
    readonly emailAddress?: string;
    readonly phoneNumber?: string;
}

interface ProjectRoomJudgesPanelProps {
    readonly roomId: string;
    readonly roomNumber: string | number;
    readonly initialManagedByJudge: JudgeSnapshot | null;
    readonly initialPanelists: JudgeSnapshot[];
    readonly judges: JudgeSnapshot[];
    readonly errorMessage?: string | null;
}

function normalizeText(value: string | null | undefined): string {
    return value?.trim().toLowerCase() ?? "";
}

function getJudgeLabel(judge: JudgeSnapshot): string {
    return judge.name?.trim() || judge.emailAddress?.trim() || `Judge ${judge.id ?? ""}`.trim();
}

function getJudgeDetails(judge: JudgeSnapshot): string {
    return [judge.emailAddress?.trim(), judge.phoneNumber?.trim()].filter(Boolean).join(" · ");
}

function getJudgeKey(judge: JudgeSnapshot, index: number): string {
    return judge.id ?? judge.uri ?? `judge-${index}`;
}

function sameJudge(a: JudgeSnapshot | null, b: JudgeSnapshot | null): boolean {
    if (!a || !b) return false;
    if (a.id && b.id) return a.id === b.id;
    return getEncodedResourceId(a.uri) === getEncodedResourceId(b.uri);
}

export default function ProjectRoomJudgesPanel({
    roomId,
    roomNumber,
    initialManagedByJudge,
    initialPanelists,
    judges,
    errorMessage,
}: Readonly<ProjectRoomJudgesPanelProps>) {
    const router = useRouter();
    const service = useMemo(() => new ProjectRoomsService(clientAuthProvider), []);

    const [managedByJudge, setManagedByJudge] = useState<JudgeSnapshot | null>(initialManagedByJudge);
    const [panelists, setPanelists] = useState<JudgeSnapshot[]>(initialPanelists);
    const [query, setQuery] = useState("");
    const [selectedJudge, setSelectedJudge] = useState<JudgeSnapshot | null>(null);
    const [isWorking, setIsWorking] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(errorMessage ?? null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (!feedback) return;

        const timer = setTimeout(() => setFeedback(null), 3000);
        return () => clearTimeout(timer);
    }, [feedback]);

    const filteredJudges = useMemo(() => {
        const normalizedQuery = normalizeText(query);

        return judges
            .filter((judge) => {
                if (!normalizedQuery) return true;

                return (
                    normalizeText(judge.name).includes(normalizedQuery) ||
                    normalizeText(judge.emailAddress).includes(normalizedQuery) ||
                    normalizeText(judge.id).includes(normalizedQuery)
                );
            })
            .sort((a, b) => getJudgeLabel(a).localeCompare(getJudgeLabel(b)))
            .slice(0, 8);
    }, [judges, query]);

    const panelistCount = panelists.length;
    const selectedJudgeId = selectedJudge?.id ?? getEncodedResourceId(selectedJudge?.uri ?? undefined) ?? null;
    const selectedJudgeIsManager = sameJudge(selectedJudge, managedByJudge);
    const selectedJudgeIsPanelist = panelists.some((panelist) => sameJudge(panelist, selectedJudge));
    const canAddPanelist = !!selectedJudgeId && !selectedJudgeIsManager && !selectedJudgeIsPanelist && panelistCount < 3;
    const canAssignManager = !!selectedJudgeId && !selectedJudgeIsManager;

    function resetSearch() {
        setQuery("");
        setSelectedJudge(null);
        setIsOpen(false);
    }

    function pickJudge(judge: JudgeSnapshot) {
        setSelectedJudge(judge);
        setQuery(getJudgeLabel(judge));
        setIsOpen(false);
        setError(null);
        setFeedback(null);
    }

    async function assignPanelist(judge: JudgeSnapshot) {
        const judgeId = judge.id ?? getEncodedResourceId(judge.uri);
        if (!judgeId) {
            setError("This judge does not have a valid identifier.");
            return;
        }

        if (panelists.some((panelist) => sameJudge(panelist, judge))) {
            setFeedback(`${getJudgeLabel(judge)} is already in the panel.`);
            return;
        }

        if (panelistCount >= 3) {
            setError("This room already has the maximum of 3 panelists.");
            return;
        }

        if (sameJudge(managedByJudge, judge)) {
            setError("The head judge cannot be added as a panelist.");
            return;
        }

        setIsWorking(true);
        setError(null);

        try {
            await service.assignJudge(roomId, judgeId, false);
            setPanelists((current) => [...current, judge]);
            setFeedback(`Assigned ${getJudgeLabel(judge)} as panelist for room ${roomNumber}.`);
            startTransition(() => {
                router.refresh();
            });
        } catch (e) {
            setError(parseErrorMessage(e));
        } finally {
            setIsWorking(false);
        }
    }

    async function assignManager(judge: JudgeSnapshot) {
        const judgeId = judge.id ?? getEncodedResourceId(judge.uri);
        if (!judgeId) {
            setError("This judge does not have a valid identifier.");
            return;
        }

        if (sameJudge(managedByJudge, judge)) {
            setFeedback(`${getJudgeLabel(judge)} is already the head judge.`);
            return;
        }

        setIsWorking(true);
        setError(null);

        try {
            if (managedByJudge) {
                await service.clearManagedJudge(roomId);
            }

            if (panelists.some((panelist) => sameJudge(panelist, judge))) {
                await service.clearPanelist(judgeId);
                setPanelists((current) => current.filter((panelist) => !sameJudge(panelist, judge)));
            }

            await service.assignJudge(roomId, judgeId, true);
            setManagedByJudge(judge);
            setFeedback(`Assigned ${getJudgeLabel(judge)} as head judge for room ${roomNumber}.`);
            startTransition(() => {
                router.refresh();
            });
        } catch (e) {
            setError(parseErrorMessage(e));
        } finally {
            setIsWorking(false);
        }
    }

    async function removeManager() {
        if (!managedByJudge) return;

        setIsWorking(true);
        setError(null);

        try {
            await service.clearManagedJudge(roomId);
            setManagedByJudge(null);
            setFeedback(`Removed the head judge from room ${roomNumber}.`);
            startTransition(() => {
                router.refresh();
            });
        } catch (e) {
            setError(parseErrorMessage(e));
        } finally {
            setIsWorking(false);
        }
    }

    async function removePanelist(judge: JudgeSnapshot) {
        const judgeId = judge.id ?? getEncodedResourceId(judge.uri);
        if (!judgeId) {
            setError("This judge does not have a valid identifier.");
            return;
        }

        setIsWorking(true);
        setError(null);

        try {
            await service.clearPanelist(judgeId);
            setPanelists((current) => current.filter((panelist) => !sameJudge(panelist, judge)));
            setFeedback(`Removed ${getJudgeLabel(judge)} from the panel.`);
            startTransition(() => {
                router.refresh();
            });
        } catch (e) {
            setError(parseErrorMessage(e));
        } finally {
            setIsWorking(false);
        }
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
    }

    return (
        <section aria-labelledby="manage-judges-heading" className="rounded-lg border border-border bg-card p-5">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="page-eyebrow">Administration</div>
                    <h2 id="manage-judges-heading" className="section-title">
                        Manage Judges
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Assign one head judge and up to 3 panelists for this room.
                    </p>
                </div>

                <div className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
                    {panelistCount}/3 panelists
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
                <div className="space-y-4">
                    <div className="rounded-lg border border-border bg-background p-4">
                        <p className="text-sm font-medium text-foreground">Current head judge</p>
                        {managedByJudge ? (
                            <div className="mt-3 space-y-3">
                                <div>
                                    <p className="font-medium text-foreground">{getJudgeLabel(managedByJudge)}</p>
                                    {getJudgeDetails(managedByJudge) && (
                                        <p className="text-sm text-muted-foreground">{getJudgeDetails(managedByJudge)}</p>
                                    )}
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={removeManager}
                                    disabled={isWorking}
                                >
                                    Remove head judge
                                </Button>
                            </div>
                        ) : (
                            <p className="mt-2 text-sm text-muted-foreground">No head judge assigned yet.</p>
                        )}
                    </div>

                    <div className="rounded-lg border border-border bg-background p-4">
                        <p className="text-sm font-medium text-foreground">Panelists</p>
                        {panelists.length > 0 ? (
                            <ul className="mt-3 space-y-3">
                                {panelists.map((panelist, index) => (
                                    <li key={getJudgeKey(panelist, index)} className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-medium text-foreground">{getJudgeLabel(panelist)}</p>
                                            {getJudgeDetails(panelist) && (
                                                <p className="text-sm text-muted-foreground">{getJudgeDetails(panelist)}</p>
                                            )}
                                        </div>

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removePanelist(panelist)}
                                            disabled={isWorking}
                                        >
                                            Remove
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="mt-2 text-sm text-muted-foreground">No panelists assigned yet.</p>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="grid gap-2">
                            <Label htmlFor={`judge-search-${roomId}`}>Search judges</Label>
                            <div className="relative">
                                <Input
                                    id={`judge-search-${roomId}`}
                                    value={query}
                                    onFocus={() => setIsOpen(true)}
                                    onChange={(event) => {
                                        setQuery(event.target.value);
                                        setSelectedJudge(null);
                                        setIsOpen(true);
                                        setError(null);
                                        setFeedback(null);
                                    }}
                                    placeholder="Type a judge name or email"
                                    className="pl-10 text-foreground"
                                />
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                                {isOpen && query.trim().length > 0 && filteredJudges.length > 0 && (
                                    <div className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-lg border border-border bg-card shadow-lg">
                                        {filteredJudges.map((judge, index) => (
                                            <button
                                                key={getJudgeKey(judge, index)}
                                                type="button"
                                                className="flex w-full items-start justify-between gap-3 border-b border-border px-4 py-3 text-left last:border-b-0 hover:bg-secondary"
                                                onMouseDown={(event) => event.preventDefault()}
                                                onClick={() => pickJudge(judge)}
                                            >
                                                <span>
                                                    <span className="block font-medium text-foreground">{getJudgeLabel(judge)}</span>
                                                    {getJudgeDetails(judge) && (
                                                        <span className="block text-sm text-muted-foreground">{getJudgeDetails(judge)}</span>
                                                    )}
                                                </span>
                                                <span className="text-xs uppercase tracking-wide text-muted-foreground">Select</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </form>

                    {selectedJudge ? (
                        <div className="rounded-lg border border-border bg-background p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm font-medium text-foreground">Selected judge</p>
                                    <p className="mt-1 font-medium text-foreground">{getJudgeLabel(selectedJudge)}</p>
                                    {getJudgeDetails(selectedJudge) && (
                                        <p className="text-sm text-muted-foreground">{getJudgeDetails(selectedJudge)}</p>
                                    )}
                                </div>

                                <Button type="button" variant="ghost" size="sm" onClick={resetSearch} disabled={isWorking}>
                                    Clear
                                </Button>
                            </div>

                            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                                <Button
                                    type="button"
                                    variant="default"
                                    onClick={() => assignManager(selectedJudge)}
                                    disabled={!canAssignManager || isWorking}
                                >
                                    Assign as Head Judge
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => assignPanelist(selectedJudge)}
                                    disabled={!canAddPanelist || isWorking}
                                >
                                    Add to Panel
                                </Button>
                            </div>

                            <div className="mt-3 text-xs text-muted-foreground">
                                {selectedJudgeIsManager && <p>This judge is already the current head judge.</p>}
                                {selectedJudgeIsPanelist && <p>This judge is already part of the panel.</p>}
                                {!selectedJudgeIsManager && !selectedJudgeIsPanelist && panelistCount >= 3 && (
                                    <p>The panel is already full.</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-lg border border-border bg-background p-4">
                            <p className="text-sm text-muted-foreground">
                                Search and select a judge to manage their assignment.
                            </p>
                        </div>
                    )}

                    {feedback && (
                        <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3" role="status">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                                <p className="text-sm font-medium text-green-700">{feedback}</p>
                            </div>
                        </div>
                    )}

                    {error && <ErrorAlert message={error} />}

                    <div className="rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">Rules</p>
                        <ul className="mt-2 list-disc space-y-1 pl-5">
                            <li>One head judge per room.</li>
                            <li>Up to 3 panelists per room.</li>
                            <li>Only admins can use these controls.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}
