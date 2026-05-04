import { Resource } from "halfred";

export interface CompetitionTableEntity {
    uri?: string;
    id?: string;
}

export type CompetitionTable = CompetitionTableEntity & Resource;
