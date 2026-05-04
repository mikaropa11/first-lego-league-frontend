'use client';

import EmptyState from '@/app/components/empty-state';
import { Input } from '@/app/components/input';
import { Button } from '@/app/components/button';
import { VolunteerRole } from '@/types/volunteer';
import { useState } from 'react';
import Link from 'next/link';
import { buttonVariants } from '@/app/components/button';
import { useRouter } from 'next/navigation';
import { DeleteVolunteerDialog } from './delete-volunteer-dialog';

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
    const [query, setQuery] = useState('');
    const filtered = filterByName(volunteers, query);

    return (
        <div className="space-y-4 pt-4">
            <h3 className="text-xl font-semibold">{title}</h3>

            <Input
                type="search"
                placeholder={`Search ${typePlural}`}
                value={query}
                onChange={e => setQuery(e.target.value)}
            />

            {filtered.length === 0 ? (
                <EmptyState title={`No ${typePlural}`} description={emptyMessage} />
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
                                                {v.name || 'Unknown'}
                                            </span>
                                        </Link>

                                        {v.expert && (
                                            <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-amber-200">
                                                Expert
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
                                            aria-label={`Edit ${v.expert ? 'Expert ' : ''}${v.name ?? 'volunteer'}`}
                                        >
                                            Edit
                                        </Link>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => v.name && v.uri && onDeleteRequest({ name: v.name, uri: v.uri })}
                                            aria-label={`Delete ${v.name ?? 'volunteer'}`}
                                        >
                                            Delete
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

    return (
        <div className="space-y-12">
            <VolunteerSection
                title="Judges"
                typePlural="judges"
                volunteers={judges}
                emptyMessage="No judges available"
                isAdmin={isAdmin}
                onDeleteRequest={setSelectedForDelete}
            />
            <VolunteerSection
                title="Referees"
                typePlural="referees"
                volunteers={referees}
                emptyMessage="No referees available"
                isAdmin={isAdmin}
                onDeleteRequest={setSelectedForDelete}
            />
            <VolunteerSection
                title="Floaters"
                typePlural="floaters"
                volunteers={floaters}
                emptyMessage="No floaters available"
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