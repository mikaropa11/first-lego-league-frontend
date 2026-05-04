import { Resource } from "halfred";

export interface AwardEntity {
    uri?: string;
    name?: string;
    title?: string;
    category?: string;
    edition?: string;
    winnerTeam?: string;
}

export type Award = AwardEntity & Resource;

export interface CreateAwardPayload {
    name: string;
    title: string;
    category: string;
    edition: string;
    winner: string;
}
