"use client";

import { Button } from "@/app/components/button";
import ErrorAlert from "@/app/components/error-alert";
import { Input } from "@/app/components/input";
import { Label } from "@/app/components/label";
import { useRouter } from "next/navigation";
import { type FormEvent, startTransition, useEffect, useId, useRef, useState } from "react";
import { updateAward } from "./_award-actions";

interface AwardSectionProps {
    readonly award: {
        readonly resourceUri?: string;
        readonly id?: string | number;
        readonly name?: string;
        readonly title?: string;
        readonly category?: string;
        readonly edition?: string;
    };
    readonly editionId: string;
    readonly editions: Array<{
        readonly uri?: string;
        readonly year?: number;
        readonly venueName?: string;
    }>;
    readonly isAdmin: boolean;
}

function getAwardLabel(award: AwardSectionProps["award"]): string {
    return award.name?.trim() || award.title?.trim() || award.category?.trim() || "Unnamed award";
}

function getEditionLabel(edition: AwardSectionProps["editions"][number]): string {
    const year = edition.year ? String(edition.year) : "Edition";
    return edition.venueName ? `${year} - ${edition.venueName}` : year;
}

function getAwardEditionLabel(award: AwardSectionProps["award"], editions: AwardSectionProps["editions"]): string {
    const editionValue = award.edition?.trim();

    if (!editionValue) {
        return "No edition selected";
    }

    const match = editions.find((edition) => edition.uri === editionValue);
    return match ? getEditionLabel(match) : editionValue;
}

export default function AwardSection({
    award,
    editionId,
    editions,
    isAdmin,
}: Readonly<AwardSectionProps>) {
    const router = useRouter();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const resourceUri = award.resourceUri ?? (award.id != null ? `/awards/${award.id}` : null);
    const [displayAward, setDisplayAward] = useState(award);

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [name, setName] = useState(award.name ?? "");
    const [title, setTitle] = useState(award.title ?? "");
    const [category, setCategory] = useState(award.category ?? "");
    const [edition, setEdition] = useState(award.edition ?? "");
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) {
            return;
        }

        if (isEditing && !dialog.open) {
            dialog.showModal();
        } else if (!isEditing && dialog.open) {
            dialog.close();
        }

        return () => {
            if (dialog.open) {
                dialog.close();
            }
        };
    }, [isEditing]);

    function openEditor() {
        setName(displayAward.name ?? "");
        setTitle(displayAward.title ?? "");
        setCategory(displayAward.category ?? "");
        setEdition(displayAward.edition ?? "");
        setErrorMessage(null);
        setSuccessMessage(null);
        setIsEditing(true);
    }

    function closeEditor() {
        setIsEditing(false);
        setErrorMessage(null);
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (isSaving || !resourceUri) {
            return;
        }

        const formData = new FormData(event.currentTarget);

        setIsSaving(true);
        setErrorMessage(null);

        try {
            const result = await updateAward(resourceUri, editionId, formData);

            if (!result.success) {
                setErrorMessage(result.error ?? "An unexpected error occurred.");
                return;
            }

            setDisplayAward((current) => ({
                ...current,
                name: result.award.name,
                title: result.award.title,
                category: result.award.category,
                edition: result.award.edition,
            }));
            setIsEditing(false);
            setSuccessMessage("Award updated successfully.");
            startTransition(() => {
                router.refresh();
            });
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "An unexpected error occurred.");
        } finally {
            setIsSaving(false);
        }
    }


    return (
        <article className="rounded-lg border border-border bg-background/80 p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                    <h4 className="text-sm font-semibold text-foreground">
                        {getAwardLabel(displayAward)}
                    </h4>

                    {displayAward.title && (
                        <p className="text-sm text-muted-foreground">
                            Title: {displayAward.title}
                        </p>
                    )}

                    {displayAward.category && (
                        <p className="text-sm text-muted-foreground">
                            Category: {displayAward.category}
                        </p>
                    )}

                    <p className="text-xs text-muted-foreground">
                        Edition: {getAwardEditionLabel(displayAward, editions)}
                    </p>
                </div>

                {isAdmin && (
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={openEditor}
                            disabled={!resourceUri}
                            title={!resourceUri ? "This award is missing its resource URI" : undefined}
                        >
                            Edit award
                        </Button>
                    </div>
                )}
            </div>

            {successMessage && (
                <p className="mt-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-800">
                    {successMessage}
                </p>
            )}

            {isAdmin && resourceUri && (
                <dialog
                    ref={dialogRef}
                    aria-labelledby={titleId}
                    onClose={() => setIsEditing(false)}
                    className="m-auto w-full max-w-xl border border-border bg-card px-0 py-0 shadow-lg backdrop:bg-black/50"
                >
                    <form onSubmit={handleSubmit} className="space-y-5 p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 id={titleId} className="text-lg font-semibold text-foreground">
                                    Edit award
                                </h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Update the award details for this team.
                                </p>
                            </div>

                            <Button type="button" variant="ghost" size="sm" onClick={closeEditor} disabled={isSaving}>
                                Close
                            </Button>
                        </div>

                        {errorMessage && <ErrorAlert message={errorMessage} />}

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor={`${titleId}-name`}>Name</Label>
                                <Input
                                    id={`${titleId}-name`}
                                    name="name"
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    required
                                />
                            </div>

                            <div className="grid gap-2 sm:col-span-2 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor={`${titleId}-title`}>Title</Label>
                                    <Input
                                        id={`${titleId}-title`}
                                        name="title"
                                        value={title}
                                        onChange={(event) => setTitle(event.target.value)}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor={`${titleId}-category`}>Category</Label>
                                    <Input
                                        id={`${titleId}-category`}
                                        name="category"
                                        value={category}
                                        onChange={(event) => setCategory(event.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor={`${titleId}-edition`}>Edition</Label>
                                <select
                                    id={`${titleId}-edition`}
                                    name="edition"
                                    value={edition}
                                    onChange={(event) => setEdition(event.target.value)}
                                    required
                                    className="border-input h-10 rounded-md border bg-card px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/35 focus-visible:ring-[3px]"
                                >
                                    <option value="" disabled>
                                        Select an edition
                                    </option>
                                    {editions.map((editionOption) => {
                                        const value = editionOption.uri ?? "";
                                        const label =
                                            editionOption.year
                                                ? `${editionOption.year}${editionOption.venueName ? ` - ${editionOption.venueName}` : ""}`
                                                : editionOption.venueName ?? value;

                                        return (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={closeEditor}
                                disabled={isSaving}
                            >
                                Cancel
                            </Button>

                            <Button
                                type="submit"
                                loading={isSaving}
                                loadingText="Saving..."
                            >
                                Save changes
                            </Button>
                        </div>
                    </form>
                </dialog>
            )}
        </article>
    );
}
