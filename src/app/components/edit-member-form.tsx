'use client';

import { useId, useState } from 'react';
import { Button } from '@/app/components/button';
import { AVAILABLE_MEMBER_ROLES, TEAM_MEMBER_GENDER_OPTIONS, TSHIRT_SIZES, TeamMemberSnapshot } from '@/types/team';
import { UpdateMemberPayload } from '@/api/teamApi';

type EditMemberFormProps = Readonly<{
    member: TeamMemberSnapshot;
    onSubmit: (data: UpdateMemberPayload) => Promise<boolean> | void;
    onCancel: () => void;
    isLoading?: boolean;
}>;

export function EditMemberForm({ member, onSubmit, onCancel, isLoading = false }: EditMemberFormProps) {
    const nameId = useId();
    const birthDateId = useId();
    const roleId = useId();
    const genderId = useId();
    const shirtSizeId = useId();

    const [name, setName] = useState(member.name ?? '');
    const [birthDate, setBirthDate] = useState(member.birthDate ?? '');
    const [role, setRole] = useState(member.role ?? AVAILABLE_MEMBER_ROLES[0]);
    const [gender, setGender] = useState(member.gender ?? TEAM_MEMBER_GENDER_OPTIONS[0]);
    const [tShirtSize, setTShirtSize] = useState(member.tShirtSize ?? 'M');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        await onSubmit({ name: name.trim(), birthDate, role, gender: gender as typeof TEAM_MEMBER_GENDER_OPTIONS[number], tShirtSize });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3 border p-4 rounded bg-zinc-50 dark:bg-zinc-900 shadow-sm">
            <div>
                <label htmlFor={nameId} className="block text-xs font-medium uppercase text-zinc-500 mb-1">Name</label>
                <input id={nameId} value={name} onChange={e => setName(e.target.value)}
                    className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading} />
            </div>
            <div>
                <label htmlFor={birthDateId} className="block text-xs font-medium uppercase text-zinc-500 mb-1">Birth Date</label>
                <input id={birthDateId} type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)}
                    className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading} />
            </div>
            <div>
                <label htmlFor={roleId} className="block text-xs font-medium uppercase text-zinc-500 mb-1">Role</label>
                <select id={roleId} value={role} onChange={e => setRole(e.target.value)}
                    className="border p-2 w-full rounded bg-white dark:bg-zinc-800" disabled={isLoading}>
                    {AVAILABLE_MEMBER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor={genderId} className="block text-xs font-medium uppercase text-zinc-500 mb-1">Gender</label>
                <select id={genderId} value={gender} onChange={e => setGender(e.target.value)}
                    className="border p-2 w-full rounded bg-white dark:bg-zinc-800" disabled={isLoading}>
                    {TEAM_MEMBER_GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor={shirtSizeId} className="block text-xs font-medium uppercase text-zinc-500 mb-1">T-Shirt Size</label>
                <select id={shirtSizeId} value={tShirtSize} onChange={e => setTShirtSize(e.target.value)}
                    className="border p-2 w-full rounded bg-white dark:bg-zinc-800" disabled={isLoading}>
                    {TSHIRT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isLoading || !name.trim()}>
                    {isLoading ? 'Saving...' : 'Save'}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}