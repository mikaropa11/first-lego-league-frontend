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
import { getServerTranslations } from "@/lib/i18n/server";
import type { Translations } from "@/lib/i18n";
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

function getScientificProjectTeamLabel(
  project: ScientificProject,
  t: Translations,
) {
  const inlineTeam = project.team?.trim();

  if (inlineTeam && !isResourceReference(inlineTeam)) {
    return inlineTeam;
  }

  const teamHref = project.link("team")?.href ?? inlineTeam;
  const teamId = teamHref ? getEncodedResourceId(teamHref) : null;

  return teamId
    ? `${t.scientificProjects.team} ${teamId}`
    : t.scientificProjects.teamPending;
}

function getProjectHeadline(
  project: ScientificProject,
  index: number,
  t: Translations,
) {
  const rawComments = project.comments?.trim();

  if (!rawName && !rawComments) {
    return {
      title: `${t.scientificProjects.project} ${index + 1}`,
      summary: null,
    };
  }

  const sections = rawComments
    .split(/\n\s*\n/)
    .map((section) => section.trim())
    .filter(Boolean);

  const title =
     rawName || sections[0] || `${t.scientificProjects.project} ${index + 1}`;

  const summary = sections
    .slice(1)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

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

function getProjectStatusLabel(
  tone: ProjectCardTone,
  t: Translations,
) {
  switch (tone) {
    case "evaluated":
      return t.scientificProjects.evaluated;

    case "assigned":
      return t.scientificProjects.roomAssigned;

    default:
      return t.scientificProjects.pendingReview;
  }
}

function getProjectScoreLabel(
  project: ScientificProject,
  t: Translations,
) {
  if (project.score === undefined || project.score === null) {
    return t.scientificProjects.awaitingScore;
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

function formatAverageScore(
  averageScore: number | null,
  t: Translations,
) {
  if (averageScore === null) {
    return t.scientificProjects.noScoresYet;
  }

  return `${averageScoreFormatter.format(averageScore)} pts ${t.scientificProjects.average}`;
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
  t,
}: Readonly<{
  project: ScientificProject;
  index: number;
  t: Translations;
}>) {
  const tone = getProjectTone(project);

  const statusLabel = getProjectStatusLabel(tone, t);

  const teamLabel = getScientificProjectTeamLabel(project, t);

  const roomId = getScientificProjectRoomId(project);

  const projectId = getScientificProjectHref(project);

  const { title, summary } = getProjectHeadline(project, index, t);

  const cardContent = (
    <article
      className="scientific-projects-page-project-card"
      data-status={tone}
    >
      <div className="scientific-projects-page-project-card__body">
        <div className="scientific-projects-page-project-card__masthead">
          <div className="scientific-projects-page-project-card__serial">
            {t.scientificProjects.project}{" "}
            {String(index + 1).padStart(2, "0")}
          </div>

          <div className="scientific-projects-page-project-card__badge">
            {statusLabel}
          </div>
        </div>

        <div className="scientific-projects-page-project-card__header">
          <div className="scientific-projects-page-project-card__kicker">
            {t.scientificProjects.scientificProject}
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
              {t.scientificProjects.score}
            </div>

            <div className="scientific-projects-page-project-card__fact-value">
              {getProjectScoreLabel(project, t)}
            </div>
          </div>

          <div className="scientific-projects-page-project-card__fact">
            <div className="scientific-projects-page-project-card__fact-label">
              {t.scientificProjects.room}
            </div>

            <div className="scientific-projects-page-project-card__fact-value">
              {roomId
                ? `${t.scientificProjects.room} ${roomId}`
                : t.scientificProjects.pendingAssignment}
            </div>
          </div>
        </div>

        <div className="scientific-projects-page-project-card__team">
          <div className="scientific-projects-page-project-card__team-label">
            {t.scientificProjects.presentingTeam}
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
            {projectId
              ? t.scientificProjects.viewDetails
              : t.scientificProjects.detailsUnavailable}

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
  const t = await getServerTranslations();

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

        editionId = edition?.uri
          ? getEncodedResourceId(edition.uri)
          : null;
      } catch (editionError) {
        if (!(editionError instanceof NotFoundError)) {
          throw editionError;
        }
      }

      if (editionId) {
        if (teamName) {
          projects = projects.filter(
            (project) =>
              getScientificProjectEditionId(project) === editionId,
          );
        } else {
          projects =
            await service.getScientificProjectsByEdition(editionId);
        }
      } else {
        projects = [];
      }
    } else if (!teamName) {
      result = await service.getScientificProjectsPaged(
        urlPage - 1,
        PAGE_SIZE,
      );

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
      eyebrow={t.scientificProjects.innovationProjects}
      title={t.scientificProjects.title}
      description={t.scientificProjects.description}
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
              {t.scientificProjects.newProject}
            </span>

            <ArrowUpRight aria-hidden="true" />
          </Link>
        ) : undefined
      }
    >
      <div className="scientific-projects-page-content">
        <section className="scientific-projects-page-search-shell">
          <div className="scientific-projects-page-search-copy">
            <div className="page-eyebrow">
              {t.scientificProjects.projectList}
            </div>

            <h2 className="section-title">
              {t.scientificProjects.seasonOverview}
            </h2>

            <p className="section-copy scientific-projects-page-search-description">
              {t.scientificProjects.searchDescription}
            </p>

            {hasActiveFilters && (
              <div className="scientific-projects-page-filter-chips">
                {year && (
                  <span className="scientific-projects-page-filter-chip">
                    {t.scientificProjects.edition} {year}
                  </span>
                )}

                {teamName && (
                  <span className="scientific-projects-page-filter-chip">
                    {t.scientificProjects.team}: {teamName}
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
            title={t.scientificProjects.noProjects}
            description={
              teamName
                ? t.scientificProjects.noProjectsMatch.replace(
                    "{teamName}",
                    teamName,
                  )
                : t.scientificProjects.noProjectsAvailable
            }
          />
        )}

        {!error && projects.length > 0 && (
          <>
            <div className="scientific-projects-page-stats-grid">
              <StatCard
                icon={FlaskConical}
                label={t.scientificProjects.projectsInView}
                value={String(totalCount)}
                description={
                  hasActiveFilters
                    ? t.scientificProjects.projectsFiltered
                    : t.scientificProjects.projectsDirectory
                }
              />

              <StatCard
                icon={ClipboardCheck}
                label={t.scientificProjects.evaluatedProjects}
                value={String(evaluatedCount)}
                description={
                  evaluatedCount > 0
                    ? `${formatAverageScore(
                        averageScore,
                        t,
                      )} ${t.scientificProjects.with} ${pendingCount} ${t.scientificProjects.projectsPending}`
                    : t.scientificProjects.noProjectsScored
                }
              />

              <StatCard
                icon={DoorOpen}
                label={t.scientificProjects.roomsAssigned}
                value={String(assignedRoomCount)}
                description={
                  assignedRoomCount > 0
                    ? `${assignedRoomCount} ${t.scientificProjects.projectsLinked}`
                    : t.scientificProjects.roomsNotPublished
                }
              />
            </div>

            <ul className="scientific-projects-page-grid">
              {projects.map((project, index) => {
                const resourceUri =
                  project.uri ?? project.link("self")?.href;

                return (
                  <li
                    key={resourceUri ?? `scientific-project-${index}`}
                    className="scientific-projects-page-item"
                  >
                    <ProjectCard
                      project={project}
                      index={index}
                      t={t}
                    />
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
                  contextLabel={t.scientificProjects.paginationLabel}
                />
              </div>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}
