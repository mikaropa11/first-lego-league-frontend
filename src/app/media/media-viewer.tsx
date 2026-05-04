"use client";

import { Button, buttonVariants } from "@/app/components/button";
import { InfoRow } from "@/app/components/info-row";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ExternalLink, FileIcon, ImageIcon, Video } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { TouchEvent } from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";

export interface MediaViewerItem {
    readonly id?: string;
    readonly type?: string;
    readonly url?: string;
    readonly edition?: string;
}

export interface MediaViewerEdition {
    readonly id?: string | null;
    readonly year?: number;
    readonly venueName?: string;
    readonly description?: string;
}

interface MediaViewerProps {
    readonly media: MediaViewerItem;
    readonly mediaItems: MediaViewerItem[];
    readonly activeIndex: number;
    readonly edition: MediaViewerEdition | null;
}

function getMediaUrl(item: MediaViewerItem): string {
    return item.url ?? item.id ?? "";
}

function getMediaHref(item: MediaViewerItem): string {
    const mediaReference = item.id ?? getMediaUrl(item);
    const searchParams = new URLSearchParams({ url: mediaReference });

    if (item.edition) {
        searchParams.set("edition", item.edition);
    }

    return `/media?${searchParams.toString()}`;
}

function getYouTubeId(url?: string): string | null {
    if (!url) return null;
    const match = /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/.exec(url);
    return match?.[1] ?? null;
}

function isImage(type?: string): boolean {
    return type === "image" || (type?.startsWith("image/") ?? false);
}

function isVideo(type?: string): boolean {
    return type === "video" || (type?.startsWith("video/") ?? false);
}

function MediaFrame({ media }: { readonly media: MediaViewerItem }) {
    const url = getMediaUrl(media);
    const youtubeId = getYouTubeId(url);

    if (youtubeId) {
        return (
            <iframe
                title="YouTube media"
                src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="aspect-video w-full border-0 bg-black"
            />
        );
    }

    if (isImage(media.type) && url) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={url}
                alt="Edition media"
                className="max-h-[72vh] w-full object-contain"
            />
        );
    }

    if (isVideo(media.type) && url) {
        return (
            <video
                src={url}
                controls
                playsInline
                className="max-h-[72vh] w-full bg-black"
            >
                <track kind="captions" src="data:text/vtt,WEBVTT%0A" default />
            </video>
        );
    }

    return (
        <div className="flex min-h-[22rem] flex-col items-center justify-center gap-4 bg-secondary p-8 text-center">
            <FileIcon className="size-14 text-muted-foreground" aria-hidden="true" />
            <p className="max-w-md text-sm text-muted-foreground">
                This media type cannot be previewed here.
            </p>
            {url && (
                <Link
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                    Open original
                    <ExternalLink className="size-4" aria-hidden="true" />
                </Link>
            )}
        </div>
    );
}

function MediaKindIcon({ type }: { readonly type?: string }) {
    if (isImage(type)) {
        return <ImageIcon className="size-4" aria-hidden="true" />;
    }

    if (isVideo(type)) {
        return <Video className="size-4" aria-hidden="true" />;
    }

    return <FileIcon className="size-4" aria-hidden="true" />;
}

export function MediaViewer({ media, mediaItems, activeIndex, edition }: MediaViewerProps) {
    const router = useRouter();
    const touchStartX = useRef<number | null>(null);
    const canNavigate = mediaItems.length > 1;
    const currentPosition = Math.max(activeIndex, 0);

    const previousItem = useMemo(() => {
        if (!canNavigate) return null;
        return mediaItems[(currentPosition - 1 + mediaItems.length) % mediaItems.length];
    }, [canNavigate, currentPosition, mediaItems]);

    const nextItem = useMemo(() => {
        if (!canNavigate) return null;
        return mediaItems[(currentPosition + 1) % mediaItems.length];
    }, [canNavigate, currentPosition, mediaItems]);

    const goTo = useCallback((item: MediaViewerItem | null) => {
        if (item) {
            router.push(getMediaHref(item));
        }
    }, [router]);

    function onTouchEnd(event: TouchEvent<HTMLDivElement>) {
        if (touchStartX.current === null) return;

        const delta = event.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;

        if (Math.abs(delta) < 48) return;
        goTo(delta > 0 ? previousItem : nextItem);
    }

    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            if (event.key === "ArrowLeft") {
                goTo(previousItem);
            }

            if (event.key === "ArrowRight") {
                goTo(nextItem);
            }
        }

        globalThis.addEventListener("keydown", onKeyDown);
        return () => globalThis.removeEventListener("keydown", onKeyDown);
    }, [goTo, nextItem, previousItem]);

    const url = getMediaUrl(media);
    const editionHref = edition?.id ? `/editions/${edition.id}` : null;

    return (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
            <section className="min-w-0 border border-border bg-card">
                <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                        <MediaKindIcon type={media.type} />
                        <span className="truncate">{media.type ?? "media"}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                        {currentPosition + 1} / {mediaItems.length}
                    </span>
                </div>

                <div
                    className="relative bg-black/95"
                    onTouchStart={(event) => { touchStartX.current = event.touches[0].clientX; }}
                    onTouchEnd={onTouchEnd}
                >
                    {canNavigate && (
                        <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            onClick={() => goTo(previousItem)}
                            aria-label="Previous media"
                            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 bg-card/90"
                        >
                            <ChevronLeft className="size-5" aria-hidden="true" />
                        </Button>
                    )}

                    <div className={cn("flex min-h-[22rem] items-center justify-center", getYouTubeId(url) && "min-h-0")}>
                        <MediaFrame media={media} />
                    </div>

                    {canNavigate && (
                        <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            onClick={() => goTo(nextItem)}
                            aria-label="Next media"
                            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 bg-card/90"
                        >
                            <ChevronRight className="size-5" aria-hidden="true" />
                        </Button>
                    )}
                </div>
            </section>

            <aside className="border border-border bg-card p-5">
                <h2 className="text-lg font-semibold text-foreground">Edition</h2>
                <div className="mt-4 space-y-3">
                    {edition?.year && <InfoRow label="Year" value={String(edition.year)} />}
                    {edition?.venueName && <InfoRow label="Venue" value={edition.venueName} />}
                    {edition?.description && <InfoRow label="Description" value={edition.description} />}
                    <InfoRow label="Media type" value={media.type ?? "Unknown"} />
                </div>

                <div className="mt-5 flex flex-col gap-2">
                    {editionHref && (
                        <Link href={editionHref} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                            Back to edition
                        </Link>
                    )}
                    {url && (
                        <Link
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={buttonVariants({ variant: "outline", size: "sm" })}
                        >
                            Open original
                            <ExternalLink className="size-4" aria-hidden="true" />
                        </Link>
                    )}
                </div>
            </aside>
        </div>
    );
}
