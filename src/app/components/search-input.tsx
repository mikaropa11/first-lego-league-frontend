'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useTransition } from 'react';

interface SearchInputProps {
    readonly defaultValue?: string;
    readonly placeholder?: string;
}

export default function SearchInput({ defaultValue = '', placeholder = 'Search...' }: SearchInputProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [, startTransition] = useTransition();

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value;
        const params = new URLSearchParams();
        if (value) params.set('search', value);
        params.set('page', '1');
        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    }

    return (
        <input
            type="search"
            defaultValue={defaultValue}
            onChange={handleChange}
            placeholder={placeholder}
            className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800"
        />
    );
}