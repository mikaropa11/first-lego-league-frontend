"use client";

import { Button } from "@/app/components/button";
import ConfirmDestructiveDialog from "@/app/components/confirm-destructive-dialog";
import ErrorAlert from "@/app/components/error-alert";
import { Input } from "@/app/components/input";
import { Label } from "@/app/components/label";
import { CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, startTransition, useEffect, useId, useRef, useState } from "react";
import { deleteAwardAction, updateAwardAction } from "./_awards-actions";

export interface AwardSnapshot {
  id?: string;
  uri?: string;
  name?: string;
  title?: string;
  category?: string;
  edition?: string;
  description?: string;
}

interface EditionOption {
  readonly uri?: string;
  readonly year?: number;
  readonly venueName?: string;
}

interface AwardsSectionProps {
  readonly teamId: string;
  readonly teamName: string;
  readonly awards: AwardSnapshot[];
  readonly editions: EditionOption[];
  readonly isAdmin: boolean;
  readonly teamEditionUri: string | null;
}

function getAwardLabel(award: AwardSnapshot, index: number): string {
  return award.name?.trim() || award.title?.trim() || award.category?.trim() || `Award ${index + 1}`;
}

function getEditionLabel(edition: EditionOption): string {
  const year = edition.year ? String(edition.year) : "Edition";
  return edition.venueName ? `${year} - ${edition.venueName}` : year;
}

function normalizeAwardUri(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const sanitized = value.split(/[?#]/, 1)[0] ?? "";
  if (!sanitized) {
    return null;
  }

  return sanitized.replace(/^https?:\/\/[^/]+/i, "");
}

function getEditionLabelFromUri(editionUri: string | null | undefined, editions: EditionOption[]): string | null {
  const normalizedEditionUri = normalizeAwardUri(editionUri);
  if (!normalizedEditionUri) {
    return null;
  }

  const match = editions.find((edition) => normalizeAwardUri(edition.uri) === normalizedEditionUri);
  return match ? getEditionLabel(match) : null;
}

function getAwardEditionLabel(award: AwardSnapshot, editions: EditionOption[], teamEditionUri: string | null): string {
  const editionValue = award.edition?.trim();

  if (!editionValue) {
    return getEditionLabelFromUri(teamEditionUri, editions) ?? "No edition selected";
  }

  const label = getEditionLabelFromUri(editionValue, editions);
  if (label) {
    return label;
  }

  return getEditionLabelFromUri(teamEditionUri, editions) ?? "Edition";
}

function normalizeUri(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const sanitized = value.split(/[?#]/, 1)[0] ?? "";
  if (!sanitized) {
    return null;
  }

  return sanitized.replace(/^https?:\/\/[^/]+/i, "");
}

function getAwardResourceUri(award: AwardSnapshot): string | null {
  return award.uri ?? (award.id ? `/awards/${award.id}` : null);
}

function getAwardIdentity(award: AwardSnapshot): string | null {
  return normalizeUri(getAwardResourceUri(award)) ?? award.id ?? null;
}

function sameAwardIdentity(first: AwardSnapshot, second: AwardSnapshot): boolean {
  return getAwardIdentity(first) === getAwardIdentity(second);
}

export default function AwardsManager({
  teamId,
  teamName,
  awards,
  editions,
  isAdmin,
  teamEditionUri,
}: Readonly<AwardsSectionProps>) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if ((!awards || awards.length === 0) && !successMessage) {
    return null;
  }

  return (
    <div className="mt-8">
      {successMessage && (
        <output className="mb-4 block rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="shrink-0">
              <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        </output>
      )}

      {awards && awards.length > 0 && (
        <AwardsSection
          teamId={teamId}
          teamName={teamName}
          awards={awards}
          editions={editions}
          isAdmin={isAdmin}
          teamEditionUri={teamEditionUri}
          onSuccess={setSuccessMessage}
        />
      )}
    </div>
  );
}

interface InternalAwardsSectionProps extends AwardsSectionProps {
  readonly onSuccess: (msg: string | null) => void;
}

function AwardsSection({
  teamId,
  teamName,
  awards,
  editions,
  isAdmin,
  teamEditionUri,
  onSuccess,
}: Readonly<InternalAwardsSectionProps>) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  const [displayAwards, setDisplayAwards] = useState<AwardSnapshot[]>(awards);
  const [awardToEdit, setAwardToEdit] = useState<AwardSnapshot | null>(null);
  const [awardToDelete, setAwardToDelete] = useState<AwardSnapshot | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [edition, setEdition] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (awardToEdit && !dialog.open) {
      dialog.showModal();
    } else if (!awardToEdit && dialog.open) {
      dialog.close();
    }

    return () => {
      if (dialog.open) {
        dialog.close();
      }
    };
  }, [awardToEdit]);

  function openEditor(award: AwardSnapshot) {
    setAwardToDelete(null);
    setErrorMessage(null);
    setDeleteErrorMessage(null);
    setName(award.name ?? "");
    setTitle(award.title ?? "");
    setCategory(award.category ?? "");
    setEdition(award.edition ?? teamEditionUri ?? "");
    setAwardToEdit(award);
    onSuccess(null);
  }

  function closeEditor() {
    setAwardToEdit(null);
    setErrorMessage(null);
  }

  function openDeleteDialog(award: AwardSnapshot) {
    setAwardToEdit(null);
    setDeleteErrorMessage(null);
    setAwardToDelete(award);
    onSuccess(null);
  }

  function closeDeleteDialog() {
    setAwardToDelete(null);
    setDeleteErrorMessage(null);
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSaving || !awardToEdit) {
      return;
    }

    const resourceUri = getAwardResourceUri(awardToEdit);
    if (!resourceUri) {
      setErrorMessage("Award resource is not available.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const result = await updateAwardAction(teamId, resourceUri, {
        name,
        title,
        category,
        edition,
      });

      if (!result.success) {
        setErrorMessage(result.error ?? "An unexpected error occurred.");
        return;
      }

      setDisplayAwards((current) =>
        current.map((item) =>
          sameAwardIdentity(item, awardToEdit)
            ? { ...item, name, title, category, edition }
            : item
        )
      );
      setAwardToEdit(null);
      onSuccess(`Successfully updated award for ${teamName}: ${name}`);
      startTransition(() => {
        router.refresh();
      });
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (isDeleting || !awardToDelete) {
      return;
    }

    const awardId = awardToDelete.uri?.split("/").findLast(Boolean) ?? awardToDelete.id;
    if (!awardId) {
      setDeleteErrorMessage("Could not determine which award to delete.");
      return;
    }

    setIsDeleting(true);
    setDeleteErrorMessage(null);

    try {
      const result = await deleteAwardAction(teamId, awardId);
      if (!result.success) {
        setDeleteErrorMessage(result.error ?? "An unexpected error occurred.");
        return;
      }

      setDisplayAwards((current) =>
        current.filter((item) => !sameAwardIdentity(item, awardToDelete))
      );
      const deletedLabel = getAwardLabel(awardToDelete, 0);
      closeDeleteDialog();
      onSuccess(`Successfully deleted award for ${teamName}: ${deletedLabel}`);
      startTransition(() => {
        router.refresh();
      });
    } catch (e) {
      setDeleteErrorMessage(e instanceof Error ? e.message : "An unexpected error occurred.");
    } finally {
      setIsDeleting(false);
    }
  }

  const hasEditionOptions = editions.length > 0;

  return (
    <>
      <div className="space-y-3">
        {displayAwards.map((award, index) => {
          const awardName = getAwardLabel(award, index);
          const resourceUri = getAwardResourceUri(award);

          return (
            <div
              key={resourceUri ?? String(award.id ?? index)}
              className="flex items-start justify-between gap-4 rounded-md border border-border bg-card p-4"
            >
              <div className="min-w-0">
                <p className="font-medium text-foreground">{awardName}</p>
                {award.title && <p className="mt-1 text-sm text-muted-foreground">Title: {award.title}</p>}
                {award.category && <p className="text-sm text-muted-foreground">Category: {award.category}</p>}
                <p className="text-xs text-muted-foreground">
                  Edition: {getAwardEditionLabel(award, editions, teamEditionUri)}
                </p>
                {award.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{award.description}</p>
                )}
              </div>

              {isAdmin && (
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openEditor(award)}
                    disabled={!resourceUri}
                    title={!resourceUri ? "This award is missing its resource URI" : undefined}
                  >
                    Edit
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => openDeleteDialog(award)}
                    disabled={!resourceUri}
                    title={!resourceUri ? "This award is missing its resource URI" : undefined}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {awardToEdit && isAdmin && (
        <dialog
          ref={dialogRef}
          aria-labelledby={titleId}
          onClose={() => setAwardToEdit(null)}
          className="m-auto w-full max-w-xl border border-border bg-card px-0 py-0 text-foreground shadow-lg backdrop:bg-black/50"
        >
          <form onSubmit={handleUpdate} className="space-y-5 p-6 text-foreground">
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
                  className="text-foreground"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor={`${titleId}-title`}>Title</Label>
                <Input
                  id={`${titleId}-title`}
                  name="title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="text-foreground"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor={`${titleId}-category`}>Category</Label>
                <Input
                  id={`${titleId}-category`}
                  name="category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="text-foreground"
                />
              </div>

              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor={`${titleId}-edition`}>Edition</Label>
                <select
                  id={`${titleId}-edition`}
                  name="edition"
                  value={edition}
                  onChange={(event) => setEdition(event.target.value)}
                  required
                  className="border-input h-10 rounded-md border bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-ring/35 focus-visible:ring-[3px]"
                >
                  <option value="" disabled>
                    Select an edition
                  </option>
                  {hasEditionOptions ? (
                    editions.map((editionOption) => {
                      const value = editionOption.uri ?? "";
                      return (
                        <option key={value} value={value}>
                          {getEditionLabel(editionOption)}
                        </option>
                      );
                    })
                  ) : (
                    <option value={edition || teamEditionUri || ""}>
                      {edition || teamEditionUri || "No editions available"}
                    </option>
                  )}
                </select>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={closeEditor} disabled={isSaving}>
                Cancel
              </Button>

              <Button type="submit" loading={isSaving} loadingText="Saving...">
                Save changes
              </Button>
            </div>
          </form>
        </dialog>
      )}

      {awardToDelete && isAdmin && (
        <ConfirmDestructiveDialog
          title="Delete Award"
          description={
            <>
              Are you sure you want to delete the award{" "}
              <strong>{getAwardLabel(awardToDelete, 0)}</strong>? This action cannot be undone.
            </>
          }
          confirmLabel="Delete Award"
          pendingLabel="Deleting..."
          onConfirm={handleDelete}
          onCancel={closeDeleteDialog}
        />
      )}

      {deleteErrorMessage && <ErrorAlert message={deleteErrorMessage} className="mt-4" />}
    </>
  );
}
