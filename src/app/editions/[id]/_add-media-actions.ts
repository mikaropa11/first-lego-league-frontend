'use server';

import { MediaService } from '@/api/mediaApi';
import { serverAuthProvider } from '@/lib/authProvider';

export async function addMedia(imageUrl: string, editionUri: string, type: string): Promise<void> {
    const service = new MediaService(serverAuthProvider);
    await service.createMedia({ url: imageUrl, type, edition: editionUri });
}

export async function addMediaBatch(
    mediaRows: readonly Readonly<{ url: string; type: string }>[],
    editionUri: string
): Promise<void> {
    const service = new MediaService(serverAuthProvider);
    await Promise.all(
        mediaRows
            .filter(media => media.url)
            .map(media => service.createMedia({ url: media.url, type: media.type, edition: editionUri }))
    );
}
