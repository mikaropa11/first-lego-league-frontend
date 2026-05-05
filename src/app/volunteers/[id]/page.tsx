import { VolunteersService } from "@/api/volunteerApi";
import { UsersService } from "@/api/userApi";
import { ProjectRoomsService } from "@/api/projectRoomApi";
import { EditionsService } from "@/api/editionApi";
import { serverAuthProvider } from "@/lib/authProvider";
import { revalidatePath } from "next/cache";
import EditVolunteerModal from "./edit-volunteer-modal";
import EmptyState from "@/app/components/empty-state";
import { Volunteer } from "@/types/volunteer";
import { parseErrorMessage } from "@/types/errors";
import { isAdmin } from "@/lib/authz";
import { mergeHal, fetchHalResource } from "@/api/halClient";
import { getEncodedResourceId } from "@/lib/halRoute";
import Link from "next/link";


interface Props {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ edit?: string }>;
}

async function getJudgeAssignment(volunteerUri: string) {
    const projectRoomService = new ProjectRoomsService(serverAuthProvider);
    const rooms = await projectRoomService.getProjectRooms();
    for (let index = 0; index < rooms.length; index++) {
        const room = rooms[index];
        const judgeEmbedded = room.embedded('managedByJudge');
        if (judgeEmbedded) {
            const judge = mergeHal<Volunteer>(judgeEmbedded);
            if (judge.uri === volunteerUri) {
                const roomId = room.uri ? getEncodedResourceId(room.uri) : null;
                return { id: roomId, name: `Room ${room.roomNumber ?? (index + 1)}` };
            }
        }
    }
    return null;
}

async function getRefereeAssignment(volunteerUri: string) {
    const refereeResource = await fetchHalResource<Volunteer>(volunteerUri, serverAuthProvider);
    const supervisesTableLink = refereeResource.link("supervisesTable")?.href;

    if (!supervisesTableLink) return null;

    const parts = supervisesTableLink.split("/competitionTables/");
    if (parts.length <= 1) return null;

    const tableId = decodeURIComponent(parts[1]);

    const editionsService = new EditionsService(serverAuthProvider);
    const editions = await editionsService.getEditions();
    if (editions.length > 0) {
        const activeEdition = editions.find(e => e.state === 'ACTIVE') || editions.at(-1)!;
        return { 
            tableId, 
            editionId: activeEdition.uri ? getEncodedResourceId(activeEdition.uri) : null 
        };
    }
    
    return { tableId, editionId: null };
}

export default async function VolunteerDetailPage(props: Readonly<Props>) {
    const { id } = await props.params;
    const usersService = new UsersService(serverAuthProvider);
    const volunteerService = new VolunteersService(serverAuthProvider);

    const currentUser = await usersService.getCurrentUser();
    const userIsAdmin = isAdmin(currentUser);

    let volunteer: Volunteer | null = null;
    let assignedProjectRoom: { id: string | null, name: string } | null = null;
    let assignedCompetitionTable: string | null = null;
    let assignedCompetitionTableEditionId: string | null = null;

    try {
        const data = await volunteerService.getVolunteers();
        const all = [...data.judges, ...data.referees, ...data.floaters];
        volunteer = all.find(v => v.uri === decodeURIComponent(id)) ?? null;

        if (volunteer?.uri) {
            if (volunteer.type === "Judge") {
                assignedProjectRoom = await getJudgeAssignment(volunteer.uri);
            } else if (volunteer.type === "Referee") {
                const assignment = await getRefereeAssignment(volunteer.uri);
                if (assignment) {
                    assignedCompetitionTable = assignment.tableId;
                    assignedCompetitionTableEditionId = assignment.editionId;
                }
            }
        }
    } catch (e) { console.error(e); }

       async function updateVolunteerData(uri: string, data: Partial<Volunteer>) {
        'use server';

        const user = await new UsersService(serverAuthProvider).getCurrentUser();
        if (!isAdmin(user)) {
            return { success: false, error: "Access denied: You are not an administrator" };
        }

        try {
            await new VolunteersService(serverAuthProvider).updateVolunteer(uri, data);
            revalidatePath('/volunteers');
            return { success: true };
        } catch (e) {
            return { success: false, error: parseErrorMessage(e) };
        }
    }
    if (!volunteer) return <EmptyState title="Not found" />;

    const renderAssignment = () => {
        if (volunteer.type === "Judge") {
            if (assignedProjectRoom) {
                return (
                    <p className="text-sm text-muted-foreground">
                        Assigned to {assignedProjectRoom.id ? (
                            <Link href={`/project-rooms/${assignedProjectRoom.id}`} className="text-accent font-medium hover:underline">{assignedProjectRoom.name}</Link>
                        ) : (
                            <span className="font-medium text-foreground">{assignedProjectRoom.name}</span>
                        )}
                    </p>
                );
            }
            return <p className="text-sm text-muted-foreground italic">Not currently assigned to any project room.</p>;
        }
        if (volunteer.type === "Referee") {
            if (assignedCompetitionTable) {
                return (
                    <p className="text-sm text-muted-foreground">
                        Assigned to {assignedCompetitionTableEditionId ? (
                            <Link href={`/editions/${assignedCompetitionTableEditionId}/competition-tables`} className="text-accent font-medium hover:underline">{assignedCompetitionTable}</Link>
                        ) : (
                            <span className="font-medium text-foreground">{assignedCompetitionTable}</span>
                        )}
                    </p>
                );
            }
            return <p className="text-sm text-muted-foreground italic">Not currently assigned to any competition table.</p>;
        }
        return null;
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="w-full max-w-3xl px-4 py-10">
                <div className="w-full rounded-lg border bg-white p-6 shadow-sm dark:bg-black">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-semibold">{volunteer.name || "Unnamed"}</h1>
                        {volunteer.type === 'Judge' && volunteer.expert && (
                            <span className="bg-amber-100 text-amber-700 text-xs px-3 py-1 rounded-full font-bold uppercase border border-amber-200">
                                Expert Judge
                            </span>
                        )}
                    </div>
                    <div className="mt-4 space-y-1 text-sm text-muted-foreground border-t pt-4">
                        <p><strong>Role:</strong> {volunteer.type}</p>
                        <p><strong>Email:</strong> {volunteer.emailAddress || "—"}</p>
                        <p><strong>Phone:</strong> {volunteer.phoneNumber || "—"}</p>
                        <p><strong>Expert:</strong> {volunteer.expert ? "Yes" : "No"}</p>
                    </div>

                    {volunteer.type === "Judge" && (
                        <div className="mt-6 space-y-2">
                            <h2 className="text-xl font-semibold border-t pt-4">Judge Info</h2>
                            <p><strong>Expert:</strong> {volunteer.expert ? "Yes" : "No"}</p>
                        </div>
                    )}

                    {volunteer.type !== "Floater" && (
                        <div className="mt-6 space-y-2 border-t pt-4">
                            <h2 className="text-xl font-semibold">Assignment</h2>
                            {renderAssignment()}
                        </div>
                    )}
                </div>
                {userIsAdmin && <EditVolunteerModal volunteer={volunteer} updateAction={updateVolunteerData} />}
            </div>
        </div>
    );
}