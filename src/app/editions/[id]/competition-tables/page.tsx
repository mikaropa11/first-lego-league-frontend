import { EditionsService } from "@/api/editionApi";
import EmptyState from "@/app/components/empty-state";
import ErrorAlert from "@/app/components/error-alert";
import PageShell from "@/app/components/page-shell";
import { serverAuthProvider } from "@/lib/authProvider";
import { parseErrorMessage, NotFoundError } from "@/types/errors";
import type { EditionCompetitionTable } from "@/types/competitionTableSchedule";

export const dynamic = "force-dynamic";

interface CompetitionTablesPageProps {
    readonly params: Promise<{ id: string }>;
}

export default async function CompetitionTablesPage(props: Readonly<CompetitionTablesPageProps>) {
    const { id } = await props.params;
    const service = new EditionsService(serverAuthProvider);

    let tables: EditionCompetitionTable[] = [];
    let error: string | null = null;

    try {
        tables = await service.getEditionCompetitionTables(id);
    } catch (e) {
        console.error("Failed to fetch competition tables:", e);
        error = e instanceof NotFoundError
            ? "This edition does not exist."
            : `Could not load competition tables. ${parseErrorMessage(e)}`;
    }

    return (
        <PageShell
            eyebrow="Edition"
            title="Competition Tables"
            description="Match schedule per competition table for this edition."
        >
            {error && <ErrorAlert message={error} />}

            {!error && tables.length === 0 && (
                <EmptyState
                    title="No competition tables"
                    description="No competition tables have been assigned for this edition yet."
                />
            )}

            {!error && tables.length > 0 && (
                <div className="space-y-8">
                    {tables.map((table) => (
                        <section key={table.identifier} aria-labelledby={`table-${table.identifier}-heading`}>
                            <div className="mb-4 space-y-1">
                                <div className="page-eyebrow">Table</div>
                                <h2 id={`table-${table.identifier}-heading`} className="section-title">
                                    {table.identifier}
                                </h2>
                            </div>

                            {table.matches.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No matches scheduled for this table.</p>
                            ) : (
                                <div className="overflow-hidden border border-border">
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-xs border-collapse text-left">
                                            <caption className="sr-only">Matches for {table.identifier}</caption>
                                            <thead className="bg-secondary/70">
                                                <tr>
                                                    <th className="px-4 py-3 text-sm font-semibold text-foreground sm:px-5">Match</th>
                                                    <th className="px-4 py-3 text-sm font-semibold text-foreground sm:px-5">Start time</th>
                                                    <th className="px-4 py-3 text-sm font-semibold text-foreground sm:px-5">End time</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {table.matches.map((match) => (
                                                    <tr
                                                        key={match.matchId}
                                                        className="border-t border-border transition-colors hover:bg-secondary/40"
                                                    >
                                                        <td className="px-4 py-4 text-sm text-foreground sm:px-5">
                                                            #{match.matchId}
                                                        </td>
                                                        <td className="px-4 py-4 text-sm text-foreground sm:px-5">
                                                            {match.startTime}
                                                        </td>
                                                        <td className="px-4 py-4 text-sm text-foreground sm:px-5">
                                                            {match.endTime}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </section>
                    ))}
                </div>
            )}
        </PageShell>
    );
}
