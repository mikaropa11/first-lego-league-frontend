import { EditionsService } from "@/api/editionApi";
import { MediaService } from "@/api/mediaApi";
import ErrorAlert from "@/app/components/error-alert";
import PageShell from "@/app/components/page-shell";
import { MediaViewer, MediaViewerItem } from "@/app/media/media-viewer";
import { serverAuthProvider } from "@/lib/authProvider";
import { getEncodedResourceId } from "@/lib/halRoute";
import { Edition } from "@/types/edition";
import { NotFoundError, parseErrorMessage } from "@/types/errors";
import { MediaContent } from "@/types/mediaContent";

interface MediaPageProps {
    readonly searchParams: Promise<{ url?: string | string[]; edition?: string | string[] }>;
}

interface MediaResult {
    readonly media: MediaContent | null;
    readonly mediaItems: MediaContent[];
    readonly error: string | null;
}

interface EditionContext {
    readonly edition: Edition | null;
    readonly mediaItems: MediaContent[];
    readonly warning: string | null;
}

function firstParam(value: string | string[] | undefined): string | null {
    if (Array.isArray(value)) {
        return value[0] ?? null;
    }

    return value ?? null;
}

function getMediaUrl(content: MediaContent): string {
    return content.url ?? content.id ?? "";
}

function toMediaViewerItem(content: MediaContent, editionUri?: string | null): MediaViewerItem {
    const mediaUrl = getMediaUrl(content);

    return {
        id: mediaUrl,
        type: content.type,
        url: mediaUrl,
        edition: editionUri ?? getEditionUri(content) ?? undefined,
    };
}

function getEditionUri(content: MediaContent): string | null {
    if (typeof content.edition === "string" && content.edition.length > 0) {
        return content.edition;
    }

    const linkedEdition = content.link?.("edition")?.href;
    if (linkedEdition && !linkedEdition.includes("/mediaContents/")) {
        return linkedEdition;
    }

    return null;
}

function getMediaTitle(media: MediaContent | null): string {
    if (!media) {
        return "Media";
    }

    return media.type ? `Media ${media.type}` : "Media";
}

function findMediaByUrl(mediaItems: MediaContent[], mediaUrl: string): MediaContent | null {
    return mediaItems.find((item) => getMediaUrl(item) === mediaUrl) ?? null;
}

async function getMedia(
    mediaUrl: string,
    mediaService: MediaService,
    editionUri: string | null
): Promise<MediaResult> {
    if (editionUri) {
        try {
            const mediaItems = await mediaService.getMediaByEdition(editionUri);
            const media = findMediaByUrl(mediaItems, mediaUrl);

            if (media) {
                return { media, mediaItems, error: null };
            }
        } catch (e) {
            console.error("Failed to fetch media from edition:", e);
        }
    }

    try {
        return {
            media: await mediaService.getMediaById(mediaUrl),
            mediaItems: [],
            error: null,
        };
    } catch (e) {
        console.error("Failed to fetch media:", e);
        return {
            media: null,
            mediaItems: [],
            error: e instanceof NotFoundError
                ? "This media does not exist."
                : parseErrorMessage(e),
        };
    }
}

async function getEditionContext(
    media: MediaContent,
    mediaService: MediaService,
    editionService: EditionsService,
    editionUriFromQuery: string | null
): Promise<EditionContext> {
    const editionUri = editionUriFromQuery ?? getEditionUri(media);

    if (!editionUri) {
        return { edition: null, mediaItems: [media], warning: null };
    }

    try {
        const editionPromise = editionService.getEditionByUri(editionUri);
        const mediaItemsPromise = mediaService.getMediaByEdition(editionUri);
        const [edition, mediaItems] = await Promise.all([editionPromise, mediaItemsPromise]);

        return {
            edition,
            mediaItems,
            warning: null,
        };
    } catch (e) {
        console.error("Failed to fetch media edition data:", e);
        return {
            edition: null,
            mediaItems: [media],
            warning: parseErrorMessage(e),
        };
    }
}

function renderMediaError(message: string) {
    return (
        <PageShell
            eyebrow="Media"
            title="Media not found"
            description="The requested media could not be loaded."
        >
            <ErrorAlert message={message} />
        </PageShell>
    );
}

export default async function MediaPage({ searchParams }: MediaPageProps) {
    const resolvedSearchParams = await searchParams;
    const mediaUrl = firstParam(resolvedSearchParams.url);
    const editionUri = firstParam(resolvedSearchParams.edition);

    if (!mediaUrl) {
        return renderMediaError("No media URL was provided.");
    }

    const mediaService = new MediaService(serverAuthProvider);
    const editionService = new EditionsService(serverAuthProvider);
    const { media, mediaItems: mediaItemsFromLookup, error } = await getMedia(mediaUrl, mediaService, editionUri);

    if (error || !media) {
        return renderMediaError(error ?? "This media does not exist.");
    }

    const { edition, mediaItems, warning } = await getEditionContext(media, mediaService, editionService, editionUri);
    const loadedMediaItems = mediaItems.length > 0 ? mediaItems : mediaItemsFromLookup;
    const normalizedMediaItems = loadedMediaItems.length > 0 ? loadedMediaItems : [media];
    const activeIndex = Math.max(
        normalizedMediaItems.findIndex((item) => getMediaUrl(item) === getMediaUrl(media)),
        0
    );
    const editionId = getEncodedResourceId(edition?.uri);

    return (
        <PageShell
            eyebrow="Media"
            title={getMediaTitle(media)}
            description="View this media item and move through the other media from the same edition."
        >
            {warning && (
                <div className="mb-4">
                    <ErrorAlert message={warning} />
                </div>
            )}
            <MediaViewer
                media={toMediaViewerItem(media, editionUri)}
                mediaItems={normalizedMediaItems.map((item) => toMediaViewerItem(item, editionUri))}
                activeIndex={activeIndex}
                edition={edition
                    ? {
                        id: editionId,
                        year: edition.year,
                        venueName: edition.venueName,
                        description: edition.description,
                    }
                    : null}
            />
        </PageShell>
    );
}
