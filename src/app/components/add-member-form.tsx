"use client";

import { Button } from "@/app/components/button";
import {
    AVAILABLE_MEMBER_ROLES,
    TEAM_MEMBER_GENDER_OPTIONS,
    TeamMemberGender,
    TSHIRT_SIZES,
    TShirtSize,
} from "@/types/team";
import { useId, useState } from "react";

type AddMemberFormProps = Readonly<{
    onSubmit: (
        name: string,
        role: string,
        birthDate: string,
        gender: TeamMemberGender,
        tShirtSize: string,
    ) => Promise<boolean> | void;
    onCancel: () => void;
    isLoading?: boolean;
}>;

export function AddMemberForm({
    onSubmit,
    onCancel,
    isLoading = false,
}: AddMemberFormProps) {
    const nameInputId = useId();
    const roleSelectId = useId();
    const birthDateInputId = useId();
    const genderSelectId = useId();
    const tShirtSizeSelectId = useId();

    const [name, setName] = useState("");
    const [role, setRole] = useState<string>(AVAILABLE_MEMBER_ROLES[0]);
    const [birthDate, setBirthDate] = useState("");
    const [gender, setGender] = useState<TeamMemberGender>(TEAM_MEMBER_GENDER_OPTIONS[0]);
    const [tShirtSize, setTShirtSize] = useState<TShirtSize>(TSHIRT_SIZES[2]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim() || !birthDate) return;

        const success = await onSubmit(name.trim(), role, birthDate, gender, tShirtSize);

        if (success) {
            setName("");
            setRole(AVAILABLE_MEMBER_ROLES[0]);
            setBirthDate("");
            setGender(TEAM_MEMBER_GENDER_OPTIONS[0]);
            setTShirtSize(TSHIRT_SIZES[2]);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-3 rounded border bg-white p-4 shadow-sm dark:bg-zinc-900"
        >
            <div>
                <label
                    htmlFor={nameInputId}
                    className="mb-1 block text-xs font-medium uppercase text-zinc-500"
                >
                    Name
                </label>
                <input
                    id={nameInputId}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Albert"
                    className="w-full rounded border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label
                        htmlFor={roleSelectId}
                        className="mb-1 block text-xs font-medium uppercase text-zinc-500"
                    >
                        Role
                    </label>
                    <select
                        id={roleSelectId}
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full rounded border bg-white p-2 dark:bg-zinc-800"
                        disabled={isLoading}
                    >
                        {AVAILABLE_MEMBER_ROLES.map((r) => (
                            <option key={r} value={r}>
                                {r}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label
                        htmlFor={birthDateInputId}
                        className="mb-1 block text-xs font-medium uppercase text-zinc-500"
                    >
                        Birth Date
                    </label>
                    <input
                        id={birthDateInputId}
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full rounded border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label
                        htmlFor={genderSelectId}
                        className="mb-1 block text-xs font-medium uppercase text-zinc-500"
                    >
                        Gender
                    </label>
                    <select
                        id={genderSelectId}
                        value={gender}
                        onChange={(e) => setGender(e.target.value as TeamMemberGender)}
                        className="w-full rounded border bg-white p-2 dark:bg-zinc-800"
                        disabled={isLoading}
                    >
                        {TEAM_MEMBER_GENDER_OPTIONS.map((g) => (
                            <option key={g} value={g}>
                                {g}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label
                        htmlFor={tShirtSizeSelectId}
                        className="mb-1 block text-xs font-medium uppercase text-zinc-500"
                    >
                        T-Shirt Size
                    </label>
                    <select
                        id={tShirtSizeSelectId}
                        value={tShirtSize}
                        onChange={(e) => setTShirtSize(e.target.value as TShirtSize)}
                        className="w-full rounded border bg-white p-2 dark:bg-zinc-800"
                        disabled={isLoading}
                    >
                        {TSHIRT_SIZES.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex gap-2 pt-2">
                <Button
                    type="submit"
                    disabled={isLoading || !name.trim() || !role || !birthDate}
                >
                    <span className="inline-flex items-center gap-2">
                        {isLoading && (
                            <span
                                aria-hidden="true"
                                className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                            />
                        )}
                        {isLoading ? "Adding..." : "Add Member"}
                    </span>
                </Button>

                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isLoading}
                >
                    Cancel
                </Button>
            </div>
        </form>

    );
}
