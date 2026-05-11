import { ScientificProjectsService } from "@/api/scientificProjectApi";
import { UsersService } from "@/api/userApi";
import FavoriteActionButton from "@/app/components/favorite-action-button";
import ErrorAlert from "@/app/components/error-alert";
import PageShell from "@/app/components/page-shell";
import { Breadcrumb } from "@/app/components/breadcrumb";
import { InfoRow } from "@/app/components/info-row";
import { TeamCard } from "@/app/components/team-card";
import ScientificProjectEvaluationEditor from "./scientific-project-evaluation-editor";
import { serverAuthProvider } from "@/lib/authProvider";
import { isAdmin, isJudge } from "@/lib/authz";
import { fetchHalCollection, fetchHalResource } from "@/api/halClient";
import { NotFoundError, parseErrorMessage } from "@/types/errors";
import { ScientificProject } from "@/types/scientificProject";
import { ProjectRoom } from "@/types/projectRoom";
import { Team } from "@/types/team";
import { User } from "@/types/user";
import { Volunteer } from "@/types/volunteer";
import { buttonVariants } from "@/app/components/button";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EditionsService } from "@/api/editionApi";
import { Edition } from "@/types/edition";
import { isEditionActive } from "@/lib/editionStateGuards";

export const dynamic = "force-dynamic";

interface ScientificProjectDetailPageProps {
    readonly params: Promise<{ id: string }>;
}

function getProjectTitle(project: ScientificProject | null, id: string): string {
    if (!project) {
        let decodedId = id;

        try {
            decodedId = decodeURIComponent(id);
        } catch {
            // Use raw id.
        }

        return `Scientific Project ${decodedId}`;
    }

    return project.comments ? project.comments : `Scientific Project ${id}`;
}

export default async function ScientificProjectDetailPage(
    props: Readonly<ScientificProjectDetailPageProps>
) {
    const { id } = await props.params;
    const service = new ScientificProjectsService(serverAuthProvider);
    const userService = new UsersService(serverAuthProvider);

    let project: ScientificProject | null = null;
    let team: Team | null = null;
    let currentUser: User | null = null;
    let projectRoom: ProjectRoom | null = null;
    let managedByJudge: Volunteer | null = null;
    let panelists: Volunteer[] = [];
    let edition: Edition | null = null;
    let projectError: string | null = null;
    let teamError: string | null = null;

    try {
        currentUser = await userService.getCurrentUser().catch(() => null);
    } catch (e) {
        console.error("Failed to fetch current user:", e);
    }

    if (!currentUser) {
        redirect("/login");
    }

    if (!isAdmin(currentUser) && !isJudge(currentUser)) {
        redirect("/");
    }

    try {
        project = await service.getScientificProjectById(id);
    } catch (e) {
        console.error("Failed to fetch scientific project:", e);
        projectError = e instanceof NotFoundError
            ? "This scientific project does not exist."
            : `Could not load project details. ${parseErrorMessage(e)}`;
    }

    const teamHref = project?.link("team")?.href ?? project?.team;

    if (teamHref) {
        try {
            team = await fetchHalResource<Team>(teamHref, serverAuthProvider);
        } catch (e) {
            console.error("Failed to fetch project team:", e);
            teamError = `Could not load team information. ${parseErrorMessage(e)}`;
        }
    }

    const projectRoomHref = project?.link("projectRoom")?.href;

    if (projectRoomHref) {
        try {
            projectRoom = await fetchHalResource<ProjectRoom>(
                projectRoomHref,
                serverAuthProvider
            );
        } catch (e) {
            console.error("Failed to fetch project room:", e);
        }
    }

    if (projectRoom) {
        const judgeHref = projectRoom.link("managedByJudge")?.href;
        const panelistsHref = projectRoom.link("panelists")?.href;

        const [judgeResult, panelistsResult] = await Promise.allSettled([
            judgeHref
                ? fetchHalResource<Volunteer>(judgeHref, serverAuthProvider)
                : Promise.resolve(null),
            panelistsHref
                ? fetchHalCollection<Volunteer>(
                    panelistsHref,
                    serverAuthProvider,
                    "judges"
                )
                : Promise.resolve([]),
        ]);

        if (judgeResult.status === "fulfilled") {
            managedByJudge = judgeResult.value;
        } else {
            console.error("Failed to fetch managing judge:", judgeResult.reason);
        }

        if (panelistsResult.status === "fulfilled") {
            panelists = panelistsResult.value;
        } else {
            console.error("Failed to fetch panelists:", panelistsResult.reason);
        }
    }

    const editionHref = project?.link("edition")?.href ?? project?.edition;
    if (editionHref) {
        try {
            edition = await new EditionsService(serverAuthProvider).getEditionByUri(editionHref);
        } catch (e) {
            console.error("Failed to fetch project edition:", e);
        }
    }

    return (
        <PageShell
            eyebrow="Scientific Project"
            title={getProjectTitle(project, id)}
            description={
                project?.score !== undefined && project?.score !== null
                    ? `Score: ${project.score} pts`
                    : undefined
            }
            heroAside={
                project ? (
                    <div className="flex flex-col items-stretch gap-2">
                        <FavoriteActionButton
                            type="scientific-project"
                            id={String(id)}
                            label={getProjectTitle(project, id)}
                            href={`/scientific-projects/${id}`}
                        />

                        {isAdmin(currentUser) && isEditionActive(edition?.state) ? (
                            <Link
                                href={`/scientific-projects/${id}/edit`}
                                className={buttonVariants({ variant: "default", size: "sm" })}
                            >
                                Edit
                            </Link>
                        ) : null}
                    </div>
                ) : undefined
            }
        >
            <Breadcrumb
                items={[
                    { label: "Home", href: "/" },
                    { label: "Scientific Projects", href: "/scientific-projects" },
                    { label: getProjectTitle(project, id) },
                ]}
            />

            {projectError && <ErrorAlert message={projectError} />}

            {!projectError && project && (
                <div className="space-y-8">
                    <section aria-labelledby="project-info-heading">
                        <div className="mb-4 space-y-1">
                            <div className="page-eyebrow">Evaluation</div>
                            <h2 id="project-info-heading" className="section-title">
                                Project details
                            </h2>
                        </div>

                        <div className="rounded-lg border border-border bg-card p-5">
                            <div className="space-y-3">
                                {project.score !== undefined && project.score !== null && (
                                    <InfoRow label="Score" value={`${project.score} pts`} />
                                )}

                                {project.comments && (
                                    <InfoRow label="Comments" value={project.comments} />
                                )}
                            </div>

                            {!isEditionActive(edition?.state) && (
                                <div className="mt-5 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                                    This action is available only while the edition is active (OPEN).
                                </div>
                            )}

                            <ScientificProjectEvaluationEditor
                                projectId={id}
                                currentScore={project.score}
                                currentComments={project.comments}
                                canEdit={(isAdmin(currentUser) || isJudge(currentUser)) && isEditionActive(edition?.state)}
                            />
                        </div>
                    </section>

                    <section aria-labelledby="team-heading">
                        <div className="mb-4 space-y-1">
                            <div className="page-eyebrow">Participant</div>
                            <h2 id="team-heading" className="section-title">
                                Presenting team
                            </h2>
                        </div>

                        {teamError && <ErrorAlert message={teamError} />}

                        {!teamError && team && (
                            <TeamCard team={team} label="Presenting team" />
                        )}
                    </section>

                    <section aria-labelledby="room-heading">
                        <div className="mb-4 space-y-1">
                            <div className="page-eyebrow">Venue</div>
                            <h2 id="room-heading" className="section-title">
                                Evaluation room
                            </h2>
                        </div>

                        <div className="rounded-lg border border-border bg-card p-5">
                            {!projectRoom && (
                                <p className="text-sm text-muted-foreground">
                                    No evaluation room assigned.
                                </p>
                            )}

                            {projectRoom && (
                                <div className="space-y-3">
                                    {projectRoom.roomNumber && (
                                        <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
                                            <span className="min-w-36 text-sm font-medium text-foreground">
                                                Room
                                            </span>

                                            <Link
                                                href={`/evaluation-rooms/${projectRoom.roomNumber}`}
                                                className="text-sm font-medium text-accent hover:underline"
                                            >
                                                Room {projectRoom.roomNumber}
                                            </Link>
                                        </div>
                                    )}

                                    {managedByJudge && (
                                        <InfoRow
                                            label="Judge"
                                            value={
                                                managedByJudge.name
                                                ?? managedByJudge.emailAddress
                                                ?? "Unknown judge"
                                            }
                                        />
                                    )}

                                    {panelists.length > 0 && (
                                        <InfoRow
                                            label="Panelists"
                                            value={panelists
                                                .map((panelist) =>
                                                    panelist.name
                                                    ?? panelist.emailAddress
                                                    ?? "Unknown"
                                                )
                                                .join(", ")}
                                        />
                                    )}

                                    {!projectRoom.roomNumber
                                        && !managedByJudge
                                        && panelists.length === 0 && (
                                            <p className="text-sm text-muted-foreground">
                                                No room details available.
                                            </p>
                                        )}
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            )}
        </PageShell>
    );
}
