import { ProjectRoomsService } from "@/api/projectRoomApi";
import { VolunteersService } from "@/api/volunteerApi";
import { UsersService } from "@/api/userApi";
import ErrorAlert from "@/app/components/error-alert";
import PageShell from "@/app/components/page-shell";
import { Breadcrumb } from "@/app/components/breadcrumb";
import { InfoRow } from "@/app/components/info-row";
import EmptyState from "@/app/components/empty-state";
import { buttonVariants } from "@/app/components/button";
import { serverAuthProvider } from "@/lib/authProvider";
import { getEncodedResourceId } from "@/lib/halRoute";
import { isAdmin } from "@/lib/authz";
import { NotFoundError, parseErrorMessage } from "@/types/errors";
import type { ProjectRoom } from "@/types/projectRoom";
import { fetchHalCollection, fetchHalResource, mergeHal, mergeHalArray } from "@/api/halClient";
import type { Volunteer } from "@/types/volunteer";
import type { ScientificProject } from "@/types/scientificProject";
import type { User } from "@/types/user";
import Link from "next/link";
import { redirect } from "next/navigation";
import ManageJudgesPanel, { type JudgeSnapshot } from "./project-room-judges-panel";

interface ProjectRoomDetailPageProps {
    readonly params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

function toJudgeSnapshot(volunteer: Volunteer): JudgeSnapshot {
    const uri = volunteer.uri ?? volunteer.link("self")?.href ?? null;

    return {
        id: getEncodedResourceId(uri) ?? undefined,
        uri: uri ?? undefined,
        name: volunteer.name,
        emailAddress: volunteer.emailAddress,
        phoneNumber: volunteer.phoneNumber,
    };
}

async function resolveManagedJudge(room: ProjectRoom): Promise<Volunteer | null> {
    const embeddedJudge = room.embedded("managedByJudge");
    if (embeddedJudge) {
        return mergeHal<Volunteer>(embeddedJudge);
    }

    const judgeHref = room.link("managedByJudge")?.href;
    if (!judgeHref) {
        return null;
    }

    try {
        return await fetchHalResource<Volunteer>(judgeHref, serverAuthProvider);
    } catch (error) {
        if (error instanceof NotFoundError) {
            console.warn("Managed judge not found for room:", room.roomNumber ?? room.uri ?? judgeHref);
            return null;
        }
        throw error;
    }
}

async function resolvePanelists(room: ProjectRoom): Promise<Volunteer[]> {
    const embeddedPanelists = room.embeddedArray("panelists");
    if (embeddedPanelists && embeddedPanelists.length > 0) {
        return mergeHalArray<Volunteer>(embeddedPanelists);
    }

    const panelistsHref = room.link("panelists")?.href;
    if (!panelistsHref) {
        return [];
    }

    try {
        return await fetchHalCollection<Volunteer>(panelistsHref, serverAuthProvider, "judges");
    } catch (error) {
        if (error instanceof NotFoundError) {
            console.warn("Panelists collection not found for room:", room.roomNumber ?? room.uri ?? panelistsHref);
            return [];
        }
        throw error;
    }
}

export default async function ProjectRoomDetailPage(props: Readonly<ProjectRoomDetailPageProps>) {
    const { id } = await props.params;

    const auth = await serverAuthProvider.getAuth();
    if (!auth) redirect("/login");

    const service = new ProjectRoomsService(serverAuthProvider);
    const volunteersService = new VolunteersService(serverAuthProvider);
    const usersService = new UsersService(serverAuthProvider);

    let room: ProjectRoom | null = null;
    let error: string | null = null;
    let currentUser: User | null = null;
    let judges: JudgeSnapshot[] = [];
    let judgesError: string | null = null;

    try {
        currentUser = await usersService.getCurrentUser().catch(() => null);
        room = await service.getProjectRoomById(id);
    } catch (e) {
        console.error("Failed to fetch project room:", e);
        error = e instanceof NotFoundError
            ? "This project room does not exist."
            : `Could not load room details. ${parseErrorMessage(e)}`;
    }

    const isAdminUser = isAdmin(currentUser);

    let judge: JudgeSnapshot | null = null;
    let panelists: JudgeSnapshot[] = [];

    if (room) {
        const [judgeResult, panelistsResult] = await Promise.allSettled([
            resolveManagedJudge(room),
            resolvePanelists(room),
        ]);

        if (judgeResult.status === "fulfilled" && judgeResult.value) {
            judge = toJudgeSnapshot(judgeResult.value);
        } else if (judgeResult.status === "rejected") {
            console.error("Failed to fetch managing judge:", judgeResult.reason);
        }

        if (panelistsResult.status === "fulfilled") {
            panelists = panelistsResult.value.map(toJudgeSnapshot);
        } else {
            console.error("Failed to fetch panelists:", panelistsResult.reason);
        }
    }

    const scientificProjects = room?.embeddedArray("scientificProjects")
        ? mergeHalArray<ScientificProject>(room.embeddedArray("scientificProjects"))
        : [];

    const evaluationRoomNumber = room?.roomNumber ?? id;

    if (isAdminUser) {
        try {
            const volunteers = await volunteersService.getVolunteers();
            judges = volunteers.judges.map(toJudgeSnapshot);
        } catch (e) {
            console.error("Failed to fetch judges:", e);
            judgesError = `Could not load judges. ${parseErrorMessage(e)}`;
        }
    }

    return (
        <PageShell
            eyebrow="Judging"
            title="Project Room"
            description="Details about this project room, its judge, panelists, and assigned scientific projects."
            heroAside={
            room ? (
                <Link
                    href={`/evaluation-rooms/${evaluationRoomNumber}`}
                    className={buttonVariants({ variant: "default", size: "sm" })}
                >
                    Open judge evaluation view
                </Link>
            ) : undefined
        }
        >
            <Breadcrumb
                items={[
                    { label: "Home", href: "/" },
                    { label: "Project Rooms", href: "/project-rooms" },
                    { label: `Room ${evaluationRoomNumber}` },
                ]}
            />

            {error && <ErrorAlert message={error} />}

            {!error && room && (
                <div className="space-y-8">
                    {isAdminUser && (
                        <ManageJudgesPanel
                            key={[
                                judge?.id ?? judge?.uri ?? "no-manager",
                                panelists.map((panelist) => panelist.id ?? panelist.uri ?? panelist.name ?? "").join("|"),
                                judges.map((judgeOption) => judgeOption.id ?? judgeOption.uri ?? judgeOption.name ?? "").join("|"),
                            ].join("::")}
                            roomId={id}
                            roomNumber={evaluationRoomNumber}
                            initialManagedByJudge={judge}
                            initialPanelists={panelists}
                            judges={judges}
                            errorMessage={judgesError}
                        />
                    )}

                    <section aria-labelledby="judge-heading">
                        <div className="mb-4 space-y-1">
                            <div className="page-eyebrow">Judging</div>
                            <h2 id="judge-heading" className="section-title">
                                Managing judge
                            </h2>
                        </div>

                        <div className="space-y-3 rounded-lg border border-border bg-card p-5">
                            {judge ? (
                                <>
                                    <InfoRow label="Name" value={judge.name ?? "—"} />
                                    {judge.emailAddress && (
                                        <InfoRow label="Email" value={judge.emailAddress} />
                                    )}
                                    {judge.phoneNumber && (
                                        <InfoRow label="Phone" value={judge.phoneNumber} />
                                    )}
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No judge assigned to this room.
                                </p>
                            )}
                        </div>
                    </section>

                    <section aria-labelledby="panelists-heading">
                        <div className="mb-4 space-y-1">
                            <div className="page-eyebrow">Panel</div>
                            <h2 id="panelists-heading" className="section-title">
                                Panelists
                            </h2>
                        </div>

                        {panelists.length === 0 ? (
                            <EmptyState
                                title="No panelists assigned"
                                description="There are no panelists assigned to this room yet."
                            />
                        ) : (
                            <ul className="space-y-3">
                                {panelists.map((panelist, index) => (
                                    <li
                                        key={panelist.uri ?? index}
                                        className="space-y-2 rounded-lg border border-border bg-card p-5"
                                    >
                                        <InfoRow label="Name" value={panelist.name ?? "—"} />
                                        {panelist.emailAddress && (
                                            <InfoRow label="Email" value={panelist.emailAddress} />
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section aria-labelledby="projects-heading">
                        <div className="mb-4 space-y-1">
                            <div className="page-eyebrow">Innovation</div>
                            <h2 id="projects-heading" className="section-title">
                                Assigned scientific projects
                            </h2>
                        </div>

                        {scientificProjects.length === 0 ? (
                            <EmptyState
                                title="No projects assigned"
                                description="There are no scientific projects assigned to this room yet."
                            />
                        ) : (
                            <ul className="space-y-3">
                                {scientificProjects.map((project, index) => (
                                    <li
                                        key={project.uri ?? index}
                                        className="space-y-2 rounded-lg border border-border bg-card p-5"
                                    >
                                        {project.team && (
                                            <InfoRow label="Team" value={project.team} />
                                        )}
                                        {project.score != null && (
                                            <InfoRow label="Score" value={`${project.score} pts`} />
                                        )}
                                        {project.comments && (
                                            <InfoRow label="Comments" value={project.comments} />
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            )}
        </PageShell>
    );
}
