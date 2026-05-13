'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import EmptyState from '@/app/components/empty-state';
import { Input } from '@/app/components/input';
import { ArrowUpRight, CalendarRange, MapPin, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { getEncodedResourceId } from '@/lib/halRoute';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from '@/lib/languageContext';

export interface EditionItem {
    uri?: string;
    year?: number;
    venueName?: string;
    description?: string;
    state?: string;
}

function getEditionHref(edition: EditionItem) {
    const editionId = getEncodedResourceId(edition.uri);
    return editionId ? `/editions/${editionId}` : null;
}

function getEditionDisplayYear(edition: EditionItem, t: ReturnType<typeof useTranslations>) {
    return edition.year !== undefined ? String(edition.year) : t.editions.tbd;
}

function formatEditionState(state?: string) {
    if (!state?.trim()) {
        return null;
    }

    return state
        .toLowerCase()
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function normalizeEditionState(state?: string) {
    if (!state?.trim()) {
        return 'unknown';
    }

    return state.trim().toLowerCase().replace(/[\s_]+/g, '-');
}

function getUniqueValueCount(values: Array<string | null | undefined>) {
    return new Set(
        values
            .map((value) => value?.trim())
            .filter((value): value is string => Boolean(value)),
    ).size;
}

function getLatestEditionYear(editions: EditionItem[]) {
    const years = editions
        .map((edition) => edition.year)
        .filter((year): year is number => typeof year === 'number');

    if (years.length === 0) {
        return null;
    }

    return Math.max(...years);
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
        <div className="editions-page-stat-card">
            <div className="editions-page-stat-card__inner">
                <div className="editions-page-stat-card__header">
                    <div className="editions-page-stat-card__copy">
                        <div className="editions-page-stat-card__label">{label}</div>
                        <div className="editions-page-stat-card__value">{value}</div>
                    </div>
                    <div className="editions-page-stat-card__icon">
                        <Icon aria-hidden="true" />
                    </div>
                </div>
                <p className="editions-page-stat-card__description">{description}</p>
            </div>
        </div>
    );
}

function EditionCard({ edition }: Readonly<{ edition: EditionItem }>) {
    const t = useTranslations();
    const href = getEditionHref(edition);
    const formattedState = formatEditionState(edition.state);
    const hasFacts = Boolean(edition.venueName || formattedState);

    const card = (
        <article
            className="editions-page-edition-card"
            data-state={normalizeEditionState(edition.state)}
        >
            <div className="editions-page-edition-card__body">
                <div className="editions-page-edition-card__masthead">
                    <div className="editions-page-edition-card__serial">{t.editions.editionArchive}</div>
                    {formattedState && (
                        <div className="editions-page-edition-card__badge">{formattedState}</div>
                    )}
                </div>

                <div className="editions-page-edition-card__header">
                    <div className="editions-page-edition-card__kicker">{t.editions.season}</div>
                    <h3 className="editions-page-edition-card__title">
                        {getEditionDisplayYear(edition, t)}
                    </h3>
                </div>

                {hasFacts && (
                    <div className="editions-page-edition-card__facts">
                        {edition.venueName && (
                            <div className="editions-page-edition-card__fact">
                                <div className="editions-page-edition-card__fact-label">{t.editions.venue}</div>
                                <div className="editions-page-edition-card__fact-value">
                                    {edition.venueName}
                                </div>
                            </div>
                        )}
                        {formattedState && (
                            <div className="editions-page-edition-card__fact">
                                <div className="editions-page-edition-card__fact-label">{t.editions.stateLabel}</div>
                                <div className="editions-page-edition-card__fact-value">
                                    {formattedState}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {edition.description && (
                    <div className="editions-page-edition-card__summary">
                        <div className="editions-page-edition-card__summary-label">{t.editions.editionBrief}</div>
                        <p className="editions-page-edition-card__summary-copy">
                            {edition.description}
                        </p>
                    </div>
                )}

                <div className="editions-page-edition-card__footer">
                    <div
                        className={
                            href
                                ? 'editions-page-edition-card__action editions-page-edition-card__action--interactive'
                                : 'editions-page-edition-card__action editions-page-edition-card__action--disabled'
                        }
                    >
                        {href ? t.editions.viewDetails : t.editions.profileUnavailable}
                        {href && <ArrowUpRight aria-hidden="true" />}
                    </div>
                </div>
            </div>
        </article>
    );

    return href ? (
        <Link className="editions-page-link" href={href}>
            {card}
        </Link>
    ) : (
        <div className="editions-page-link">{card}</div>
    );
}

export default function EditionsClient({
    editions,
    initialSearch = '',
    initialState = '',
    allStates = [],
}: Readonly<{
    editions: EditionItem[];
    initialSearch?: string;
    initialState?: string;
    allStates?: string[];
}>) {
    const router = useRouter();
    const t = useTranslations();
    const [searchValue, setSearchValue] = useState(initialSearch);
    const [stateValue, setStateValue] = useState(initialState);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    function updateParams(newQuery: string, newState: string) {
        const params = new URLSearchParams();
        if (newQuery) params.set('search', newQuery);
        if (newState) params.set('state', newState);
        router.push(params.toString() ? `/editions?${params}` : '/editions');
    }

    function handleSearchChange(value: string) {
        setSearchValue(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            updateParams(value, stateValue);
        }, 300);
    }

    const venueCount = getUniqueValueCount(editions.map((edition) => edition.venueName));
    const stateCount = getUniqueValueCount(editions.map((edition) => edition.state));
    const latestEditionYear = getLatestEditionYear(editions);

    return (
        <div className="space-y-8">
            <div className="editions-page-search-card">
                <div className="editions-page-search-card__field">
                    <span className="editions-page-search-card__label">
                        {t.editions.searchByYearVenueState}
                    </span>
                    <div className="flex gap-3">
                        <Input
                            type="search"
                            value={searchValue}
                            onChange={(event) => handleSearchChange(event.target.value)}
                            placeholder={t.editions.searchPlaceholder}
                            aria-label={t.editions.searchByYearVenueStateLabel}
                            className="editions-page-search-input"
                        />
                        <select
                            value={stateValue}
                            onChange={(e) => {
                                setStateValue(e.target.value);
                                updateParams(searchValue, e.target.value);
                            }}
                            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                            aria-label={t.editions.filterByState}
                        >
                            <option value="">{t.editions.allStates}</option>
                            {allStates.map((s) => (
                                <option key={s} value={s}>
                                    {formatEditionState(s)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="editions-page-stats-grid">
                <StatCard
                    icon={CalendarRange}
                    label={t.editions.seasonsInView}
                    value={String(editions.length)}
                    description={
                        editions.length > 0
                            ? t.editions.seasonsInViewDescription
                            : t.editions.noSeasonMatchesSearch
                    }
                />
                <StatCard
                    icon={MapPin}
                    label={t.editions.venuesListed}
                    value={String(venueCount)}
                    description={
                        venueCount > 0
                            ? t.editions.venuesListedDescription
                            : t.editions.venueDataUnavailable
                    }
                />
                <StatCard
                    icon={Sparkles}
                    label={t.editions.statesTracked}
                    value={String(stateCount)}
                    description={
                        latestEditionYear !== null
                            ? t.editions.latestVisibleSeason.replace('{year}', String(latestEditionYear))
                            : t.editions.seasonMetadataUnavailable
                    }
                />
            </div>

            {editions.length === 0 ? (
                <EmptyState
                    title={t.editions.noEditions}
                    description={
                        initialSearch.trim()
                            ? t.editions.noEditionsMatch.replace('{query}', initialSearch)
                            : initialState
                                ? t.editions.noEditionsForState
                                : t.editions.noEditionsAvailable
                    }
                />
            ) : (
                <ul className="editions-page-grid">
                    {editions.map((edition, index) => (
                        <li key={edition.uri ?? index} className="editions-page-item">
                            <EditionCard edition={edition} />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
