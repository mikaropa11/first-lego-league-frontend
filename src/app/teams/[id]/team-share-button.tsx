"use client";

import { useMemo, useState } from "react";
import { Button } from "@/app/components/button";

interface TeamShareButtonProps {
    readonly teamName: string;
}

export default function TeamShareButton({ teamName }: TeamShareButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const currentUrl = typeof window !== "undefined" ? window.location.href : "";

    const shareText = `Check out ${teamName} on FIRST LEGO League`;
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(currentUrl);

    const twitterUrl = useMemo(
        () => `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
        [encodedText, encodedUrl]
    );

    const whatsappUrl = useMemo(
        () => `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
        [encodedText, encodedUrl]
    );

    async function handleShare() {
        setError(null);

        if (navigator.share) {
            try {
                await navigator.share({
                    title: teamName,
                    text: shareText,
                    url: currentUrl,
                });

                return;
            } catch (e) {
                console.error("Native share failed:", e);
                setError("Choose one of the sharing options below.");
            }
        }

        setIsOpen(true);
    }

    async function handleCopyLink() {
        setError(null);

        try {
            await navigator.clipboard.writeText(currentUrl);
            setCopied(true);

            setTimeout(() => {
                setCopied(false);
            }, 2000);
        } catch (e) {
            console.error("Clipboard copy failed:", e);
            setCopied(false);
            setError("Could not copy the link. Please use X or WhatsApp instead.");
            setIsOpen(true);
        }
    }

    return (
        <div className="relative">
            <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleShare}
            >
                Share
            </Button>

            {isOpen && (
                <div className="absolute right-0 z-20 mt-3 w-72 rounded-lg border border-border bg-card p-4 shadow-lg">
                    <div className="mb-3">
                        <h2 className="text-sm font-semibold text-foreground">
                            Share team
                        </h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Share this team page with coaches, parents, or fans.
                        </p>
                    </div>

                   {error && (
                        <p className="mb-3 rounded-md border border-border bg-secondary px-3 py-2 text-xs text-muted-foreground">
                            {error}
                        </p>
                    )}

                    <div className="space-y-2">
                        <Button
                            type="button"
                            variant="default"
                            size="sm"
                            className="w-full"
                            onClick={handleCopyLink}
                        >
                            {copied ? "Copied!" : "Copy Link"}
                        </Button>

                        <a
                            href={twitterUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-md border border-border px-3 py-2 text-center text-sm font-medium hover:bg-secondary"
                        >
                            Share on X
                        </a>

                        <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-md border border-border px-3 py-2 text-center text-sm font-medium hover:bg-secondary"
                        >
                            Share on WhatsApp
                        </a>

                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                                setIsOpen(false);
                                setError(null);
                            }}
                        >
                            Close
                        </Button>
                    </div>

                    {copied && (
                        <p className="mt-3 text-center text-xs font-medium text-green-700">
                            Link copied to clipboard.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
