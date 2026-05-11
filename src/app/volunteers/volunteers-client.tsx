'use client';

import EmptyState from '@/app/components/empty-state';
import { Input } from '@/app/components/input';
import { Button } from '@/app/components/button';
import { VolunteerRole } from '@/types/volunteer';
import { useState } from 'react';
import Link from 'next/link';
import { buttonVariants } from '@/app/components/button';
import { useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { Flag, Scale, Users } from 'lucide-react';
import { DeleteVolunteerDialog } from './delete-volunteer-dialog';
import { useTranslations } from '@/lib/languageContext';

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
    title: string;
    typePlural: string;
    volunteers: VolunteerItem[];
    emptyMessage: string;
    isAdmin: boolean;
    onDeleteRequest: (volunteer: { name: string; uri: string }) => void;
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
        <div className="teams-page-stat-card">
            <div className="teams-page-stat-card__inner">
                <div className="teams-page-stat-card__header">
                    <div className="teams-page-stat-card__copy">
                        <div className="teams-page-stat-card__label">{label}</div>
                        <div className="teams-page-stat-card__value">{value}</div>
                    </div>
                    <div className="teams-page-stat-card__icon">
                        <Icon aria-hidden="true" />
                    </div>
                </div>
                <p className="teams-page-stat-card__description">{description}</p>
            </div>
        </div>
    );
}

function filterByName(volunteers: VolunteerItem[], query: string): VolunteerItem[] {
    const q = query.trim().toLowerCase();
    if (!q) return volunteers;
    return volunteers.filter(v =>
        v.name?.toLowerCase().includes(q) || v.emailAddress?.toLowerCase().includes(q)
    );
}

function VolunteerSection({
    title,
    typePlural,
    volunteers,
    emptyMessage,
    isAdmin,
    onDeleteRequest,
}: Readonly<VolunteerSectionProps>) {
    const t = useTranslations();
    const [query, setQuery] = useState('');
    const filtered = filterByName(volunteers, query);

    return (
        <div className="space-y-4 pt-4">
            <h3 className="text-xl font-semibold">{title}</h3>

            <Input
                type="search"
                placeholder={t.volunteers.searchRole.replace('{role}', typePlural)}
                value={query}
                onChange={e => setQuery(e.target.value)}
            />

            {filtered.length === 0 ? (
                <EmptyState title={`${t.common.noResults}: ${typePlural}`} description={emptyMessage} />
            ) : (
                <ul className="list-grid">
                    {filtered.map((v, idx) => {
                        const id = v.uri ? encodeURIComponent(v.uri) : `unknown-${idx}`;

                        return (
                            <li key={id} className="list-card pl-7 flex items-center justify-between">
                                <div>
                                    <div className="list-kicker">{v.type}</div>
                                    <div className="flex items-center gap-2">
                                        <Link href={`/volunteers/${id}`}>
                                            <span className="list-title font-medium hover:underline cursor-pointer">
                                                {v.name || t.volunteers.unknown}
                                            </span>
                                        </Link>

                                        {v.expert && (
                                            <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-amber-200">
                                                {t.volunteers.expert}
                                            </span>
                                        )}
                                    </div>

                                    {v.emailAddress && (
                                        <div className="list-support">{v.emailAddress}</div>
                                    )}
                                </div>

                                {isAdmin && (
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/volunteers/${id}?edit=true`}
                                            className={buttonVariants({ variant: "outline", size: "sm" })}
                                            aria-label={`${t.common.edit} ${v.expert ? `${t.volunteers.expert} ` : ''}${v.name ?? t.volunteers.unknownVolunteer}`}
                                        >
                                            {t.common.edit}
                                        </Link>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => v.name && v.uri && onDeleteRequest({ name: v.name, uri: v.uri })}
                                            aria-label={`${t.common.delete} ${v.name ?? t.volunteers.unknownVolunteer}`}
                                        >
                                            {t.common.delete}
                                        </Button>
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

export default function VolunteersClient({
    judges,
    referees,
    floaters,
    isAdmin
}: Readonly<VolunteersClientProps>) {
    const [selectedForDelete, setSelectedForDelete] = useState<{ name: string; uri: string } | null>(null);
    const router = useRouter();
    const t = useTranslations();

    return (
        <div className="space-y-12">
            <div className="teams-page-stats-grid">
                <StatCard
                    icon={Scale}
                    label={t.volunteers.judges}
                    value={String(judges.length)}
                    description={t.volunteers.judgesDescription}
                />
                <StatCard
                    icon={Flag}
                    label={t.volunteers.referees}
                    value={String(referees.length)}
                    description={t.volunteers.refereesDescription}
                />
                <StatCard
                    icon={Users}
                    label={t.volunteers.floaters}
                    value={String(floaters.length)}
                    description={t.volunteers.floatersDescription}
                />
            </div>

            <VolunteerSection
                title={t.volunteers.judges}
                typePlural={t.volunteers.judges.toLowerCase()}
                volunteers={judges}
                emptyMessage={t.volunteers.noJudges}
                isAdmin={isAdmin}
                onDeleteRequest={setSelectedForDelete}
            />
            <VolunteerSection
                title={t.volunteers.referees}
                typePlural={t.volunteers.referees.toLowerCase()}
                volunteers={referees}
                emptyMessage={t.volunteers.noReferees}
                isAdmin={isAdmin}
                onDeleteRequest={setSelectedForDelete}
            />
            <VolunteerSection
                title={t.volunteers.floaters}
                typePlural={t.volunteers.floaters.toLowerCase()}
                volunteers={floaters}
                emptyMessage={t.volunteers.noFloaters}
                isAdmin={isAdmin}
                onDeleteRequest={setSelectedForDelete}
            />

            {/* The Dialog Component */}
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
