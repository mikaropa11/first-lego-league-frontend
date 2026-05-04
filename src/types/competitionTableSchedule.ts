export interface TableMatchEntry {
    matchId: number;
    startTime: string;
    endTime: string;
}

export interface EditionCompetitionTable {
    identifier: string;
    matches: TableMatchEntry[];
}
