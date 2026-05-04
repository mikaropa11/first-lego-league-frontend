import { EditionsService } from "@/api/editionApi";
import { ScientificProjectsService } from "@/api/scientificProjectApi";
import { buttonVariants } from "@/app/components/button";
import EmptyState from "@/app/components/empty-state";
import ErrorAlert from "@/app/components/error-alert";
import PageShell from "@/app/components/page-shell";
import PaginationControls from "@/app/components/pagination-controls";
import ScientificProjectTeamSearch from "@/app/components/scientific-project-team-search";
import { serverAuthProvider } from "@/lib/authProvider";
import { getEncodedResourceId } from "@/lib/halRoute";
import { NotFoundError, parseErrorMessage } from "@/types/errors";
import type { HalPage } from "@/types/pagination";
import { ScientificProject } from "@/types/scientificProject";
import Link from "next/link";

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

const PAGE_SIZE = 5;

function getSingleParam(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value;
}

function getScientificProjectEditionId(project: ScientificProject) {
    const editionUri = project.edition ?? project.link("edition")?.href;
    return editionUri ? getEncodedResourceId(editionUri) : null;
}

export default async function ScientificProjectsPage({ searchParams }: Readonly<{ searchParams: PageSearchParams }>) {
    const params = await searchParams;
    const year = getSingleParam(params.year);
    const teamName = getSingleParam(params.teamName)?.trim();
    const yearQuery = year ? `?year=${year}` : "";
    const urlPage = Math.max(1, Number(params.page ?? "1") || 1);

    let projects: ScientificProject[] = [];
    let result: HalPage<ScientificProject> = { items: [], hasNext: false, hasPrev: false, currentPage: 0 };
    let error: string | null = null;
    const auth = await serverAuthProvider.getAuth();
    const isLoggedIn = !!auth;

    try {
        const service = new ScientificProjectsService(serverAuthProvider);

        if (teamName) {
            projects = await service.searchScientificProjectsByTeamName(teamName);
        }

        if (year) {
            const editionsService = new EditionsService(serverAuthProvider);
            let editionId: string | null = null;

            try {
                const edition = await editionsService.getEditionByYear(year);
                editionId = edition?.uri ? getEncodedResourceId(edition.uri) : null;
            } catch (editionError) {
                if (!(editionError instanceof NotFoundError)) {
                    throw editionError;
                }
            }

            if (editionId) {
                if (teamName) {
                    projects = projects.filter((project) => getScientificProjectEditionId(project) === editionId);
                } else {
                    projects = await service.getScientificProjectsByEdition(editionId);
                }
            } else {
                projects = [];
            }
        } else if (!teamName) {
            result = await service.getScientificProjectsPaged(urlPage - 1, PAGE_SIZE);
            projects = result.items;
        }
    } catch (e) {
        console.error("Failed to fetch scientific projects:", e);
        error = parseErrorMessage(e);
    }

    return (
        <PageShell
            eyebrow="Innovation project"
            title="Scientific Projects"
            description="Explore innovation projects linked to each FIRST LEGO League edition."
            heroAside={isLoggedIn ? (
                <Link href={`/scientific-projects/new${yearQuery}`} className={buttonVariants({ variant: "default", size: "sm" })}>
                    New Project
                </Link>
            ) : undefined}
        >
            <div className="space-y-6">
                <div className="space-y-3">
                    <div className="page-eyebrow">Project list</div>
                    <h2 className="section-title">Season projects overview</h2>
                    <p className="section-copy max-w-3xl">
                        Each card highlights the scientific project submitted by a team, including score and evaluation comments.
                    </p>
                    <ScientificProjectTeamSearch />
                </div>

                {error && <ErrorAlert message={error} />}

                {!error && projects.length === 0 && (
                    <EmptyState
                        title="No scientific projects found"
                        description={
                            teamName
                                ? `No scientific projects match "${teamName}".`
                                : "There are currently no scientific projects available to display."
                        }
                    />
                )}

                {!error && projects.length > 0 && (
                    <>
                        <div className="rounded-lg border border-border overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/50">
                                        <th className="px-5 py-3 text-left font-medium text-muted-foreground">Project</th>
                                        <th className="px-5 py-3 text-left font-medium text-muted-foreground">Score</th>
                                        <th className="px-5 py-3 text-left font-medium text-muted-foreground">Room</th>
                                        <th className="px-5 py-3 text-right font-medium text-muted-foreground">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projects.map((project, index) => {
                                        const resourceUri = project.uri ?? project.link("self")?.href;
                                        const id = resourceUri ? getEncodedResourceId(resourceUri) : null;
                                        
                                        const roomUri = project.link("projectRoom")?.href ?? project.link("room")?.href ?? project.room;
                                        const roomId = roomUri ? getEncodedResourceId(roomUri) : null;

                                        const title = project.comments || `Project #${index + 1}`;
                                        const score = project.score !== undefined && project.score !== null ? `${project.score} pts` : "—";

                                        return (
                                            <tr
                                                key={resourceUri ?? index}
                                                className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                                            >
                                                <td className="px-5 py-4 font-semibold text-foreground">
                                                    {title}
                                                </td>
                                                <td className="px-5 py-4 text-muted-foreground">
                                                    {score}
                                                </td>
                                                <td className="px-5 py-4 text-muted-foreground">
                                                    {roomId ? (
                                                        <Link href={`/project-rooms/${roomId}`} className="text-accent hover:underline">
                                                            {roomId}
                                                        </Link>
                                                    ) : (
                                                        "—"
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    {id ? (
                                                        <Link
                                                            href={`/scientific-projects/${id}`}
                                                            className="text-accent font-medium hover:underline"
                                                        >
                                                            View →
                                                        </Link>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {!year && !teamName && (
                            <PaginationControls
                                currentPage={urlPage}
                                hasNext={result.hasNext}
                                hasPrev={result.hasPrev}
                                basePath="/scientific-projects"
                            />
                        )}
                    </>
                )}
            </div>
        </PageShell>
    );
}
