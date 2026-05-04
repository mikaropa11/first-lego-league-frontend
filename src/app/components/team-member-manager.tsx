'use client';

import { Button } from '@/app/components/button';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { TeamMemberSnapshot } from '@/types/team';
import { useState, useEffect } from 'react';
import { AddMemberForm } from './add-member-form';
import { DeleteMemberDialog } from './delete-member-dialog';
import { EditMemberForm } from './edit-member-form';
import { UpdateMemberPayload } from '@/api/teamApi';
import { CheckCircle } from 'lucide-react';


interface TeamMembersManagerProps {
    readonly teamId: string;
    readonly initialMembers: TeamMemberSnapshot[];
    readonly isCoach: boolean;
    readonly isAdmin: boolean;
}

function getMemberKey(member: TeamMemberSnapshot, index: number) {
    if (member.uri !== undefined) {
        return member.uri;
    }

    if (member.id === undefined) {
        return `member-${index}`;
    }

    return String(member.id);
}

export function TeamMembersManager({ teamId, initialMembers, isCoach, isAdmin }: Readonly<TeamMembersManagerProps>) {
    const isAuthorized = isCoach || isAdmin;
    const { members, addMember, removeMember, updateMember, isFull, isLoading } = useTeamMembers(teamId, initialMembers);
    const [showForm, setShowForm] = useState(false);
    const [selected, setSelected] = useState<{ name: string; uri: string } | null>(null);
    const [editingUri, setEditingUri] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!successMessage) return;
        const timer = setTimeout(() => setSuccessMessage(null), 3000);
        return () => clearTimeout(timer);
    }, [successMessage]);

    return (
        <div className="space-y-4">
            {isAuthorized && !isFull && (
                <Button onClick={() => setShowForm(true)} disabled={isLoading}>Add Member</Button>
            )}

            {showForm && (
                <AddMemberForm
                    onSubmit={async (name, role, birthDate, gender, tShirtSize) => {
                        const success = await addMember(name, role, birthDate, gender, tShirtSize);
                        if (success) setShowForm(false);
                        return success;
                    }}
                    onCancel={() => setShowForm(false)}
                    isLoading={isLoading}
                />
            )}

            {successMessage && (
                <div className="flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3" role="status">
                    <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />
                    <p className="text-sm font-medium text-green-700">{successMessage}</p>
                </div>
            )}

            <ul className="space-y-2">
                {members.map((m, index) => {
                    const memberUri = m.uri;
                    const memberKey = getMemberKey(m, index);
                    const isEditing = editingUri === memberUri;

                    return (
                        <li key={memberKey} className="rounded-lg border border-border bg-card overflow-hidden">
                            <div className="flex items-center justify-between p-3">
                                <div>
                                    <span className="block font-medium">{m.name ?? "Unnamed member"}</span>
                                    <span className="text-xs text-muted-foreground uppercase">{m.role ?? "Member"}</span>
                                </div>
                                {isAuthorized && (
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setEditingUri(isEditing ? null : (memberUri ?? null))}
                                            disabled={!memberUri}
                                        >
                                            {isEditing ? 'Close' : 'Edit'}
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => memberUri ? setSelected({ name: m.name ?? "Unnamed member", uri: memberUri }) : null}
                                            disabled={!memberUri}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {isEditing && memberUri && (
                                <div className="border-t border-border px-3 pb-3 pt-2">
                                    <EditMemberForm
                                        member={m}
                                        isLoading={isLoading}
                                        onSubmit={async (data: UpdateMemberPayload) => {
                                            const success = await updateMember(memberUri, data);
                                            if (success) {
                                                setEditingUri(null);
                                                setSuccessMessage(`${data.name} updated successfully.`);
                                            }
                                            return success;
                                        }}
                                        onCancel={() => setEditingUri(null)}
                                    />
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>

            {selected && (
                <DeleteMemberDialog
                    member={selected}
                    onCancel={() => setSelected(null)}
                    onSuccess={(uri: string) => {
                        removeMember(uri);
                        setSelected(null);
                    }}
                />
            )}
        </div>
    );
}
