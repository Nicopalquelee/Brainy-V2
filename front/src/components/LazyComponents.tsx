import { lazy } from 'react';

// Lazy load components that are not immediately needed
export const LazyChatSidebar = lazy(() => import('./ChatSidebar'));
export const LazyUploadNote = lazy(() => import('./UploadNote'));
export const LazyNotesGrid = lazy(() => import('./NotesGrid'));
export const LazyStatsCard = lazy(() => import('./StatsCard'));


