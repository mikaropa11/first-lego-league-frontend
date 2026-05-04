import { Resource } from "halfred";
import type { ScientificProjectEntity } from "./scientificProject";
import type { VolunteerEntity } from "./volunteer";

export interface ProjectRoomEntity {
    uri?: string;
    roomNumber?: number;
    judge?: VolunteerEntity;
    panelists?: VolunteerEntity[];
    scientificProjects?: ScientificProjectEntity[];
}

export type ProjectRoom = ProjectRoomEntity & Resource;
