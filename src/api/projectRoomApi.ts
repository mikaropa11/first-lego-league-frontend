import type { AuthStrategy } from "@/lib/authProvider";
import { API_BASE_URL, patchHal } from "./halClient";
import type { ProjectRoom } from "@/types/projectRoom";
import { fetchHalCollection, fetchHalResource } from "./halClient";

export interface AssignJudgeResponse {
    readonly roomId: string;
    readonly judgeId: string;
    readonly role: string;
    readonly status: string;
}

interface AssignJudgeRequestPayload {
    readonly roomId: string;
    readonly judgeId: string;
    readonly isManager: boolean;
}

async function postJson<T>(path: string, body: unknown, authStrategy: AuthStrategy): Promise<T> {
    const auth = await authStrategy.getAuth();

    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...(auth ? { Authorization: auth } : {}),
        },
        body: JSON.stringify(body),
        cache: "no-store",
    });

    if (!response.ok) {
        let message = `HTTP ${response.status}`;

        try {
            const data = await response.json() as { message?: string; error?: string; detail?: string };
            message = data.message ?? data.error ?? data.detail ?? message;
        } catch {
            const text = await response.text().catch(() => "");
            if (text.trim()) {
                message = text;
            }
        }

        throw new Error(message);
    }

    return response.json() as Promise<T>;
}

export class ProjectRoomsService {
    constructor(private readonly authStrategy: AuthStrategy) {}

    async getProjectRooms(): Promise<ProjectRoom[]> {
        return fetchHalCollection<ProjectRoom>(
            "/projectRooms",
            this.authStrategy,
            "projectRooms"
        );
    }

    async getProjectRoomById(id: string): Promise<ProjectRoom> {
        const encodedId = encodeURIComponent(id);

        return fetchHalResource<ProjectRoom>(
            `/projectRooms/${encodedId}`,
            this.authStrategy
        );
    }

    async getProjectRoomByRoomNumber(roomNumber: string | number): Promise<ProjectRoom | null> {
        const rooms = await this.getProjectRooms();
        const normalizedRoomNumber = Number(roomNumber);

        return rooms.find((room, index) => {
            const resolvedRoomNumber = room.roomNumber ?? index + 1;
            return resolvedRoomNumber === normalizedRoomNumber;
        }) ?? null;
    }

    async assignJudge(roomId: string, judgeId: string, isManager: boolean): Promise<AssignJudgeResponse> {
        return postJson<AssignJudgeResponse>("/project-rooms/assign-judge", {
            roomId,
            judgeId,
            isManager,
        } satisfies AssignJudgeRequestPayload, this.authStrategy);
    }

    async clearManagedJudge(roomId: string): Promise<void> {
        await patchHal(
            `/projectRooms/${encodeURIComponent(roomId)}`,
            { managedByJudge: null },
            this.authStrategy
        );
    }

    async clearPanelist(judgeId: string): Promise<void> {
        await patchHal(
            `/judges/${encodeURIComponent(judgeId)}`,
            { memberOfRoom: null },
            this.authStrategy
        );
    }
}
