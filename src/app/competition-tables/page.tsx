import { CompetitionTableService, getTableId } from "@/api/competitionTableApi";
import PageShell from "@/app/components/page-shell";
import ErrorAlert from "@/app/components/error-alert";
import { serverAuthProvider } from "@/lib/authProvider";
import { UsersService } from "@/api/userApi";
import { isAdmin } from "@/lib/authz";
import { getServerTranslations } from "@/lib/i18n/server";
import { parseErrorMessage } from "@/types/errors";
import { redirect } from "next/navigation";
import { CompetitionTable } from "@/types/competitionTable";
import { Referee } from "@/types/referee";
import CompetitionTableList from "./competition-table-list";
import { RefereeOption } from "./assign-referee-dialog";

export const dynamic = "force-dynamic";

function refereeHref(r: Referee): string {
    return r.link("self")?.href ?? "";
}

function toRefereeOption(r: Referee, assignedTableId: string | null): RefereeOption {
    return {
        href: refereeHref(r),
        name: r.name ?? r.emailAddress ?? "Unknown",
        emailAddress: r.emailAddress ?? "",
        assignedTableId,
    };
}

export default async function CompetitionTablesPage() {
    const t = await getServerTranslations();
    const auth = await serverAuthProvider.getAuth();
    if (!auth) redirect("/login");

    const userService = new UsersService(serverAuthProvider);
    const tableService = new CompetitionTableService(serverAuthProvider);

    let tables: CompetitionTable[] = [];
    let allReferees: Referee[] = [];
    let error: string | null = null;

    try {
        const currentUser = await userService.getCurrentUser();
        if (!isAdmin(currentUser)) redirect("/");
    } catch {
        redirect("/login");
    }

    try {
        [tables, allReferees] = await Promise.all([
            tableService.getTables(),
            tableService.getReferees(),
        ]);
    } catch (e) {
        console.error("Failed to fetch competition tables data:", e);
        error = parseErrorMessage(e);
    }

    const tableIds = tables.map(getTableId);

    // Fetch referees per table to build the correct assignment map
    const tableRefereeResults = await Promise.allSettled(
        tableIds.map(async (tableId) => {
            const referees = await tableService.getRefereesForTable(tableId);
            return { tableId, referees };
        })
    );

    const refereesByTable: Record<string, RefereeOption[]> = {};
    const assignedMap = new Map<string, string>();

    for (const result of tableRefereeResults) {
        if (result.status === "fulfilled") {
            const { tableId, referees } = result.value;
            refereesByTable[tableId] = referees.map(r => toRefereeOption(r, tableId));
            for (const r of referees) {
                const href = refereeHref(r);
                if (href) assignedMap.set(href, tableId);
            }
        }
    }

    const allRefereeOptions = allReferees.map(r =>
        toRefereeOption(r, assignedMap.get(refereeHref(r)) ?? null)
    );

    return (
        <PageShell
            eyebrow={t.competitionTables.management}
            title={t.competitionTables.title}
            description={t.competitionTables.description}
        >
            {error && <ErrorAlert message={error} />}

            {!error && (
                <CompetitionTableList
                    tables={tableIds}
                    refereesByTable={refereesByTable}
                    allReferees={allRefereeOptions}
                />
            )}
        </PageShell>
    );
}
