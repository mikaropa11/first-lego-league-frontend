import { Resource } from "halfred";

export type VolunteerRole = "Judge" | "Referee" | "Floater";

export interface VolunteerEntity {
    uri?: string;
    name?: string;
    emailAddress?: string;
    phoneNumber?: string;
    type?: VolunteerRole;
    expert?: boolean;
    edition?: string;
    studentCode?: string;
}

export type Volunteer = VolunteerEntity & Resource;
