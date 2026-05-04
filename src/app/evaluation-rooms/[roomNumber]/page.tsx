import { ProjectRoomsService } from "@/api/projectRoomApi";
import { UsersService } from "@/api/userApi";
import { fetchHalCollection, mergeHalArray } from "@/api/halClient";
import ErrorAlert from "@/app/components/error-alert";
import EmptyState from "@/app/components/empty-state";
import PageShell from "@/app/components/page-shell";
import { buttonVariants } from "@/app/components/button";
import { serverAuthProvider } from "@/lib/authProvider";
import { getEncodedResourceId } from "@/lib/halRoute";
import { isAdmin, isJudge } from "@/lib/authz";
import type { ProjectRoom } from "@/types/projectRoom";
import type { ScientificProject } from "@/types/scientificProject";
import { NotFoundError, parseErrorMessage } from "@/types/errors";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface EvaluationRoomPageProps {
    readonly params: Promise<{ roomNumber: string }>;
}

function getProjectHref(project: ScientificProject): string | null {
    const projectUri = project.uri ?? project.link("self")?.href;
    const projectId = getEncodedResourceId(projectUri);

    return projectId ? `/scientific-projects/${projectId}` : null;
}

function getProjectStatus(project: ScientificProject): "Evaluated" | "Pending" {
    return project.score !== undefined && project.score !== null
        ? "Evaluated"
        : "Pending";
}

function getTeamLabel(project: ScientificProject, index: number): string {
    const teamUri = project.team ?? project.link("team")?.href;
    const teamId = getEncodedResourceId(teamUri);

    return teamId ? `Team ${teamId}` : `Team ${index + 1}`;
}

async function getProjectsForRoom(room: ProjectRoom): Promise<ScientificProject[]> {
    const embeddedProjects = room.embeddedArray("scientificProjects");

    if (embeddedProjects && embeddedProjects.length > 0) {
        return mergeHalArray<ScientificProject>(embeddedProjects);
    }

    const projectsHref = room.link("scientificProjects")?.href;

    if (!projectsHref) {
        return [];
    }

    return fetchHalCollection<ScientificProject>(
        projectsHref,
        serverAuthProvider,
        "scientificProjects"
    );
}

export default async function EvaluationRoomPage(
    props: Readonly<EvaluationRoomPageProps>
) {
    const { roomNumber } = await props.params;

    const usersService = new UsersService(serverAuthProvider);
    const roomsService = new ProjectRoomsService(serverAuthProvider);

    const currentUser = await usersService.getCurrentUser().catch(() => null);

    if (!currentUser) {
        redirect("/login");
    }

    if (!isAdmin(currentUser) && !isJudge(currentUser)) {
        redirect("/");
    }

    let room: ProjectRoom | null = null;
    let projects: ScientificProject[] = [];
    let error: string | null = null;

    try {
        room = await roomsService.getProjectRoomByRoomNumber(roomNumber);

        if (!room) {
            throw new NotFoundError("This evaluation room does not exist.");
        }

        projects = await getProjectsForRoom(room);
    } catch (e) {
        console.error("Failed to fetch evaluation room:", e);
        error = e instanceof NotFoundError
            ? "This evaluation room does not exist."
            : `Could not load evaluation room. ${parseErrorMessage(e)}`;
    }

    return (
        <PageShell
            eyebrow="Judging"
            title={`Evaluation Room ${roomNumber}`}
            description="Scientific projects assigned to this room for judge evaluation."
        >
            {error && <ErrorAlert message={error} />}

            {!error && room && (
                <div className="space-y-6">
                    {projects.length === 0 && (
                        <EmptyState
                            title="No projects assigned"
                            description="There are no scientific projects assigned to this evaluation room yet."
                        />
                    )}

                    {projects.length > 0 && (
                        <ul className="space-y-3">
                            {projects.map((project, index) => {
                                const href = getProjectHref(project);
                                const status = getProjectStatus(project);

                                return (
                                    <li
                                        key={project.uri ?? index}
                                        className="rounded-lg border border-border bg-card p-5"
                                    >
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="space-y-2">
                                                <div className="page-eyebrow">
                                                    Scientific Project #{index + 1}
                                                </div>

                                                <h2 className="text-lg font-semibold text-foreground">
                                                    {getTeamLabel(project, index)}
                                                </h2>

                                                <span
                                                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                                                        status === "Evaluated"
                                                            ? "border-green-200 bg-green-100 text-green-700"
                                                            : "border-zinc-200 bg-zinc-100 text-zinc-700"
                                                    }`}
                                                >
                                                    {status}
                                                </span>

                                                {project.score !== undefined && project.score !== null && (
                                                    <p className="text-sm text-muted-foreground">
                                                        Score: {project.score} pts
                                                    </p>
                                                )}
                                            </div>

                                            {href && (
                                                <Link
                                                    href={href}
                                                    className={buttonVariants({
                                                        variant: "default",
                                                        size: "sm",
                                                    })}
                                                >
                                                    Open evaluation
                                                </Link>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            )}
        </PageShell>
    );
}
