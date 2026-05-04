import type { AuthStrategy } from "@/lib/authProvider";
import { CompetitionTable } from "@/types/competitionTable";
import { Referee } from "@/types/referee";
import { API_BASE_URL, createHalResource, deleteHal, fetchHalCollection, patchHal } from "./halClient";

export function getTableId(table: CompetitionTable): string {
    const href = table.link("self")?.href ?? "";
    const parts = href.split("/competitionTables/");
    return parts.length > 1 ? decodeURIComponent(parts[1]) : "";
}


export class CompetitionTableService {
    constructor(private readonly authStrategy: AuthStrategy) {}

    async getTables(): Promise<CompetitionTable[]> {
        return fetchHalCollection<CompetitionTable>(
            "/competitionTables?size=1000",
            this.authStrategy,
            "competitionTables"
        );
    }

    async createTable(identifier: string): Promise<CompetitionTable> {
        return createHalResource<CompetitionTable>(
            "/competitionTables",
            { id: identifier },
            this.authStrategy,
            "competition table"
        );
    }

    async deleteTable(tableId: string): Promise<void> {
        await deleteHal(`/competitionTables/${encodeURIComponent(tableId)}`, this.authStrategy);
    }

    async getReferees(): Promise<Referee[]> {
        return fetchHalCollection<Referee>(
            "/referees?sort=name,asc&size=1000",
            this.authStrategy,
            "referees"
        );
    }

    async getRefereesForTable(tableId: string): Promise<Referee[]> {
        return fetchHalCollection<Referee>(
            `/competitionTables/${encodeURIComponent(tableId)}/referees`,
            this.authStrategy,
            "referees"
        );
    }

    async assignRefereeToTable(refereeHref: string, tableId: string): Promise<void> {
        await patchHal(refereeHref, { supervisesTable: `${API_BASE_URL}/competitionTables/${encodeURIComponent(tableId)}` }, this.authStrategy);
    }

    async removeRefereeFromTable(refereeHref: string): Promise<void> {
        await patchHal(refereeHref, { supervisesTable: null }, this.authStrategy);
    }
}
