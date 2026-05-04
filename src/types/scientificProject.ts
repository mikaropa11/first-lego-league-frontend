import { Resource } from "halfred";

export interface ScientificProjectEntity {
    uri?: string;
    team?: string;
    edition?: string;
    score?: number;
    comments?: string;
    startTime?: string;
    room?: string;
}

export type ScientificProject = ScientificProjectEntity & Resource;
