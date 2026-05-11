"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, UserCheck, X } from "lucide-react";
import { Button } from "@/app/components/button";
import { useTranslations } from "@/lib/languageContext";
import { CompetitionTableService } from "@/api/competitionTableApi";
import { clientAuthProvider } from "@/lib/authProvider";
import { parseErrorMessage } from "@/types/errors";

export interface RefereeOption {
    href: string;
    name: string;
    emailAddress: string;
    assignedTableId: string | null;
}

interface AssignRefereeDialogProps {
    tableId: string;
    currentReferees: RefereeOption[];
    allReferees: RefereeOption[];
    onClose: () => void;
}

export default function AssignRefereeDialog({ tableId, currentReferees, allReferees, onClose }: AssignRefereeDialogProps) {
    const t = useTranslations();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [pendingHref, setPendingHref] = useState<string | null>(null);

    const service = new CompetitionTableService(clientAuthProvider);

    const currentRefereeHrefs = new Set(currentReferees.map(r => r.href));
    const filteredReferees = allReferees.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.emailAddress.toLowerCase().includes(search.toLowerCase())
    );

    const handleAssign = async (referee: RefereeOption) => {
        if (currentReferees.length >= 3) {
            setError(t.competitionTables.maxRefereesReached);
            return;
        }
        if (referee.assignedTableId && referee.assignedTableId !== tableId) {
            if (pendingHref !== referee.href) {
                setPendingHref(referee.href);
                return;
            }
        }

        setError(null);
        setIsLoading(true);
        try {
            await service.assignRefereeToTable(referee.href, tableId);
            setPendingHref(null);
            router.refresh();
            onClose();
        } catch (e) {
            setError(parseErrorMessage(e));
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemove = async (referee: RefereeOption) => {
        setError(null);
        setIsLoading(true);
        try {
            await service.removeRefereeFromTable(referee.href);
            router.refresh();
            onClose();
        } catch (e) {
            setError(parseErrorMessage(e));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">{t.competitionTables.assignReferee}</h3>
                    <p className="text-sm text-muted-foreground">
                        {t.competitionTables.tableLabel}: {tableId} — {currentReferees.length}/3 {t.competitionTables.refereesAssigned}
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {error && (
                <div className="flex items-center gap-3 border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700">
                    <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                    {error}
                </div>
            )}

            <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.competitionTables.searchRefereesPlaceholder}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />

            <div className="max-h-72 overflow-y-auto divide-y divide-border rounded-md border">
                {filteredReferees.length === 0 && (
                    <p className="px-4 py-6 text-center text-sm text-muted-foreground">{t.competitionTables.noRefereesFound}</p>
                )}
                {filteredReferees.map((referee) => {
                    const isAssignedHere = currentRefereeHrefs.has(referee.href);
                    const isAssignedElsewhere = !isAssignedHere && !!referee.assignedTableId;
                    const isPending = pendingHref === referee.href;

                    return (
                        <div key={referee.href} className="flex items-center justify-between px-4 py-3 gap-3">
                            <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{referee.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{referee.emailAddress}</p>
                                {isAssignedElsewhere && (
                                    <p className="text-xs text-amber-600 font-medium">
                                        {t.competitionTables.assignedTo} {referee.assignedTableId}
                                    </p>
                                )}
                                {isPending && (
                                    <p className="text-xs text-amber-700 font-semibold">
                                        {t.competitionTables.willBeReassigned} {referee.assignedTableId}. {t.competitionTables.confirmReassign}
                                    </p>
                                )}
                            </div>
                            <div className="shrink-0">
                                {isAssignedHere ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRemove(referee)}
                                        disabled={isLoading}
                                    >
                                        <UserCheck className="mr-1 h-3 w-3 text-green-600" />
                                        {t.competitionTables.removeReferee}
                                    </Button>
                                ) : (
                                    <Button
                                        size="sm"
                                        variant={isPending ? "destructive" : "outline"}
                                        onClick={() => handleAssign(referee)}
                                        disabled={isLoading}
                                    >
                                        {isPending ? t.competitionTables.confirmReassign : t.competitionTables.assignRefereeButton}
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
