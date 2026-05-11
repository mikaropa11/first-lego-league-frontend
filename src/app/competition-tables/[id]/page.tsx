import { CompetitionTableService } from "@/api/competitionTableApi";
import { UsersService } from "@/api/userApi";
import FavoriteActionButton from "@/app/components/favorite-action-button";
import EmptyState from "@/app/components/empty-state";
import ErrorAlert from "@/app/components/error-alert";
import PageShell from "@/app/components/page-shell";
import { Breadcrumb } from "@/app/components/breadcrumb";
import { serverAuthProvider } from "@/lib/authProvider";
import { NotFoundError, parseErrorMessage } from "@/types/errors";
import type { CompetitionTable } from "@/types/competitionTable";
import type { Referee } from "@/types/referee";
import type { User } from "@/types/user";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface CompetitionTableDetailPageProps {
    readonly params: Promise<{ id: string }>;
}

function getTableLabel(table: CompetitionTable | null, id: string): string {
    return table?.id ?? id;
}

function getRefereeLabel(referee: Referee): string {
    return referee.name?.trim() || referee.emailAddress?.trim() || "Unknown referee";
}

export default async function CompetitionTableDetailPage(
    props: Readonly<CompetitionTableDetailPageProps>
) {
    const { id } = await props.params;

    const usersService = new UsersService(serverAuthProvider);
    const tablesService = new CompetitionTableService(serverAuthProvider);

    const auth = await serverAuthProvider.getAuth();
    if (!auth) redirect("/login");

    let currentUser: User | null = null;
    let table: CompetitionTable | null = null;
    let referees: Referee[] = [];
    let error: string | null = null;
    let refereesError: string | null = null;

    try {
        currentUser = await usersService.getCurrentUser().catch(() => null);
    } catch (e) {
        console.error("Failed to load competition table:", e);
    }

    if (!currentUser) {
        redirect("/login");
    }

    try {
        table = await tablesService.getTableById(id);
    } catch (e) {
        console.error("Failed to load competition table:", e);
        error = e instanceof NotFoundError
            ? "This competition table does not exist."
            : parseErrorMessage(e);
    }

    if (table) {
        try {
            referees = await tablesService.getRefereesForTable(id);
        } catch (e) {
            console.error("Failed to load referees for competition table:", e);
            refereesError = parseErrorMessage(e);
        }
    }

    const tableLabel = getTableLabel(table, id);
    const favoriteLabel = `Table ${tableLabel}`;

    return (
        <PageShell
            eyebrow="Competition"
            title={favoriteLabel}
            description="Assigned referees for this competition table."
            heroAside={
                <FavoriteActionButton
                    type="competition-table"
                    id={String(id)}
                    label={favoriteLabel}
                    href={`/competition-tables/${encodeURIComponent(id)}`}
                />
            }
        >
            <Breadcrumb
                items={[
                    { label: "Home", href: "/" },
                    { label: "Competition Tables", href: "/competition-tables" },
                    { label: favoriteLabel },
                ]}
            />

            {error && <ErrorAlert message={error} />}

            {!error && (
                <div className="space-y-6">
                    <section className="rounded-lg border border-border bg-card p-5">
                        <div className="space-y-2">
                            <div className="page-eyebrow">Details</div>
                            <h2 className="section-title">{favoriteLabel}</h2>
                            <p className="text-sm text-muted-foreground">
                                This view shows the referees currently assigned to the table.
                            </p>
                        </div>
                    </section>

                    <section aria-labelledby="referees-heading">
                        <div className="mb-4 space-y-1">
                            <div className="page-eyebrow">Assignments</div>
                            <h2 id="referees-heading" className="section-title">
                                Referees
                            </h2>
                        </div>

                        {refereesError && <ErrorAlert message={refereesError} />}

                        {!refereesError && referees.length === 0 && (
                            <EmptyState
                                title="No referees assigned"
                                description="This table does not have referees assigned yet."
                            />
                        )}

                        {!refereesError && referees.length > 0 && (
                            <ul className="space-y-3">
                                {referees.map((referee) => (
                                    <li
                                        key={referee.uri ?? referee.emailAddress ?? referee.name}
                                        className="rounded-lg border border-border bg-card p-5"
                                    >
                                        <p className="font-medium text-foreground">
                                            {getRefereeLabel(referee)}
                                        </p>
                                        {referee.emailAddress && (
                                            <p className="text-sm text-muted-foreground">
                                                {referee.emailAddress}
                                            </p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            )}
        </PageShell>
    );
}
