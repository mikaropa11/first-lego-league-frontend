import { ProjectRoomsService } from "@/api/projectRoomApi";
import EmptyState from "@/app/components/empty-state";
import ErrorAlert from "@/app/components/error-alert";
import PageShell from "@/app/components/page-shell";
import { serverAuthProvider } from "@/lib/authProvider";
import { parseErrorMessage } from "@/types/errors";
import type { ProjectRoom } from "@/types/projectRoom";
import { getEncodedResourceId } from "@/lib/halRoute";
import { mergeHal } from "@/api/halClient";
import type { Volunteer } from "@/types/volunteer";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ProjectRoomsPage() {
    const auth = await serverAuthProvider.getAuth();
    if (!auth) redirect("/login");

    const service = new ProjectRoomsService(serverAuthProvider);

    let rooms: ProjectRoom[] = [];
    let error: string | null = null;

    try {
        rooms = await service.getProjectRooms();
    } catch (e) {
        console.error("Failed to fetch project rooms:", e);
        error = parseErrorMessage(e);
    }

    return (
        <PageShell
            eyebrow="Judging"
            title="Project Rooms"
            description="Browse all project rooms and their assigned judges."
        >
            <div className="space-y-6">
                <div className="space-y-3">
                    <div className="page-eyebrow">Room directory</div>
                    <h2 className="section-title">All project rooms</h2>
                    <p className="section-copy max-w-3xl">
                        Each row shows the room number and the judge managing that room. Click a room to see its full details.
                    </p>
                </div>

                {error && <ErrorAlert message={error} />}

                {!error && rooms.length === 0 && (
                    <EmptyState
                        title="No project rooms found"
                        description="There are currently no project rooms available."
                    />
                )}

                {!error && rooms.length > 0 && (
                    <div className="rounded-lg border border-border overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/50">
                                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Room</th>
                                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Managing Judge</th>
                                    <th className="px-5 py-3 text-right font-medium text-muted-foreground">Details</th>
                                 </tr>
                            </thead>
                            <tbody>
                                {rooms.map((room, index) => {
                                    const id = room.uri ? getEncodedResourceId(room.uri) : String(index + 1);
                                    const judgeEmbedded = room.embedded('managedByJudge');
                                    const judge = judgeEmbedded ? mergeHal<Volunteer>(judgeEmbedded) : null;
                                    const judgeName = judge?.name ?? "—";
                                    const roomNumber = index + 1;
                                    return (
                                        <tr
                                            key={room.uri ?? index}
                                            className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                                        >
                                            <td className="px-5 py-4 font-semibold text-foreground">
                                                Room {roomNumber}
                                             </td>
                                            <td className="px-5 py-4 text-muted-foreground">
                                                {judgeName}
                                             </td>
                                            <td className="px-5 py-4 text-right">
                                                <Link
                                                    href={`/project-rooms/${id}`}
                                                    className="text-accent font-medium hover:underline"
                                                >
                                                    View →
                                                </Link>
                                             </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </PageShell>
    );
}