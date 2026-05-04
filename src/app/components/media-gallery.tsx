"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, Film, FileIcon, X, ExternalLink, PlayCircle } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

export interface MediaItem {
    uri?: string;
    id?: string;
    type?: string;
    url?: string;
    edition?: string;
    link?: (rel: string) => { href?: string } | undefined;
}

function getYouTubeId(url?: string): string | null {
    if (!url) return null;
    const match = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/.exec(url);
    return match?.[1] ?? null;
}

function isImage(type?: string): boolean {
    return (type?.startsWith("image/")) ?? false;
}

function isVideo(type?: string): boolean {
    return (type?.startsWith("video/")) ?? false;
}

function getMediaReference(item: MediaItem): string | null {
    return item.url ?? item.id ?? null;
}

export function getMediaDetailHref(item: MediaItem): string | null {
    const mediaReference = getMediaReference(item);
    if (!mediaReference) {
        return null;
    }

    const searchParams = new URLSearchParams({ url: mediaReference });

    if (item.edition) {
        searchParams.set("edition", item.edition);
    }

    return `/media?${searchParams.toString()}`;
}

// ─── Shared thumbnail renderers ───────────────────────────────────────────────

function YtThumb({ videoId, overlay = "small" }: { readonly videoId: string; readonly overlay?: "small" | "large" }) {
    return (
        <div className="relative h-full w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} alt="YouTube" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <PlayCircle className={`${overlay === "large" ? "h-16 w-16" : "h-8 w-8"} text-white drop-shadow-lg`} />
            </div>
            <span className="absolute bottom-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">YouTube</span>
        </div>
    );
}

function MediaThumb({ item, index }: { readonly item: MediaItem; readonly index: number }) {
    const ytId = getYouTubeId(item.url);
    if (ytId) return <YtThumb videoId={ytId} />;
    if (isImage(item.type) && item.url) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.url} alt={`Media ${index + 1}`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        );
    }
    if (isVideo(item.type)) {
        return (
            <div className="relative flex h-full w-full items-center justify-center bg-zinc-900">
                <Film className="h-8 w-8 text-zinc-400" />
                <span className="absolute bottom-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-xs text-zinc-300">Video</span>
            </div>
        );
    }
    return <div className="flex h-full w-full items-center justify-center bg-zinc-800"><FileIcon className="h-8 w-8 text-zinc-400" /></div>;
}

// ─── Card wrapper ──────────────────────────────────────────────────────────────

function MediaCard({ item, index, className, onClick }: {
    readonly item: MediaItem;
    readonly index: number;
    readonly className: string;
    readonly onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={`Open media ${index + 1}`}
            className={`group relative overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md ${className}`}
        >
            <MediaThumb item={item} index={index} />
            <div className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/15" />
        </button>
    );
}

// ─── Lightbox content ──────────────────────────────────────────────────────────

function LightboxMedia({ item, index }: { readonly item: MediaItem; readonly index: number }) {
    const ytId = getYouTubeId(item.url);
    if (ytId) {
        return (
            <>
                <div className="relative w-full max-w-lg overflow-hidden rounded-xl shadow-lg">
                    <YtThumb videoId={ytId} overlay="large" />
                </div>
                <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
                >
                    View on YouTube <ExternalLink className="h-4 w-4" />
                </a>
            </>
        );
    }
    if (isImage(item.type) && item.url) {
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={item.url} alt={`Media ${index + 1}`} className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-lg" />;
    }
    if (isVideo(item.type) && item.url) {
        return (
            <video
                src={item.url}
                controls
                className="max-h-[60vh] max-w-full rounded-xl shadow-lg"
            >
                <track kind="captions" />
            </video>
        );
    }
    if (isVideo(item.type)) {
        return (
            <div className="flex h-56 w-full max-w-sm items-center justify-center rounded-xl bg-zinc-900">
                <div className="flex flex-col items-center gap-3 text-zinc-400">
                    <Film className="h-14 w-14" />
                    <span className="text-sm">Video — preview not available</span>
                </div>
            </div>
        );
    }
    return (
        <div className="flex h-48 w-full max-w-sm items-center justify-center rounded-xl bg-zinc-800">
            <FileIcon className="h-14 w-14 text-zinc-400" />
        </div>
    );
}

function LightboxContent({ item, index }: { readonly item: MediaItem; readonly index: number }) {
    const ytId = getYouTubeId(item.url);
    const detailHref = getMediaDetailHref(item);

    return (
        <div className="flex flex-col items-center gap-5">
            <LightboxMedia item={item} index={index} />
            <div className="flex flex-wrap justify-center gap-2">
                {detailHref && (
                    <Link
                        href={detailHref}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
                    >
                        View detail <ExternalLink className="h-4 w-4" />
                    </Link>
                )}
                {!ytId && item.url && (
                    <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-secondary"
                    >
                        Open original <ExternalLink className="h-4 w-4" />
                    </a>
                )}
            </div>
        </div>
    );
}

// ─── Layout sections ───────────────────────────────────────────────────────────

function HeroSection({ item, index, onOpen }: { readonly item: MediaItem; readonly index: number; readonly onOpen: (i: number) => void }) {
    return (
        <MediaCard item={item} index={index} onClick={() => onOpen(index)} className="h-72 w-full" />
    );
}

function GridSection({ items, startIndex, onOpen }: { readonly items: MediaItem[]; readonly startIndex: number; readonly onOpen: (i: number) => void }) {
    let cols = "grid-cols-2";
    if (items.length === 3) cols = "grid-cols-3";
    return (
        <div className={`grid ${cols} gap-3`}>
            {items.map((item, i) => {
                const globalIndex = startIndex + i;
                // tall on odd positions when 4 items in 2x2
                const tall = items.length === 4 && (i === 1 || i === 2);
                return (
                    <MediaCard
                        key={item.uri ?? item.id ?? globalIndex}
                        item={item}
                        index={globalIndex}
                        onClick={() => onOpen(globalIndex)}
                        className={tall ? "h-52" : "h-40"}
                    />
                );
            })}
        </div>
    );
}

function RowSection({ items, startIndex, onOpen }: { readonly items: MediaItem[]; readonly startIndex: number; readonly onOpen: (i: number) => void }) {
    return (
        <div className="grid grid-cols-3 gap-3">
            {items.map((item, i) => {
                const globalIndex = startIndex + i;
                return (
                    <MediaCard
                        key={item.uri ?? item.id ?? globalIndex}
                        item={item}
                        index={globalIndex}
                        onClick={() => onOpen(globalIndex)}
                        className="h-36"
                    />
                );
            })}
        </div>
    );
}

function CarouselSection({ items, startIndex, onOpen }: { readonly items: MediaItem[]; readonly startIndex: number; readonly onOpen: (i: number) => void }) {
    const scrollRef = useRef<HTMLDivElement>(null);

    function scroll(dir: "left" | "right") {
        scrollRef.current?.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
    }

    return (
        <div className="group/c relative">
            <button type="button" onClick={() => scroll("left")} aria-label="Scroll left"
                className="absolute left-0 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-background/90 p-2 shadow-md opacity-0 transition-opacity group-hover/c:opacity-100">
                <ChevronLeft className="h-4 w-4" />
            </button>

            <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory" style={{ scrollbarWidth: "none" }}>
                {items.map((item, i) => {
                    const globalIndex = startIndex + i;
                    return (
                        <MediaCard
                            key={item.uri ?? item.id ?? globalIndex}
                            item={item}
                            index={globalIndex}
                            onClick={() => onOpen(globalIndex)}
                            className="h-36 w-48 flex-none snap-start"
                        />
                    );
                })}
            </div>

            <button type="button" onClick={() => scroll("right")} aria-label="Scroll right"
                className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-1/2 rounded-full border border-border bg-background/90 p-2 shadow-md opacity-0 transition-opacity group-hover/c:opacity-100">
                <ChevronRight className="h-4 w-4" />
            </button>
        </div>
    );
}

// ─── Main component ────────────────────────────────────────────────────────────

type MediaFilter = "all" | "photo" | "video";

interface MediaGalleryProps {
    readonly mediaContents: MediaItem[];
}

export function MediaGallery({ mediaContents }: MediaGalleryProps) {
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [filter, setFilter] = useState<MediaFilter>("all");

    const filtered = mediaContents.filter((item) => {
        if (filter === "photo") return isImage(item.type);
        if (filter === "video") return isVideo(item.type) || getYouTubeId(item.url) !== null;
        return true;
    });

    function openLightbox(index: number) {
        setActiveIndex(index);
        setOpen(true);
    }

    function changeFilter(f: MediaFilter) {
        setFilter(f);
        setActiveIndex(0);
    }

    function prev() { setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length); }
    function next() { setActiveIndex((i) => (i + 1) % filtered.length); }

    const hasPhotos = mediaContents.some((item) => isImage(item.type));
    const hasVideos = mediaContents.some((item) => isVideo(item.type) || getYouTubeId(item.url) !== null);
    const showFilters = hasPhotos && hasVideos;

    const hero = filtered[0];
    const gridItems = filtered.slice(1, 5);
    const rowItems = filtered.slice(5, 8);
    const carouselItems = filtered.slice(8);

    const activeItem = filtered[activeIndex];

    const filterOptions: { label: string; value: MediaFilter }[] = [
        { label: "All", value: "all" },
        { label: "Photos", value: "photo" },
        { label: "Videos", value: "video" },
    ];

    return (
        <div className="flex flex-col gap-3">
            {showFilters && (
                <div className="flex gap-2">
                    {filterOptions.map(({ label, value }) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => changeFilter(value)}
                            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                                filter === value
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}

            {hero && <HeroSection item={hero} index={0} onOpen={openLightbox} />}

            {gridItems.length > 0 && <GridSection items={gridItems} startIndex={1} onOpen={openLightbox} />}

            {rowItems.length > 0 && <RowSection items={rowItems} startIndex={5} onOpen={openLightbox} />}

            {carouselItems.length > 0 && <CarouselSection items={carouselItems} startIndex={8} onOpen={openLightbox} />}
            {filtered.length === 0 && (
                <div className="flex h-32 items-center justify-center rounded-xl border border-border text-sm text-muted-foreground">
                    {filter === "photo" ? "No photos in this edition." : filter === "video" ? "No videos in this edition." : "No media in this edition."}
                </div>
            )}

            <Dialog.Root open={open} onOpenChange={setOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-card p-6 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
                        <Dialog.Title className="sr-only">Media viewer</Dialog.Title>

                        <div className="mb-4 flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{activeIndex + 1} / {filtered.length}</span>
                            <Dialog.Close aria-label="Close media viewer" className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                                <X className="h-5 w-5" />
                            </Dialog.Close>
                        </div>

                        <div className="flex items-center gap-3">
                            {filtered.length > 1 && (
                                <button type="button" onClick={prev} aria-label="Previous" className="flex-none rounded-full border border-border bg-background p-2 shadow-sm transition-colors hover:bg-secondary">
                                    <ChevronLeft className="h-5 w-5" />
                                </button>
                            )}
                            <div className="flex-1">
                                {activeItem && <LightboxContent item={activeItem} index={activeIndex} />}
                            </div>
                            {filtered.length > 1 && (
                                <button type="button" onClick={next} aria-label="Next" className="flex-none rounded-full border border-border bg-background p-2 shadow-sm transition-colors hover:bg-secondary">
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            )}
                        </div>

                        {filtered.length > 1 && (
                            <div className="mt-5 flex justify-center gap-1.5">
                                {filtered.map((item, i) => (
                                    <button type="button" key={item.uri ?? item.id ?? item.url ?? String(i)} onClick={() => setActiveIndex(i)} aria-label={`Go to ${i + 1}`}
                                        className={`h-1.5 rounded-full transition-all ${i === activeIndex ? "w-4 bg-primary" : "w-1.5 bg-border hover:bg-muted-foreground"}`} />
                                ))}
                            </div>
                        )}
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
}
