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
import { cn } from "@/lib/utils";
import { NotFoundError, parseErrorMessage } from "@/types/errors";
import type { HalPage } from "@/types/pagination";
import { ScientificProject } from "@/types/scientificProject";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  ClipboardCheck,
  DoorOpen,
  FlaskConical,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;
type ProjectCardTone = "assigned" | "evaluated" | "pending";

const PAGE_SIZE = 5;

const emptyProjectsPage: HalPage<ScientificProject> = {
  items: [],
  hasNext: false,
  hasPrev: false,
  currentPage: 0,
};

const averageScoreFormatter = new Intl.NumberFormat("en", {
  maximumFractionDigits: 1,
});

interface ProjectStats {
  readonly totalCount: number;
  readonly evaluatedCount: number;
  readonly assignedRoomCount: number;
  readonly pendingCount: number;
  readonly averageScore: number | null;
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getScientificProjectEditionId(project: ScientificProject) {
  const editionUri = project.edition ?? project.link("edition")?.href;
  return editionUri ? getEncodedResourceId(editionUri) : null;
}

function isResourceReference(value: string | null | undefined) {
  if (!value) return false;

  return value.startsWith("/") || value.startsWith("http");
}

function getScientificProjectHref(project: ScientificProject) {
  const resourceUri = project.uri ?? project.link("self")?.href;
  return resourceUri ? getEncodedResourceId(resourceUri) : null;
}

function getScientificProjectRoomId(project: ScientificProject) {
  const roomUri =
    project.link("projectRoom")?.href ??
    project.link("room")?.href ??
    project.room;

  return roomUri ? getEncodedResourceId(roomUri) : null;
}

function getScientificProjectTeamLabel(project: ScientificProject) {
  const inlineTeam = project.team?.trim();

  if (inlineTeam && !isResourceReference(inlineTeam)) {
    return inlineTeam;
  }

  const teamHref = project.link("team")?.href ?? inlineTeam;
  const teamId = teamHref ? getEncodedResourceId(teamHref) : null;

  return teamId ? `Team ${teamId}` : "Team pending";
}

function getProjectHeadline(project: ScientificProject, index: number) {
  const rawName = project.name?.trim();
  const rawComments = project.comments?.trim();

  if (!rawName && !rawComments) {
    return {
      title: `Project ${index + 1}`,
      summary: null,
    };
  }

  const sections = rawComments
    .split(/\n\s*\n/)
    .map((section) => section.trim())
    .filter(Boolean);

  const title = rawName || sections[0] || `Project ${index + 1}`;
  const summary = sections.slice(1).join(" ").replace(/\s+/g, " ").trim();

  return {
    title,
    summary: summary.length > 0 ? truncateText(summary, 180) : null,
  };
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function getProjectTone(project: ScientificProject): ProjectCardTone {
  if (project.score !== undefined && project.score !== null) {
    return "evaluated";
  }

  if (getScientificProjectRoomId(project)) {
    return "assigned";
  }

  return "pending";
}

function getProjectStatusLabel(tone: ProjectCardTone) {
  switch (tone) {
    case "evaluated":
      return "Evaluated";
    case "assigned":
      return "Room assigned";
    default:
      return "Pending review";
  }
}

function getProjectScoreLabel(project: ScientificProject) {
  if (project.score === undefined || project.score === null) {
    return "Awaiting score";
  }

  return `${project.score} pts`;
}

function getProjectStats(projects: ScientificProject[]): ProjectStats {
  const scoredProjects = projects.filter(
    (project) => project.score !== undefined && project.score !== null,
  );
  const assignedRoomCount = projects.filter((project) =>
    Boolean(getScientificProjectRoomId(project)),
  ).length;
  const totalScore = scoredProjects.reduce(
    (sum, project) => sum + (project.score ?? 0),
    0,
  );

  return {
    totalCount: projects.length,
    evaluatedCount: scoredProjects.length,
    assignedRoomCount,
    pendingCount: Math.max(0, projects.length - scoredProjects.length),
    averageScore:
      scoredProjects.length > 0 ? totalScore / scoredProjects.length : null,
  };
}

function formatAverageScore(averageScore: number | null) {
  if (averageScore === null) {
    return "No scores yet";
  }

  return `${averageScoreFormatter.format(averageScore)} pts average`;
}

function StatCard({
  icon: Icon,
  label,
  value,
  description,
}: Readonly<{
  icon: LucideIcon;
  label: string;
  value: string;
  description: string;
}>) {
  return (
    <div className="scientific-projects-page-stat-card">
      <div className="scientific-projects-page-stat-card__inner">
        <div className="scientific-projects-page-stat-card__header">
          <div className="scientific-projects-page-stat-card__copy">
            <div className="scientific-projects-page-stat-card__label">
              {label}
            </div>
            <div className="scientific-projects-page-stat-card__value">
              {value}
            </div>
          </div>
          <div className="scientific-projects-page-stat-card__icon">
            <Icon aria-hidden="true" />
          </div>
        </div>
        <p className="scientific-projects-page-stat-card__description">
          {description}
        </p>
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  index,
}: Readonly<{
  project: ScientificProject;
  index: number;
}>) {
  const tone = getProjectTone(project);
  const statusLabel = getProjectStatusLabel(tone);
  const teamLabel = getScientificProjectTeamLabel(project);
  const roomId = getScientificProjectRoomId(project);
  const projectId = getScientificProjectHref(project);
  const { title, summary } = getProjectHeadline(project, index);
  const cardContent = (
    <article
      className="scientific-projects-page-project-card"
      data-status={tone}
    >
      <div className="scientific-projects-page-project-card__body">
        <div className="scientific-projects-page-project-card__masthead">
          <div className="scientific-projects-page-project-card__serial">
            Project {String(index + 1).padStart(2, "0")}
          </div>
          <div className="scientific-projects-page-project-card__badge">
            {statusLabel}
          </div>
        </div>

        <div className="scientific-projects-page-project-card__header">
          <div className="scientific-projects-page-project-card__kicker">
            Scientific project
          </div>
          <h3 className="scientific-projects-page-project-card__title">
            {title}
          </h3>
          {summary && (
            <p className="scientific-projects-page-project-card__summary">
              {summary}
            </p>
          )}
        </div>

        <div className="scientific-projects-page-project-card__facts">
          <div className="scientific-projects-page-project-card__fact">
            <div className="scientific-projects-page-project-card__fact-label">
              Score
            </div>
            <div className="scientific-projects-page-project-card__fact-value">
              {getProjectScoreLabel(project)}
            </div>
          </div>

          <div className="scientific-projects-page-project-card__fact">
            <div className="scientific-projects-page-project-card__fact-label">
              Room
            </div>
            <div className="scientific-projects-page-project-card__fact-value">
              {roomId ? `Room ${roomId}` : "Pending assignment"}
            </div>
          </div>
        </div>

        <div className="scientific-projects-page-project-card__team">
          <div className="scientific-projects-page-project-card__team-label">
            Presenting team
          </div>
          <p className="scientific-projects-page-project-card__team-value">
            {teamLabel}
          </p>
        </div>

        <div className="scientific-projects-page-project-card__footer">
          <div
            className={
              projectId
                ? "scientific-projects-page-project-card__action scientific-projects-page-project-card__action--interactive"
                : "scientific-projects-page-project-card__action scientific-projects-page-project-card__action--disabled"
            }
          >
            {projectId ? "View details" : "Details unavailable"}
            {projectId && <ArrowUpRight aria-hidden="true" />}
          </div>
        </div>
      </div>
    </article>
  );

  return projectId ? (
    <Link
      href={`/scientific-projects/${projectId}`}
      className="scientific-projects-page-link"
    >
      {cardContent}
    </Link>
  ) : (
    <div className="scientific-projects-page-link">{cardContent}</div>
  );
}

export default async function ScientificProjectsPage({
  searchParams,
}: Readonly<{ searchParams: PageSearchParams }>) {
  const params = await searchParams;
  const year = getSingleParam(params.year);
  const teamName = getSingleParam(params.teamName)?.trim();
  const yearQuery = year ? `?year=${year}` : "";
  const urlPage = Math.max(1, Number(params.page ?? "1") || 1);
  const hasActiveFilters = Boolean(year || teamName);

  let projects: ScientificProject[] = [];
  let result: HalPage<ScientificProject> = emptyProjectsPage;
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
          projects = projects.filter(
            (project) => getScientificProjectEditionId(project) === editionId,
          );
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

  const {
    totalCount,
    evaluatedCount,
    assignedRoomCount,
    pendingCount,
    averageScore,
  } = getProjectStats(projects);

  return (
    <PageShell
      eyebrow="Innovation projects"
      title="Scientific Projects"
      description="Browse the innovation work submitted across FIRST LEGO League editions."
      bannerClassName="scientific-projects-page-banner"
      panelClassName="scientific-projects-page-panel"
      heroAside={
        isLoggedIn ? (
          <Link
            href={`/scientific-projects/new${yearQuery}`}
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "scientific-projects-page-create-button",
            )}
          >
            <span className="scientific-projects-page-create-button__label">
              New project
            </span>
            <ArrowUpRight aria-hidden="true" />
          </Link>
        ) : undefined
      }
    >
      <div className="scientific-projects-page-content">
        <section className="scientific-projects-page-search-shell">
          <div className="scientific-projects-page-search-copy">
            <div className="page-eyebrow">Project list</div>
            <h2 className="section-title">Season project overview</h2>
            <p className="section-copy scientific-projects-page-search-description">
              Search by team, keep seasonal filters in view, and move through
              project evaluations.
            </p>

            {hasActiveFilters && (
              <div className="scientific-projects-page-filter-chips">
                {year && (
                  <span className="scientific-projects-page-filter-chip">
                    Edition {year}
                  </span>
                )}
                {teamName && (
                  <span className="scientific-projects-page-filter-chip">
                    Team: {teamName}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="scientific-projects-page-search">
            <ScientificProjectTeamSearch />
          </div>
        </section>

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
            <div className="scientific-projects-page-stats-grid">
              <StatCard
                icon={FlaskConical}
                label="Projects in view"
                value={String(totalCount)}
                description={
                  hasActiveFilters
                    ? "The current roster reflects the active filters and search criteria."
                    : "A live slice of the scientific projects directory for this page."
                }
              />

              <StatCard
                icon={ClipboardCheck}
                label="Evaluated projects"
                value={String(evaluatedCount)}
                description={
                  evaluatedCount > 0
                    ? `${formatAverageScore(averageScore)} with ${pendingCount} project${pendingCount === 1 ? "" : "s"} still pending review.`
                    : "No project on this page has received a score yet."
                }
              />

              <StatCard
                icon={DoorOpen}
                label="Rooms assigned"
                value={String(assignedRoomCount)}
                description={
                  assignedRoomCount > 0
                    ? `${assignedRoomCount} project${assignedRoomCount === 1 ? "" : "s"} already linked to an evaluation room.`
                    : "Room assignments have not been published for the current selection."
                }
              />
            </div>

            <ul className="scientific-projects-page-grid">
              {projects.map((project, index) => {
                const resourceUri = project.uri ?? project.link("self")?.href;

                return (
                  <li
                    key={resourceUri ?? `scientific-project-${index}`}
                    className="scientific-projects-page-item"
                  >
                    <ProjectCard project={project} index={index} />
                  </li>
                );
              })}
            </ul>

            {!year && !teamName && (
              <div className="scientific-projects-page-pagination">
                <PaginationControls
                  currentPage={urlPage}
                  hasNext={result.hasNext}
                  hasPrev={result.hasPrev}
                  basePath="/scientific-projects"
                  variant="editorial"
                  contextLabel="Move through the project directory page by page."
                />
              </div>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}
