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
import { mergeHal, mergeHalArray } from "@/api/halClient";
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

    const judge = room?.embedded("managedByJudge")
        ? toJudgeSnapshot(mergeHal<Volunteer>(room.embedded("managedByJudge")))
        : null;

    const panelists = room?.embeddedArray("panelists")
        ? mergeHalArray<Volunteer>(room.embeddedArray("panelists")).map(toJudgeSnapshot)
        : [];

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
