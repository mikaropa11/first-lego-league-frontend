import type { AuthStrategy } from "@/lib/authProvider";
import { Volunteer } from "@/types/volunteer";
import { fetchHalCollection, patchHal, deleteHal } from "./halClient";

type RawVolunteer = {
    uri?: string;
    name?: string;
    emailAddress?: string;
    phoneNumber?: string;
    expert?: boolean;
};
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
            expert: Boolean(v.expert),
            type
        } as Volunteer);

        return {
            judges: judges.map(v => mapV(v, 'Judge')),
            referees: referees.map(v => mapV(v, 'Referee')),
            floaters: floaters.map(v => mapV(v, 'Floater'))
        };
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
