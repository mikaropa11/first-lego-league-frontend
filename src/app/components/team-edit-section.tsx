'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/button';
import { Input } from '@/app/components/input';
import { Label } from '@/app/components/label';
import type { SelectOption } from '@/lib/editionOptions';
import { updateTeam } from '@/app/teams/new/actions';
import { TEAM_CATEGORY_OPTIONS } from '@/types/team';

const selectClassName =
    "border-input h-11 w-full border bg-card px-4 py-2 text-sm outline-none " +
    "focus-visible:border-ring focus-visible:ring-ring/35 focus-visible:ring-[3px] " +
    "aria-invalid:border-destructive";

interface TeamEditSectionProps {
    readonly team: {
        readonly id: string;
        readonly name: string;
        readonly city?: string;
        readonly educationalCenter?: string;
        readonly category?: string;
        readonly foundationYear?: number;
        readonly inscriptionDate?: string;
        readonly edition?: string | null;
    };
    readonly editionOptions?: SelectOption[];
    readonly isAdmin?: boolean;
}

export default function TeamEditSection({
    team,
    editionOptions = [],
    isAdmin = true,
}: TeamEditSectionProps) {
    const router = useRouter();

    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [city, setCity] = useState(team.city ?? '');
    const [educationalCenter, setEducationalCenter] = useState(team.educationalCenter ?? '');
    const [category, setCategory] = useState(team.category ?? '');
    const [foundationYear, setFoundationYear] = useState(team.foundationYear ?? '');
    const [inscriptionDate, setInscriptionDate] = useState(team.inscriptionDate ?? '');
    const [edition, setEdition] = useState(team.edition ?? '');

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (isLoading) return;

        setIsLoading(true);
        setError(null);

        try {
            const payload = {
                id: team.id,
                name: team.name || team.id,
                city: city.trim() || null,
                educationalCenter: educationalCenter.trim() || null,
                category,
                foundationYear: foundationYear ? Number(foundationYear) : null,
                inscriptionDate: inscriptionDate || null,
                edition: edition.trim() || null,
            };

            const result = await updateTeam(payload);

            if (!result?.success) {
                throw new Error('Failed to update team.');
            }

            setIsEditing(false);
            setSuccessMessage('Team updated successfully.');
            setTimeout(() => setSuccessMessage(null), 4000);
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    }

    function handleEditClick() {
        setError(null);
        setCity(team.city ?? '');
        setEducationalCenter(team.educationalCenter ?? '');
        setCategory(team.category ?? '');
        setFoundationYear(team.foundationYear ?? '');
        setInscriptionDate(team.inscriptionDate ?? '');
        setEdition(team.edition ?? '');
        setIsEditing(true);
    }

    return (
        <div className="mt-4">
            {successMessage && (
                <p className="mb-4 border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
                    {successMessage}
                </p>
            )}

            {isAdmin && (
                isEditing ? (
                    <form
                        onSubmit={handleSubmit}
                        className="rounded-lg border border-border bg-card p-5 shadow-sm"
                    >
                        <h2 className="mb-4 text-lg font-semibold text-foreground">
                            Edit team details
                        </h2>

                        {error && (
                            <p className="mb-4 border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                                {error}
                            </p>
                        )}

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label>Name</Label>
                                <div className="flex h-11 w-full items-center rounded-md border border-input bg-card px-4 py-2 text-sm">
                                    {team.id}
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>Category</Label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="border-input h-11 w-full border bg-card px-4 py-2 text-sm"
                                >
                                    {TEAM_CATEGORY_OPTIONS.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid gap-2">
                                <Label>City</Label>
                                <Input value={city} onChange={(e) => setCity(e.target.value)} />
                            </div>

                            <div className="grid gap-2">
                                <Label>Educational center</Label>
                                <Input
                                    value={educationalCenter}
                                    onChange={(e) => setEducationalCenter(e.target.value)}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Foundation year</Label>
                                <Input
                                    type="number"
                                    value={foundationYear}
                                    onChange={(e) => setFoundationYear(e.target.value)}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Inscription date</Label>
                                <Input
                                    type="date"
                                    value={inscriptionDate}
                                    onChange={(e) => setInscriptionDate(e.target.value)}
                                />
                            </div>

                            <div className="grid gap-2 md:col-span-2">
                                <Label>Edition</Label>
                                <select
                                    value={edition}
                                    onChange={(e) => setEdition(e.target.value)}
                                    className={selectClassName}
                                >
                                    <option value="">No edition selected</option>
                                    {editionOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsEditing(false)}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>

                            <Button type="submit" size="sm" disabled={isLoading}>
                                {isLoading ? 'Saving...' : 'Save changes'}
                            </Button>
                        </div>
                    </form>
                ) : (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleEditClick}
                    >
                        Edit team
                    </Button>
                )
            )}
        </div>
    );
}
