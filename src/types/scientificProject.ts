import { Resource } from "halfred";

export interface ScientificProjectEntity {
    uri?: string;
    name?: string;
    team?: string;
    edition?: string;
    projectRoom?: string;
    room?: string;
    score?: number;
    comments?: string;
    startTime?: string;
}

export type ScientificProject = ScientificProjectEntity & Resource;
