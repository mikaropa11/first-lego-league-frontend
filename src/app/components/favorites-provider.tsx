"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
    FavoriteItem,
    isFavorite,
    loadFavorites,
    removeFavorite,
    saveFavorites,
    upsertFavorite,
} from "@/lib/favorites";

type FavoritesContextValue = {
    favorites: FavoriteItem[];
    addFavorite: (item: FavoriteItem) => void;
    removeFavoriteById: (type: FavoriteItem["type"], id: string) => void;
    toggleFavorite: (item: FavoriteItem) => void;
    isFavorite: (type: FavoriteItem["type"], id: string) => boolean;
};

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);
const FAVORITES_CHANGE_EVENT = "fll:favorites-change";

export function FavoritesProvider({ children }: Readonly<{ children: React.ReactNode }>) {
    const [favorites, setFavorites] = useState<FavoriteItem[]>(() => loadFavorites());

    useEffect(() => {
        function handleStorage() {
            setFavorites(loadFavorites());
        }

        function handleFavoritesChange() {
            setFavorites(loadFavorites());
        }

        window.addEventListener("storage", handleStorage);
        window.addEventListener(FAVORITES_CHANGE_EVENT, handleFavoritesChange as EventListener);

        return () => {
            window.removeEventListener("storage", handleStorage);
            window.removeEventListener(FAVORITES_CHANGE_EVENT, handleFavoritesChange as EventListener);
        };
    }, []);

    function persist(nextFavorites: FavoriteItem[]) {
        setFavorites(nextFavorites);
        saveFavorites(nextFavorites);

        if (typeof window !== "undefined") {
            window.dispatchEvent(new Event(FAVORITES_CHANGE_EVENT));
        }
    }

    const value = useMemo<FavoritesContextValue>(() => ({
        favorites,
        addFavorite(item) {
            persist(upsertFavorite(favorites, item));
        },
        removeFavoriteById(type, id) {
            persist(removeFavorite(favorites, { type, id }));
        },
        toggleFavorite(item) {
            if (isFavorite(favorites, item)) {
                persist(removeFavorite(favorites, item));
                return;
            }

            persist(upsertFavorite(favorites, item));
        },
        isFavorite(type, id) {
            return isFavorite(favorites, { type, id });
        },
    }), [favorites]);

    return (
        <FavoritesContext.Provider value={value}>
            {children}
        </FavoritesContext.Provider>
    );
}

export function useFavorites() {
    const ctx = useContext(FavoritesContext);
    if (!ctx) {
        throw new Error("useFavorites must be used within FavoritesProvider");
    }
    return ctx;
}
