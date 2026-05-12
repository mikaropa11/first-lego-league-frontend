'use client';

import { Button, buttonVariants } from '@/app/components/button';
import EmptyState from '@/app/components/empty-state';
import { cn } from '@/lib/utils';
import { VolunteerRole } from '@/types/volunteer';
import type { LucideIcon } from 'lucide-react';
import {
    ArrowUpRight,
    ChevronLeft,
    ChevronRight,
    Flag,
    LifeBuoy,
    Mail,
    Scale,
    Search,
    Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { DeleteVolunteerDialog } from './delete-volunteer-dialog';

const SECTION_PAGE_SIZE = 6;

type VolunteerSectionTone = 'judge' | 'referee' | 'floater';

export interface VolunteerItem {
    name?: string;
    emailAddress?: string;
    type?: VolunteerRole;
    uri?: string;
    expert?: boolean;
}

interface VolunteersClientProps {
    judges: VolunteerItem[];
    referees: VolunteerItem[];
    floaters: VolunteerItem[];
    isAdmin: boolean;
}

interface VolunteerSectionProps {
    id: string;
    tone: VolunteerSectionTone;
    title: string;
    typePlural: string;
    description: string;
    volunteers: VolunteerItem[];
    emptyMessage: string;
    icon: LucideIcon;
    isAdmin: boolean;
    onDeleteRequest: (volunteer: { name: string; uri: string }) => void;
}

interface VolunteerCardProps {
    volunteer: VolunteerItem;
    tone: VolunteerSectionTone;
    position: number;
    isAdmin: boolean;
    onDeleteRequest: (volunteer: { name: string; uri: string }) => void;
}

function filterByName(volunteers: VolunteerItem[], query: string) {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
        return volunteers;
    }

    return volunteers.filter((volunteer) =>
        volunteer.name?.toLowerCase().includes(normalizedQuery) ||
        volunteer.emailAddress?.toLowerCase().includes(normalizedQuery),
    );
}

function countExperts(volunteers: VolunteerItem[]) {
    return volunteers.filter((volunteer) => volunteer.expert).length;
}

function getVolunteerSummary(volunteer: VolunteerItem) {
    switch (volunteer.type) {
        case 'Judge':
            return volunteer.expert
                ? 'Available for expert judging panels and deeper project review.'
                : 'Supports evaluation sessions and scoring conversations.';
        case 'Referee':
            return volunteer.expert
                ? 'Trusted to support higher-complexity match officiating.'
                : 'Helps keep match rounds fair, safe, and on schedule.';
        default:
            return 'Provides flexible operational support across the venue.';
    }
}

function getSectionResultCopy({
    pageItemsCount,
    filteredCount,
    totalCount,
    start,
    end,
    typePlural,
    hasQuery,
}: Readonly<{
    pageItemsCount: number;
    filteredCount: number;
    totalCount: number;
    start: number;
    end: number;
    typePlural: string;
    hasQuery: boolean;
}>) {
    if (filteredCount === 0) {
        return hasQuery
            ? `No ${typePlural} match the current search.`
            : `No ${typePlural} are listed yet.`;
    }

    if (filteredCount <= pageItemsCount) {
        return hasQuery
            ? `${filteredCount} matching ${typePlural} in view.`
            : `${filteredCount} ${typePlural} in view.`;
    }

    return hasQuery
        ? `Showing ${start}-${end} of ${filteredCount} matching ${typePlural} from ${totalCount} listed.`
        : `Showing ${start}-${end} of ${filteredCount} ${typePlural}.`;
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
        <div className="volunteers-page-summary-card">
            <div className="volunteers-page-summary-card__inner">
                <div className="volunteers-page-summary-card__header">
                    <div className="volunteers-page-summary-card__copy">
                        <div className="volunteers-page-summary-card__label">{label}</div>
                        <div className="volunteers-page-summary-card__value">{value}</div>
                    </div>
                    <div className="volunteers-page-summary-card__icon">
                        <Icon aria-hidden="true" />
                    </div>
                </div>
                <p className="volunteers-page-summary-card__description">{description}</p>
            </div>
        </div>
    );
}

function VolunteerCard({
    volunteer,
    tone,
    position,
    isAdmin,
    onDeleteRequest,
}: Readonly<VolunteerCardProps>) {
    const volunteerName = volunteer.name || 'Unknown volunteer';
    const encodedVolunteerUri = volunteer.uri ? encodeURIComponent(volunteer.uri) : null;
    const volunteerHref = encodedVolunteerUri
        ? `/volunteers/${encodedVolunteerUri}`
        : null;
    const editHref = volunteerHref ? `${volunteerHref}?edit=true` : null;

    return (
        <article className="volunteers-page-card" data-role={tone}>
            <div className="volunteers-page-card__body">
                <div className="volunteers-page-card__masthead">
                    <div className="volunteers-page-card__badges">
                        <span className="volunteers-page-card__role">
                            {volunteer.type ?? 'Volunteer'}
                        </span>
                        {volunteer.expert && (
                            <span className="volunteers-page-card__expert">Expert</span>
                        )}
                    </div>

                    <div className="volunteers-page-card__index">
                        {String(position).padStart(2, '0')}
                    </div>
                </div>

                <div className="volunteers-page-card__header">
                    {volunteerHref ? (
                        <Link href={volunteerHref} className="volunteers-page-card__title-link">
                            <h3 className="volunteers-page-card__title">{volunteerName}</h3>
                        </Link>
                    ) : (
                        <h3 className="volunteers-page-card__title">{volunteerName}</h3>
                    )}

                    <p className="volunteers-page-card__summary">
                        {getVolunteerSummary(volunteer)}
                    </p>
                </div>

                <div className="volunteers-page-card__contact">
                    <div className="volunteers-page-card__contact-label">Contact</div>
                    <p className="volunteers-page-card__contact-value">
                        <Mail aria-hidden="true" />
                        {volunteer.emailAddress || 'No email address provided.'}
                    </p>
                </div>

                <div className="volunteers-page-card__footer">
                    {volunteerHref ? (
                        <Link href={volunteerHref} className="volunteers-page-card__primary-link">
                            View volunteer
                            <ArrowUpRight aria-hidden="true" />
                        </Link>
                    ) : (
                        <span className="volunteers-page-card__primary-link">
                            Details unavailable
                        </span>
                    )}

                    {isAdmin && (
                        <div className="volunteers-page-card__actions">
                            {editHref && (
                                <Link
                                    href={editHref}
                                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                                    aria-label={`Edit ${volunteer.expert ? 'Expert ' : ''}${volunteerName}`}
                                >
                                    Edit
                                </Link>
                            )}

                            <Button
                                variant="destructive"
                                size="sm"
                                disabled={!volunteer.name || !volunteer.uri}
                                onClick={() => {
                                    if (volunteer.name && volunteer.uri) {
                                        onDeleteRequest({
                                            name: volunteer.name,
                                            uri: volunteer.uri,
                                        });
                                    }
                                }}
                                aria-label={`Delete ${volunteerName}`}
                            >
                                Delete
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </article>
    );
}

function SectionPagination({
    title,
    typePlural,
    currentPage,
    totalPages,
    start,
    end,
    totalCount,
    onPageChange,
}: Readonly<{
    title: string;
    typePlural: string;
    currentPage: number;
    totalPages: number;
    start: number;
    end: number;
    totalCount: number;
    onPageChange: (page: number) => void;
}>) {
    if (totalPages <= 1) {
        return null;
    }

    return (
        <nav className="volunteers-page-pagination" aria-label={`${title} pagination`}>
            <Button
                type="button"
                variant="secondary"
                size="sm"
                className="volunteers-page-pagination__button"
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
                aria-label={`Previous page for ${typePlural}`}
            >
                <ChevronLeft aria-hidden="true" />
                Previous
            </Button>

            <div className="volunteers-page-pagination__summary">
                <div className="volunteers-page-pagination__eyebrow">{title} pages</div>
                <div className="volunteers-page-pagination__line">
                    <span className="volunteers-page-pagination__page-word">Page</span>
                    <span className="volunteers-page-pagination__page-number">
                        {currentPage}
                    </span>
                    <span className="volunteers-page-pagination__page-word">
                        of {totalPages}
                    </span>
                </div>
                <p className="volunteers-page-pagination__helper">
                    Showing {start}-{end} of {totalCount} {typePlural}.
                </p>
            </div>

            <Button
                type="button"
                variant="secondary"
                size="sm"
                className="volunteers-page-pagination__button volunteers-page-pagination__button--next"
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                aria-label={`Next page for ${typePlural}`}
            >
                Next
                <ChevronRight aria-hidden="true" />
            </Button>
        </nav>
    );
}

function VolunteerSearchBar({
    searchId,
    query,
    typePlural,
    onQueryChange,
}: Readonly<{
    searchId: string;
    query: string;
    typePlural: string;
    onQueryChange: (value: string) => void;
}>) {
    return (
        <div className="volunteers-page-search-shell">
            <form
                className="volunteers-page-search"
                role="search"
                onSubmit={(event) => event.preventDefault()}
            >
                <label htmlFor={searchId} className="volunteers-page-search__label">
                    Search {typePlural}
                </label>

                <div className="volunteers-page-search__field">
                    <Search className="volunteers-page-search__icon" aria-hidden="true" />
                    <input
                        id={searchId}
                        type="text"
                        value={query}
                        onChange={(event) => onQueryChange(event.target.value)}
                        autoComplete="off"
                        spellCheck={false}
                        enterKeyHint="search"
                        aria-label={`Search ${typePlural}`}
                        placeholder={`Search ${typePlural} by name or email`}
                        className="volunteers-page-search__input"
                    />
                </div>

                <Button
                    type="submit"
                    className="volunteers-page-search__button"
                    aria-label={`Search ${typePlural}`}
                >
                    <Search aria-hidden="true" />
                    Search
                </Button>
            </form>
        </div>
    );
}

function VolunteerSection({
    id,
    tone,
    title,
    typePlural,
    description,
    volunteers,
    emptyMessage,
    icon: Icon,
    isAdmin,
    onDeleteRequest,
}: Readonly<VolunteerSectionProps>) {
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);

    const filteredVolunteers = filterByName(volunteers, query);
    const totalPages = Math.max(1, Math.ceil(filteredVolunteers.length / SECTION_PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const startIndex = (currentPage - 1) * SECTION_PAGE_SIZE;
    const visibleVolunteers = filteredVolunteers.slice(
        startIndex,
        startIndex + SECTION_PAGE_SIZE,
    );
    const visibleStart = filteredVolunteers.length === 0 ? 0 : startIndex + 1;
    const visibleEnd = filteredVolunteers.length === 0
        ? 0
        : startIndex + visibleVolunteers.length;
    const hasQuery = query.trim().length > 0;
    const searchId = `${id}-search`;

    return (
        <section id={id} className="volunteers-page-section" data-role={tone}>
            <div className="volunteers-page-section__header">
                <div className="volunteers-page-section__copy">
                    <div className="volunteers-page-section__eyebrow">Volunteer lane</div>

                    <div className="volunteers-page-section__headline">
                        <div className="volunteers-page-section__icon">
                            <Icon aria-hidden="true" />
                        </div>

                        <div>
                            <h2 className="volunteers-page-section__title">{title}</h2>
                            <p className="volunteers-page-section__description">{description}</p>
                        </div>
                    </div>
                </div>

                <div className="volunteers-page-section__meta">
                    <span className="volunteers-page-section__count">
                        {volunteers.length} listed
                    </span>
                    {hasQuery && (
                        <span className="volunteers-page-section__count volunteers-page-section__count--muted">
                            {filteredVolunteers.length} matching
                        </span>
                    )}
                </div>
            </div>

            {volunteers.length > 0 && (
                <div className="volunteers-page-section__toolbar">
                    <VolunteerSearchBar
                        searchId={searchId}
                        query={query}
                        typePlural={typePlural}
                        onQueryChange={(value) => {
                            setQuery(value);
                            setPage(1);
                        }}
                    />

                    <p className="volunteers-page-section__results">
                        {getSectionResultCopy({
                            pageItemsCount: visibleVolunteers.length,
                            filteredCount: filteredVolunteers.length,
                            totalCount: volunteers.length,
                            start: visibleStart,
                            end: visibleEnd,
                            typePlural,
                            hasQuery,
                        })}
                    </p>
                </div>
            )}

            {filteredVolunteers.length === 0 ? (
                <div className="volunteers-page-section__empty">
                    <EmptyState
                        title={hasQuery ? `No ${typePlural} match this search` : `No ${typePlural}`}
                        description={
                            hasQuery
                                ? `Try another name or email address to find matching ${typePlural}.`
                                : emptyMessage
                        }
                    />
                </div>
            ) : (
                <>
                    <ul className="volunteers-page-grid">
                        {visibleVolunteers.map((volunteer, index) => {
                            const key = volunteer.uri ?? `${id}-${startIndex + index}`;

                            return (
                                <li key={key}>
                                    <VolunteerCard
                                        volunteer={volunteer}
                                        tone={tone}
                                        position={startIndex + index + 1}
                                        isAdmin={isAdmin}
                                        onDeleteRequest={onDeleteRequest}
                                    />
                                </li>
                            );
                        })}
                    </ul>

                    <SectionPagination
                        title={title}
                        typePlural={typePlural}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        start={visibleStart}
                        end={visibleEnd}
                        totalCount={filteredVolunteers.length}
                        onPageChange={setPage}
                    />
                </>
            )}
        </section>
    );
}

export default function VolunteersClient({
    judges,
    referees,
    floaters,
    isAdmin,
}: Readonly<VolunteersClientProps>) {
    const [selectedForDelete, setSelectedForDelete] = useState<{
        name: string;
        uri: string;
    } | null>(null);
    const router = useRouter();

    const expertJudgeCount = countExperts(judges);
    const expertRefereeCount = countExperts(referees);
    const totalCount = judges.length + referees.length + floaters.length;

    const sections = [
        {
            id: 'judges',
            tone: 'judge' as const,
            title: 'Judges',
            typePlural: 'judges',
            description: 'Review project work and score teams across evaluation rooms.',
            volunteers: judges,
            emptyMessage: 'No judges have been added yet.',
            icon: Scale,
        },
        {
            id: 'referees',
            tone: 'referee' as const,
            title: 'Referees',
            typePlural: 'referees',
            description: 'Guide match adjudication and keep competition tables running smoothly.',
            volunteers: referees,
            emptyMessage: 'No referees have been added yet.',
            icon: Flag,
        },
        {
            id: 'floaters',
            tone: 'floater' as const,
            title: 'Floaters',
            typePlural: 'floaters',
            description: 'Step in across logistics, queuing, and venue support wherever needed.',
            volunteers: floaters,
            emptyMessage: 'No floaters have been added yet.',
            icon: LifeBuoy,
        },
    ];

    const activeRoleCount = sections.filter((section) => section.volunteers.length > 0).length;

    return (
        <div className="volunteers-page-content">
            

            <div className="volunteers-page-stats-grid">
                <StatCard
                    icon={Users}
                    label="Total roster"
                    value={String(totalCount)}
                    description={
                        activeRoleCount > 0
                            ? `${activeRoleCount} role sections currently have active coverage.`
                            : 'The directory is ready for the first volunteer records.'
                    }
                />
                <StatCard
                    icon={Scale}
                    label="Judges"
                    value={String(judges.length)}
                    description={
                        expertJudgeCount > 0
                            ? `${expertJudgeCount} expert judge${expertJudgeCount === 1 ? '' : 's'} available for advanced review panels.`
                            : 'Judging coverage for project evaluation and scoring.'
                    }
                />
                <StatCard
                    icon={Flag}
                    label="Referees"
                    value={String(referees.length)}
                    description={
                        expertRefereeCount > 0
                            ? `${expertRefereeCount} expert referee${expertRefereeCount === 1 ? '' : 's'} available for complex match oversight.`
                            : 'Match officiating coverage for competition tables.'
                    }
                />
                <StatCard
                    icon={LifeBuoy}
                    label="Floaters"
                    value={String(floaters.length)}
                    description="Flexible support crew ready to fill operational gaps on event day."
                />
            </div>

            {totalCount === 0 ? (
                <div className="volunteers-page-empty-shell">
                    <EmptyState
                        title="No volunteers found"
                        description="There are currently no volunteers available to display."
                    />
                </div>
            ) : (
                <div className="volunteers-page-sections">
                    {sections.map((section) => (
                        <VolunteerSection
                            key={section.id}
                            id={section.id}
                            tone={section.tone}
                            title={section.title}
                            typePlural={section.typePlural}
                            description={section.description}
                            volunteers={section.volunteers}
                            emptyMessage={section.emptyMessage}
                            icon={section.icon}
                            isAdmin={isAdmin}
                            onDeleteRequest={setSelectedForDelete}
                        />
                    ))}
                </div>
            )}

            {selectedForDelete && (
                <DeleteVolunteerDialog
                    volunteer={selectedForDelete}
                    onCancel={() => setSelectedForDelete(null)}
                    onSuccess={() => {
                        setSelectedForDelete(null);
                        router.refresh();
                    }}
                />
            )}
        </div>
    );
}
