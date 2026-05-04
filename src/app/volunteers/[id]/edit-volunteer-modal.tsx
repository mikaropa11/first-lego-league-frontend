'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Volunteer } from '@/types/volunteer';

interface Props {
    volunteer: Volunteer;
    updateAction: (uri: string, data: Partial<Volunteer>) => Promise<{ success: boolean; error?: string }>;
}

const COUNTRY_CODES = [
    { code: '+34', label: '🇪🇸 ES' },
    { code: '+376', label: '🇦🇩 AD' },
    { code: '+33', label: '🇫🇷 FR' },
    { code: '+351', label: '🇵🇹 PT' },
    { code: '+44', label: '🇬🇧 UK' },
    { code: '+49', label: '🇩🇪 DE' },
    { code: '+39', label: '🇮🇹 IT' },
    { code: '+1', label: '🇺🇸 US' },
    { code: '+86', label: '🇨🇳 CN' },
    { code: '+52', label: '🇲🇽 MX' },
    { code: '+54', label: '🇦🇷 AR' },
    { code: '+57', label: '🇨🇴 CO' },
    { code: '+56', label: '🇨🇱 CL' },
];

export default function EditVolunteerModal({ volunteer, updateAction }: Readonly<Props>) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isOpen = searchParams.get('edit') === 'true';

    const [formData, setFormData] = useState(() => {
        const fullPhone = volunteer?.phoneNumber || '';
        const foundCountry = COUNTRY_CODES.find(c => fullPhone.startsWith(c.code));

        return {
            name: volunteer?.name || '',
            emailAddress: volunteer?.emailAddress || '',
            phoneNumber: foundCountry ? fullPhone.slice(foundCountry.code.length) : fullPhone,
            countryCode: foundCountry ? foundCountry.code : '+34',
            expert: volunteer?.expert || false,
        };
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const closeModal = () => router.replace(`/volunteers/${encodeURIComponent(volunteer.uri!)}`);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const onlyNums = e.target.value.replace(/\D/g, '');
        setFormData({ ...formData, phoneNumber: onlyNums });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const finalData = {
                ...formData,
                type: volunteer.type,
                phoneNumber: `${formData.countryCode}${formData.phoneNumber}`
            };

            const result = await updateAction(volunteer.uri!, finalData);
            if (result.success) {
                closeModal();
                router.refresh();
                return;
            }
            setError(result.error || 'Failed to update');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-zinc-900 dark:text-zinc-100">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <h2 className="text-xl font-bold mb-6 text-center">Edit Volunteer</h2>

                {error && (
                    <div className="mb-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1">
                        <label
                            htmlFor="volunteer-name"
                            className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 ml-1"
                        >
                            Full Name
                        </label>
                        <input
                            id="volunteer-name"
                            className="w-full border rounded-lg px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="John Doe"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="volunteer-email" className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 ml-1">
                            Email Address
                        </label>
                        <input
                            id="volunteer-email"
                            className="w-full border rounded-lg px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={formData.emailAddress}
                            onChange={e => setFormData({ ...formData, emailAddress: e.target.value })}
                            placeholder="email@example.com"
                            required
                            type="email"
                        />
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="volunteer-phone" className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 ml-1">
                            Phone Number
                        </label>
                        <div className="flex space-x-2">
                            <select
                                id="volunteer-country-code"
                                className="w-32 border rounded-lg px-2 py-2 bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer text-sm"
                                value={formData.countryCode}
                                onChange={e => setFormData({ ...formData, countryCode: e.target.value })}
                            >
                                {COUNTRY_CODES.map(c => (
                                    <option key={c.code} value={c.code}>{c.label} {c.code}</option>
                                ))}
                            </select>
                            <input
                                id="volunteer-phone"
                                className="flex-1 border rounded-lg px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={formData.phoneNumber}
                                onChange={handlePhoneChange}
                                placeholder="600123456"
                                type="tel"
                                inputMode="numeric"
                                maxLength={15}
                            />
                        </div>
                    </div>

                    {(volunteer.type === 'Judge' || volunteer.type === 'Referee') && (
                        <div className="pt-2">
                            <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={formData.expert}
                                    onChange={e => setFormData({ ...formData, expert: e.target.checked })}
                                    className="h-5 w-5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium">Is Expert {volunteer.type}</span>
                            </label>
                        </div>
                    )}

                    <div className="mt-8 flex justify-end space-x-3 border-t border-zinc-200 dark:border-zinc-800 pt-5">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-4 py-2 text-sm font-medium border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-md disabled:opacity-50 transition-all active:scale-95"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}