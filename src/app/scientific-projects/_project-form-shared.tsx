'use client';

import { Button } from '@/app/components/button';
import { Input } from '@/app/components/input';
import { Label } from '@/app/components/label';
import { Textarea } from '@/app/components/textarea';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { SubmitHandler, UseFormRegisterReturn, useForm, useWatch } from 'react-hook-form';

export type Option = { label: string; value: string };

export type ProjectFormValues = {
    name: string;
    description: string;
    score: number;
    edition: string;
    team: string;
};

type ProjectFormAction = (data: {
    name: string;
    score: number;
    comments: string;
    team: string;
    edition: string;
}) => Promise<{ success: boolean; error?: string }>;

export interface ScientificProjectFormProps {
    defaultValues?: Partial<ProjectFormValues>;
    editionOptions: Option[];
    teamsPerEdition: Record<string, Option[]>;
    action: ProjectFormAction;
    successRedirect: string;
    submitLabel: string;
    savingLabel: string;
}

const selectClassName =
    'border-input h-11 w-full border bg-card px-4 py-2 text-base outline-none ' +
    'focus-visible:border-ring focus-visible:ring-ring/35 focus-visible:ring-[3px] ' +
    'aria-invalid:border-destructive md:text-sm disabled:pointer-events-none disabled:opacity-50';

interface OptionSelectProps {
    id: string;
    label: string;
    options: Option[];
    registration: UseFormRegisterReturn;
    error?: string;
    disabled?: boolean;
    placeholder?: string;
}

export function OptionSelect({ id, label, options, registration, error, disabled, placeholder }: Readonly<OptionSelectProps>) {
    const errorId = `${id}-error`;
    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            <select
                id={id}
                className={selectClassName}
                disabled={disabled}
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
                {...registration}
            >
                <option value="">{placeholder ?? 'Select...'}</option>
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            {error && <p id={errorId} className="text-sm text-destructive">{error}</p>}
        </div>
    );
}

export function ScientificProjectForm({
    defaultValues,
    editionOptions,
    teamsPerEdition,
    action,
    successRedirect,
    submitLabel,
    savingLabel,
}: Readonly<ScientificProjectFormProps>) {
    const [submitError, setSubmitError] = useState<string | null>(null);
    const { register, handleSubmit, control, setValue, formState: { errors, isSubmitting } } = useForm<ProjectFormValues>({
        defaultValues: {
            score: 0,
            ...defaultValues,
        },
    });
    const router = useRouter();

    const watchedEdition = useWatch({ control, name: 'edition' });
    const visibleTeams = teamsPerEdition[watchedEdition] ?? [];

    const isInitialRender = useRef(true);
    useEffect(() => {
        if (isInitialRender.current) {
            isInitialRender.current = false;
            return;
        }
        setValue('team', '');
    }, [watchedEdition, setValue]);

    const onSubmit: SubmitHandler<ProjectFormValues> = async (data) => {
        setSubmitError(null);
        try {
            const result = await action({
                name: data.name,
                score: data.score,
                comments: data.description,
                team: data.team,
                edition: data.edition,
            });

            if (!result.success) {
                setSubmitError(result.error ?? 'Operation failed. Please try again.');
                return;
            }

            router.push(successRedirect);
        } catch {
            setSubmitError('Operation failed. Please try again.');
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="mx-auto grid max-w-xl gap-5">
            {submitError && (
                <p
                    className="border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
                    role="alert"
                    aria-live="assertive"
                >
                    {submitError}
                </p>
            )}

            <div className="grid gap-2">
                <Label htmlFor="name">Project name</Label>
                <Input
                    id="name"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                    {...register('name', {
                        required: 'Project name is required',
                        maxLength: { value: 100, message: 'Max 100 characters' },
                    })}
                />
                {errors.name && <p id="name-error" className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    aria-invalid={!!errors.description}
                    aria-describedby={errors.description ? 'description-error' : undefined}
                    {...register('description', {
                        required: 'Description is required',
                        maxLength: { value: 400, message: 'Max 400 characters' },
                    })}
                />
                {errors.description && <p id="description-error" className="text-sm text-destructive">{errors.description.message}</p>}
            </div>

            <div className="grid gap-2">
                <Label htmlFor="score">Score</Label>
                <Input
                    id="score"
                    type="number"
                    min={0}
                    step={1}
                    aria-invalid={!!errors.score}
                    aria-describedby={errors.score ? 'score-error' : undefined}
                    {...register('score', {
                        required: 'Score is required',
                        valueAsNumber: true,
                        min: { value: 0, message: 'Score cannot be negative' },
                    })}
                />
                {errors.score && <p id="score-error" className="text-sm text-destructive">{errors.score.message}</p>}
            </div>

            <OptionSelect
                id="edition"
                label="Edition"
                options={editionOptions}
                registration={register('edition', { required: 'Edition is required' })}
                error={errors.edition?.message}
                placeholder="Select an edition..."
            />

            <OptionSelect
                id="team"
                label="Team"
                options={visibleTeams}
                registration={register('team', { required: 'Team is required' })}
                error={errors.team?.message}
                disabled={!watchedEdition}
                placeholder={watchedEdition ? 'Select a team...' : 'Select an edition first...'}
            />

            <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
                {isSubmitting ? savingLabel : submitLabel}
            </Button>
        </form>
    );
}
