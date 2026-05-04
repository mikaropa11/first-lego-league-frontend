import { EditionsService } from "@/api/editionApi";
import { TeamsService } from "@/api/teamApi";
import { UsersService } from "@/api/userApi";
import { buttonVariants } from "@/app/components/button";
import EmptyState from "@/app/components/empty-state";
import ErrorAlert from "@/app/components/error-alert";
import PageShell from "@/app/components/page-shell";
import PaginationControls from "@/app/components/pagination-controls";
import { serverAuthProvider } from "@/lib/authProvider";
import { isAdmin } from "@/lib/authz";
import { getEncodedResourceId } from "@/lib/halRoute";
import { cn } from "@/lib/utils";
import { ApiError, AuthenticationError, parseErrorMessage } from "@/types/errors";
import type { HalPage } from "@/types/pagination";
import { Team } from "@/types/team";
import { User } from "@/types/user";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, Building2, MapPin, Trophy } from "lucide-react";
import Link from "next/link";
import TeamListClient, { type TeamListItem } from "./team-list-client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 6;

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

interface TeamStats {
  readonly challengeCount: number;
  readonly exploreCount: number;
  readonly citiesCount: number;
  readonly centersCount: number;
  readonly categoriesCount: number;
}

interface TeamsLoadResult {
  readonly teams: Team[];
  readonly result: HalPage<Team>;
}

const emptyTeamsPage: HalPage<Team> = {
  items: [],
  hasNext: false,
  hasPrev: false,
  currentPage: 0,
};

function getTeamErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return parseErrorMessage(error);
  }

  if (error instanceof Error) {
    return error.message;
  }

  return parseErrorMessage(error);
}

function getUniqueValueCount(values: Array<string | null | undefined>) {
  return new Set(
    values
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value)),
  ).size;
}

async function loadCurrentUser() {
  try {
    return await new UsersService(serverAuthProvider).getCurrentUser();
  } catch (error) {
    if (
      error instanceof AuthenticationError ||
      (error instanceof ApiError && error.statusCode === 403)
    ) {
      console.warn(
        "Current user is not authorized to access admin actions on the teams page.",
      );
    } else {
      console.error("Failed to fetch current user on the teams page:", error);
    }

    return null;
  }
}

async function loadTeamsByEdition(year: string) {
  const teamsService = new TeamsService(serverAuthProvider);
  const editionsService = new EditionsService(serverAuthProvider);
  const edition = await editionsService.getEditionByYear(year);

  if (!edition?.uri) {
    return [];
  }

  return teamsService.getTeamsByEdition(`${edition.uri}/teams`);
}

async function loadPagedTeams(urlPage: number) {
  const teamsService = new TeamsService(serverAuthProvider);
  return teamsService.getTeamsPaged(urlPage - 1, PAGE_SIZE);
}

async function loadTeams(year: string | undefined, urlPage: number): Promise<TeamsLoadResult> {
  if (year) {
    const teams = await loadTeamsByEdition(year);

    return {
      teams,
      result: emptyTeamsPage,
    };
  }

  const result = await loadPagedTeams(urlPage);

  return {
    teams: result.items,
    result,
  };
}

function getTeamStats(teams: Team[]): TeamStats {
  return {
    challengeCount: teams.filter((team) => team.category === "CHALLENGE").length,
    exploreCount: teams.filter((team) => team.category === "EXPLORE").length,
    citiesCount: getUniqueValueCount(teams.map((team) => team.city)),
    centersCount: getUniqueValueCount(
      teams.map((team) => team.educationalCenter),
    ),
    categoriesCount: getUniqueValueCount(teams.map((team) => team.category)),
  };
}

function mapTeamsToListItems(teams: Team[], yearQuery: string): TeamListItem[] {
  return teams.map((team, index) => {
    const teamId = getEncodedResourceId(team.uri);
    const href = teamId ? `/teams/${teamId}${yearQuery}` : null;

    return {
      key: team.uri ?? team.id ?? `team-${index}`,
      href,
      name: team.name ?? team.id ?? "Unnamed team",
      category: team.category,
      city: team.city,
      educationalCenter: team.educationalCenter ?? undefined,
      foundationYear: team.foundationYear,
      inscriptionDate: team.inscriptionDate,
    };
  });
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
    <div className="teams-page-stat-card">
      <div className="teams-page-stat-card__inner">
        <div className="teams-page-stat-card__header">
          <div className="teams-page-stat-card__copy">
            <div className="teams-page-stat-card__label">{label}</div>
            <div className="teams-page-stat-card__value">{value}</div>
          </div>
          <div className="teams-page-stat-card__icon">
            <Icon aria-hidden="true" />
          </div>
        </div>
        <p className="teams-page-stat-card__description">{description}</p>
      </div>
    </div>
  );
}

export default async function TeamsPage({
  searchParams,
}: Readonly<{ searchParams: PageSearchParams }>) {
  const params = await searchParams;
  const yearParam = params.year;
  const year = Array.isArray(yearParam) ? yearParam[0] : yearParam;
  const yearQuery = year ? `?year=${year}` : "";
  const urlPage = Math.max(1, Number(params.page ?? "1") || 1);

  const currentUser: User | null = await loadCurrentUser();

  let teams: Team[] = [];
  let result: HalPage<Team> = emptyTeamsPage;
  let error: string | null = null;

  try {
    const loadedTeams = await loadTeams(year, urlPage);

    teams = loadedTeams.teams;
    result = loadedTeams.result;
  } catch (e) {
    console.error("Failed to fetch teams:", e);
    error = getTeamErrorMessage(e);
  }

  const {
    challengeCount,
    exploreCount,
    citiesCount,
    centersCount,
    categoriesCount,
  } = getTeamStats(teams);

  const teamListItems = mapTeamsToListItems(teams, yearQuery);

  return (
    <PageShell
      eyebrow="Team management"
      title="Teams"
      description="Browse the teams currently registered in the FIRST LEGO League platform."
      bannerClassName="teams-page-banner"
      panelClassName="teams-page-panel"
      heroAside={
        isAdmin(currentUser) ? (
          <Link
            href="/teams/new"
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "teams-page-create-button",
            )}
          >
            <span className="teams-page-create-button__label">
              Create new team
            </span>
            <ArrowUpRight aria-hidden="true" />
          </Link>
        ) : undefined
      }
    >
      <div className="teams-page-content">
        {error && <ErrorAlert message={error} />}

        {!error && teams.length === 0 && (
          <EmptyState
            title="No teams found"
            description="There are currently no teams available to display."
          />
        )}

        {!error && teams.length > 0 && (
          <>
            {/* Las animaciones visuales de esta pagina estan marcadas en src/css/teams-list.css */}
            <div className="teams-page-stats-grid">
              <StatCard
                icon={MapPin}
                label="Cities represented"
                value={String(citiesCount)}
                description={
                  citiesCount > 0
                    ? "A broader geographic footprint is visible."
                    : "City information is not available for the current teams."
                }
              />

              <StatCard
                icon={Building2}
                label="Schools and centers"
                value={String(centersCount)}
                description={
                  centersCount > 0
                    ? "Educational institutions linked to the roster."
                    : "No educational center has been registered yet."
                }
              />

              <StatCard
                icon={Trophy}
                label="Categories active"
                value={String(categoriesCount)}
                description={
                  categoriesCount > 0
                    ? `${challengeCount} Challenge and ${exploreCount} Explore teams in the current view.`
                    : "Teams do not include category metadata yet."
                }
              />
            </div>

            <TeamListClient teams={teamListItems} />

            {!year && (
              <div className="teams-page-pagination">
                <PaginationControls
                  currentPage={urlPage}
                  hasNext={result.hasNext}
                  hasPrev={result.hasPrev}
                  basePath="/teams"
                  variant="editorial"
                  contextLabel=""
                />
              </div>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}
