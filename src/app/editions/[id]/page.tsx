import { AwardsService } from "@/api/awardApi";
import { EditionsService } from "@/api/editionApi";
import { LeaderboardService } from "@/api/leaderboardApi";
import { MediaService } from "@/api/mediaApi";
import { UsersService } from "@/api/userApi";
import FavoriteActionButton from "@/app/components/favorite-action-button";
import { buttonVariants } from "@/app/components/button";
import EmptyState from "@/app/components/empty-state";
import ErrorAlert from "@/app/components/error-alert";
import { Breadcrumb } from "@/app/components/breadcrumb";
import LeaderboardTable from "@/app/components/leaderboard-table";
import { MediaItem } from "@/app/components/media-gallery";
import { MediaSection } from "@/app/components/media-section";
import MediaUploadForm from "@/app/components/media-upload-form";
import { serverAuthProvider } from "@/lib/authProvider";
import { getAwardWinnerTeamUri, normalizeUri } from "@/lib/awardUtils";
import { isAdmin } from "@/lib/authz";
import { getEncodedResourceId } from "@/lib/halRoute";
import { getTeamDisplayName } from "@/lib/teamUtils";
import { Award } from "@/types/award";
import { Round } from "@/types/round";
import { Edition } from "@/types/edition";
import { NotFoundError, parseErrorMessage } from "@/types/errors";
import type { LeaderboardItem } from "@/types/leaderboard";
import { MediaContent } from "@/types/mediaContent";
import { Team } from "@/types/team";
import { User } from "@/types/user";
import Link from "next/link";
import { redirect } from "next/navigation";
import DeleteEditionButton from "./delete-edition-button";
import AwardSection from "./_award-section";
import RoundsManager from "./rounds-manager";
import { RoundsService } from "@/api/roundsApi";
import EditionStateControls from "./edition-state-controls";
import { isEditionFinished } from "@/lib/editionStateGuards";


interface EditionDetailPageProps {
    readonly params: Promise<{ id: string }>;
}

interface EditionOption {
    readonly uri?: string;
    readonly year?: number;
    readonly venueName?: string;
}

function getTeamHref(team: Team): string | null {
    const teamId = getEncodedResourceId(team.uri);
    return teamId ? `/teams/${teamId}` : null;
}

function getTeamUri(team: Team): string | null {
    return team.link("self")?.href ?? team.uri ?? null;
}

function getAwardResourceUri(award: Award): string | null {
    return award.uri ?? award.link("self")?.href ?? null;
}

function getTeamAwards(team: Team, awards: Award[]): Award[] {
    const teamUri = normalizeUri(getTeamUri(team));

    if (!teamUri) {
        return [];
    }

    return awards.filter((award) => normalizeUri(getAwardWinnerTeamUri(award)) === teamUri);
}

function getEditionTitle(edition: Edition | null, id: string) {
    if (edition?.year) {
        return `${edition.year}`;
    }

    return `Edition ${id}`;
}

interface EditionUriData {
    awards: Award[]; 
    mediaContents: MediaContent[];
    awardsError: string | null;
    mediaError: string | null;
}

async function fetchByEditionUri(
    editionUri: string,
    awardsService: AwardsService,
    mediaService: MediaService,
): Promise<EditionUriData> {
    const result: EditionUriData = {
        awards: [],
        mediaContents: [],
        awardsError: null,
        mediaError: null,
    };

    try {
        result.awards = await awardsService.getAwardsOfEdition(editionUri);
    } catch (e) {
        console.error("Failed to fetch awards:", e);
        result.awardsError = parseErrorMessage(e);
    }

    try {
        result.mediaContents = await mediaService.getMediaByEdition(editionUri);
    } catch (e) {
        console.error("Failed to fetch media:", e);
        result.mediaError = parseErrorMessage(e);
    }

    return result;
}

function toMediaItem(content: MediaContent, editionUri: string | null | undefined): MediaItem {
    return {
        uri: content.uri ?? content.link?.("self")?.href,
        id: content.id,
        type: content.type,
        url: content.url ?? content.id,
        edition: editionUri ?? content.edition,
    };
}

export default async function EditionDetailPage(props: Readonly<EditionDetailPageProps>) {
    const { id } = await props.params;

    async function deleteEditionAction() {
        "use server";

        await new EditionsService(serverAuthProvider).deleteEdition(id);
        redirect("/editions");
    }

    const editionsService = new EditionsService(serverAuthProvider);
    const awardsService = new AwardsService(serverAuthProvider);
    const mediaService = new MediaService(serverAuthProvider);

    let currentUser: User | null = null;
    let edition: Edition | null = null;
    let teams: Team[] = [];
    let awards: Award[] = [];
    let editions: EditionOption[] = [];
    let mediaContents: MediaContent[] = [];
    let leaderboardItems: LeaderboardItem[] = [];
    let rounds: Round[] = [];
    let error: string | null = null;
    let teamsError: string | null = null;
    let awardsError: string | null = null;
    let mediaError: string | null = null;
    let classificationError: string | null = null;
    let roundsError: string | null = null;

    try {
        edition = await editionsService.getEditionById(id);
    } catch (e) {
        console.error("Failed to fetch edition:", e);
        error = e instanceof NotFoundError
            ? "This edition does not exist."
            : parseErrorMessage(e);
    }

    try {
        currentUser = await new UsersService(serverAuthProvider).getCurrentUser();
    } catch (e) {
        console.error("Failed to fetch current user:", e);
    }

    if (edition && !error) {
        try {
            teams = await editionsService.getEditionTeams(id);
        } catch (e) {
            console.error("Failed to fetch teams:", e);
            teamsError = parseErrorMessage(e);
        }

        if (edition.uri) {
            ({ awards, mediaContents, awardsError, mediaError } = await fetchByEditionUri(
                edition.uri,
                awardsService,
                mediaService,
            ));
        }

        if (currentUser && isAdmin(currentUser)) {
            try {
                editions = (await editionsService.getEditions()).map((item) => ({
                    uri: item.uri,
                    year: item.year,
                    venueName: item.venueName,
                }));
            } catch (e) {
                console.error("Failed to fetch editions:", e);
            }
        }

        try {
            const data = await new LeaderboardService(serverAuthProvider).getEditionLeaderboard(id, 0, 100);
            leaderboardItems = data.items;
        } catch (e) {
            console.error("Failed to fetch leaderboard:", e);
            classificationError = parseErrorMessage(e);
        }

        try {
            rounds = await new RoundsService(serverAuthProvider).getRounds();
        } catch (e) {
            console.error("Failed to fetch rounds:", e);
            roundsError = parseErrorMessage(e);
        }
    }

    const favoriteEditionLabel = getEditionTitle(edition, id);

    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="w-full max-w-3xl px-4 py-10">
                <Breadcrumb
                    items={[
                        { label: "Home", href: "/" },
                        { label: "Editions", href: "/editions" },
                        { label: getEditionTitle(edition, id) },
                    ]}
                />
                <div className="w-full rounded-lg border border-border bg-card p-6 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h1 className="mb-2 text-2xl font-semibold text-foreground">
                                {getEditionTitle(edition, id)}
                            </h1>

                            {edition && (
                                <EditionStateControls
                                    editionId={id}
                                    state={edition.state}
                                    isAdmin={!!(currentUser && isAdmin(currentUser))}
                                />
                            )}

                            {edition?.venueName && (
                                <p className="text-sm text-muted-foreground">
                                    {edition.venueName}
                                </p>
                            )}

                            {edition?.description && (
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {edition.description}
                                </p>
                            )}
                        </div>

                        <div className="mb-3">
                            <FavoriteActionButton
                                type="edition"
                                id={String(id)}
                                label={favoriteEditionLabel}
                                href={`/editions/${id}`}
                                secondaryLabel={edition?.venueName ?? undefined}
                            />
                        </div>

                        {currentUser && isAdmin(currentUser) && !isEditionFinished(edition?.state) && (
                            <div className="flex gap-2">
                                <Link
                                    href={`/editions/${id}/edit`}
                                    className={buttonVariants({ variant: "default", size: "sm" })}
                                >
                                    ✏️ edit
                                </Link>

                                <DeleteEditionButton deleteAction={deleteEditionAction} />
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="mt-6">
                            <ErrorAlert message={error} />
                        </div>
                    )}

                    {!error && (
                        <>
                            <h2 className="mt-8 mb-4 text-xl font-semibold text-foreground">
                                Participating Teams
                            </h2>

                            {teamsError && <ErrorAlert message={teamsError} />}

                            {!teamsError && teams.length === 0 && (
                                <EmptyState
                                    title="No teams found"
                                    description="No teams are registered for this edition yet."
                                />
                            )}

                            {!teamsError && teams.length > 0 && (
                                <ul className="w-full space-y-3">
                                    {teams.map((team, index) => {
                                        const href = getTeamHref(team);
                                        const teamAwards = getTeamAwards(team, awards);
                                        return (
                                            <li
                                                key={team.uri ?? index}
                                                className="w-full rounded-lg border border-border bg-card p-4 shadow-sm transition hover:bg-secondary/30"
                                            >
                                                <div className="flex flex-col gap-3">
                                                    {href ? (
                                                        <Link href={href} className="font-medium text-foreground">
                                                            {getTeamDisplayName(team)}
                                                        </Link>
                                                    ) : (
                                                        <span className="font-medium text-foreground">
                                                            {getTeamDisplayName(team)}
                                                        </span>
                                                    )}

                                                    {teamAwards.length > 0 && (
                                                        <div className="space-y-3 rounded-md border border-border bg-background/70 p-3">
                                                            <div className="flex items-center justify-between gap-3">
                                                                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                                                    Awards
                                                                </h3>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {teamAwards.length}
                                                                </span>
                                                            </div>

                                                            <div className="space-y-3">
                                                                {teamAwards.map((award, awardIndex) => {
                                                                    const resourceUri = getAwardResourceUri(award);

                                                                    return (
                                                                        <AwardSection
                                                                            key={resourceUri || `${team.uri ?? index}-${award.name ?? award.title ?? award.category ?? "award"}-${awardIndex}`}
                                                                            award={{ ...award, ...(resourceUri ? { resourceUri } : {}) }}
                                                                            editionId={id}
                                                                            editions={editions}
                                                                            isAdmin={Boolean(currentUser && isAdmin(currentUser))}
                                                                        />
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}

                            {!teamsError && teams.length > 0 && awardsError && (
                                <div className="mt-6">
                                    <ErrorAlert message={`Could not load awards. ${awardsError}`} />
                                </div>
                            )}

                            {!teamsError && teams.length > 0 && !awardsError && awards.length === 0 && (
                                <div className="mt-6">
                                    <EmptyState
                                        title="No awards yet"
                                        description="Awards for this edition have not been published yet."
                                    />
                                </div>
                            )}

                            <h2 className="mt-8 mb-4 text-xl font-semibold text-foreground">
                                Final Classification
                            </h2>

                            <div className="mb-4">
                                <Link href={`/editions/${id}/project-ranking`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                                    Scientific Project Ranking
                                </Link>
                            </div>

                            {classificationError && <ErrorAlert message={classificationError} />}

                            {!classificationError && leaderboardItems.length === 0 && (
                                <EmptyState
                                    title="No results yet"
                                    description="Classification will appear once match results are recorded."
                                />
                            )}

                            {!classificationError && leaderboardItems.length > 0 && (
                                <LeaderboardTable items={leaderboardItems} />
                            )}

                            <h2 className="mt-8 mb-4 text-xl font-semibold text-foreground">
                                Rounds
                            </h2>

                            {roundsError && <ErrorAlert message={roundsError} />}

                            {!roundsError && (
                                <RoundsManager
                                    initialRounds={rounds.map((r) => ({ uri: r.uri, number: r.number }))}
                                    isAdmin={!!(currentUser && isAdmin(currentUser) && !isEditionFinished(edition?.state))}
                                />
                            )}

                            <section id="media-section">
                                <h2 className="mt-8 mb-4 text-xl font-semibold text-foreground">
                                    Media Gallery
                                </h2>

                                {currentUser && isAdmin(currentUser) && edition && !isEditionFinished(edition?.state) && (
                                    <MediaUploadForm editionId={id} />
                                )}

                                {mediaError && <ErrorAlert message={mediaError} />}

                                {!mediaError && mediaContents.length > 0 && (
                                    <MediaSection mediaContents={mediaContents.map((media) => toMediaItem(media, edition?.uri))} />
                                )}

                                {!mediaError && mediaContents.length === 0 && (
                                    <EmptyState
                                        title="No media found"
                                        description="No media has been added to this edition yet."
                                    />
                                )}
                            </section>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
