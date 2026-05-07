import type { AuthStrategy } from "@/lib/authProvider";
import { Volunteer, VolunteerRole } from "@/types/volunteer";
import { createHalResource, deleteHal, fetchHalCollection, patchHal } from "./halClient";

type RawVolunteer = {
    uri?: string;
    name?: string;
    emailAddress?: string;
    phoneNumber?: string;
    edition?: string;
    expert?: boolean;
    studentCode?: string;
};

type BaseCreateVolunteerPayload = {
    name: string;
    emailAddress: string;
    phoneNumber: string;
    edition: string;
};

export type CreateVolunteerPayload =
    | (BaseCreateVolunteerPayload & { type: "Judge" | "Referee"; expert: boolean })
    | (BaseCreateVolunteerPayload & { type: "Floater"; studentCode: string });

type CreateVolunteerRequest = {
    name: string;
    emailAddress: string;
    phoneNumber: string;
    edition: string;
    expert?: boolean;
    studentCode?: string;
};

const volunteerTypeEndpoints = {
    Judge: "/judges",
    Referee: "/referees",
    Floater: "/floaters",
} satisfies Record<VolunteerRole, string>;

export class VolunteersService {
    constructor(private readonly authStrategy: AuthStrategy) { }

    async getVolunteers(): Promise<{ judges: Volunteer[], referees: Volunteer[], floaters: Volunteer[] }> {
        const [judges, referees, floaters] = await Promise.all([
            fetchHalCollection<RawVolunteer>('/judges', this.authStrategy, 'judges'),
            fetchHalCollection<RawVolunteer>('/referees', this.authStrategy, 'referees'),
            fetchHalCollection<RawVolunteer>('/floaters', this.authStrategy, 'floaters')
        ]);

        const mapV = (v: RawVolunteer, type: 'Judge' | 'Referee' | 'Floater'): Volunteer => ({
            uri: v.uri || '',
            name: v.name || '',
            emailAddress: v.emailAddress || '',
            phoneNumber: v.phoneNumber || '',
            edition: v.edition || '',
            expert: Boolean(v.expert),
            studentCode: v.studentCode || '',
            type
        } as Volunteer);

        return {
            judges: judges.map(v => mapV(v, 'Judge')),
            referees: referees.map(v => mapV(v, 'Referee')),
            floaters: floaters.map(v => mapV(v, 'Floater'))
        };
    }

    async createVolunteer(data: CreateVolunteerPayload): Promise<Volunteer> {
        const payload: CreateVolunteerRequest = {
            name: data.name,
            emailAddress: data.emailAddress,
            phoneNumber: data.phoneNumber,
            edition: data.edition,
        };

        if (data.type === "Floater") {
            payload.studentCode = data.studentCode;
        } else {
            payload.expert = data.expert;
        }

        return createHalResource<Volunteer>(
            volunteerTypeEndpoints[data.type],
            payload,
            this.authStrategy,
            data.type.toLowerCase(),
        );
    }

    async updateVolunteer(uri: string, data: Partial<Volunteer>): Promise<void> {
        const payload: Partial<RawVolunteer> = {
            name: data.name,
            emailAddress: data.emailAddress,
            phoneNumber: data.phoneNumber,
        };
        const isExpertType = data.type === 'Judge' || data.type === 'Referee';

        if (isExpertType && typeof data.expert === 'boolean') {
            payload.expert = data.expert;
        }

        await patchHal(uri, payload, this.authStrategy);
    }

    async deleteVolunteer(uri: string): Promise<void> {
        await deleteHal(uri, this.authStrategy);
    }
}
