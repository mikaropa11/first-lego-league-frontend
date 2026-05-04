"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, UserPlus } from "lucide-react";
import { Button, buttonVariants } from "@/app/components/button";
import EmptyState from "@/app/components/empty-state";
import { CompetitionTableService } from "@/api/competitionTableApi";
import { clientAuthProvider } from "@/lib/authProvider";
import { parseErrorMessage } from "@/types/errors";
import CreateCompetitionTableDialog from "./create-competition-table-dialog";
import AssignRefereeDialog, { RefereeOption } from "./assign-referee-dialog";

interface CompetitionTableListProps {
    tables: string[];
    refereesByTable: Record<string, RefereeOption[]>;
    allReferees: RefereeOption[];
}

export default function CompetitionTableList({ tables, refereesByTable, allReferees }: CompetitionTableListProps) {
    const router = useRouter();
    const [assigningTable, setAssigningTable] = useState<string | null>(null);
    const [deletingTable, setDeletingTable] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const handleDelete = async (tableId: string) => {
        setDeleteError(null);
        setDeletingTable(tableId);
        try {
            const service = new CompetitionTableService(clientAuthProvider);
            await service.deleteTable(tableId);
            router.refresh();
        } catch (e) {
            setDeleteError(parseErrorMessage(e));
        } finally {
            setDeletingTable(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <div className="page-eyebrow">Management</div>
                <h2 className="section-title">Tables</h2>
            </div>

            <CreateCompetitionTableDialog />

            {deleteError && (
                <div className="rounded-md border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700">
                    {deleteError}
                </div>
            )}

            {tables.length === 0 && (
                <EmptyState
                    title="No competition tables"
                    description="Create the first table to get started."
                />
            )}

            {assigningTable && (
                <AssignRefereeDialog
                    tableId={assigningTable}
                    currentReferees={refereesByTable[assigningTable] ?? []}
                    allReferees={allReferees}
                    onClose={() => setAssigningTable(null)}
                />
            )}

            {tables.length > 0 && (
                <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Table</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Referees</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {tables.map((tableId) => {
                                const referees = refereesByTable[tableId] ?? [];
                                return (
                                    <tr key={tableId} className="bg-card hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-medium">{tableId}</td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {referees.length === 0 ? (
                                                <span className="text-xs italic">No referees assigned</span>
                                            ) : (
                                                <ul className="space-y-0.5">
                                                    {referees.map(r => (
                                                        <li key={r.href} className="text-xs">{r.name}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setAssigningTable(tableId)}
                                                    className={buttonVariants({ variant: "outline", size: "sm" })}
                                                    disabled={!!deletingTable}
                                                >
                                                    <UserPlus className="mr-1 h-3 w-3" />
                                                    Referees
                                                </button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDelete(tableId)}
                                                    disabled={deletingTable === tableId}
                                                >
                                                    <Trash2 className="mr-1 h-3 w-3" />
                                                    {deletingTable === tableId ? "Deleting..." : "Delete"}
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
