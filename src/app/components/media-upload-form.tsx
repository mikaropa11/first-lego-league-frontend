'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addMediaBatch } from '@/app/editions/[id]/_add-media-actions';

interface MediaUploadFormProps {
    readonly editionId: string;
}

interface MediaRow {
    readonly id: string;
    readonly url: string;
    readonly type: string;
}

function createRow(): MediaRow {
    return { id: crypto.randomUUID(), url: '', type: 'image/jpeg' };
}

export default function MediaUploadForm({ editionId }: Readonly<MediaUploadFormProps>) {
    const router = useRouter();
    const [rows, setRows] = useState<MediaRow[]>([createRow()]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const addRow = () => setRows([...rows, createRow()]);

    const removeRow = (id: string) => {
        if (rows.length > 1) setRows(rows.filter(row => row.id !== id));
    };

    const updateRow = (id: string, field: 'url' | 'type', value: string) => {
        setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await addMediaBatch(
                rows.map(({ url, type }) => ({ url: url.trim(), type })),
                `/editions/${editionId}`
            );
            alert('Media uploaded successfully!');
            router.refresh();
        } catch (error) {
            alert('Error: ' + error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {rows.map(row => (
                <div key={row.id} className="flex gap-2 items-center">
                    <input
                        className="border p-2 rounded"
                        placeholder="URL"
                        value={row.url}
                        onChange={(e) => updateRow(row.id, 'url', e.target.value)}
                        required
                    />
                    <select
                        className="border p-2 rounded"
                        value={row.type}
                        onChange={(e) => updateRow(row.id, 'type', e.target.value)}
                    >
                        <option value="image/jpeg">Image</option>
                        <option value="video/mp4">Video</option>
                    </select>
                    <button type="button" className="text-red-500" onClick={() => removeRow(row.id)}>
                        Delete
                    </button>
                </div>
            ))}
            <button type="button" className="bg-gray-200 px-4 py-2 rounded" onClick={addRow}>
                + Add Row
            </button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded ml-2" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Submit Batch'}
            </button>
        </form>
    );
}
