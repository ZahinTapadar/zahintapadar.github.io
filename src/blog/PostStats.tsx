import React from 'react';
import { Eye, ThumbsUp } from 'lucide-react';
import type { PostStats } from './usePostStats';

const plural = (n: number, one: string, many: string) => `${n.toLocaleString('en')} ${n === 1 ? one : many}`;

// Compact counts for the post's meta row
export const StatsMeta: React.FC<{ stats: PostStats }> = ({ stats }) => {
    if (!stats.enabled || stats.views === null) return null;
    return (
        <>
            <span className="post-stat"><Eye size={14} strokeWidth={1.75} aria-hidden="true" />{plural(stats.views, 'view', 'views')}</span>
            <span className="post-stat"><ThumbsUp size={14} strokeWidth={1.75} aria-hidden="true" />{stats.likes ?? 0}</span>
        </>
    );
};

// The button at the end of a post
export const LikeButton: React.FC<{ stats: PostStats }> = ({ stats }) => {
    if (!stats.enabled || stats.likes === null) return null;
    return (
        <button
            className={`post-like${stats.liked ? ' is-liked' : ''}`}
            onClick={stats.toggleLike}
            aria-pressed={stats.liked}
            aria-label={stats.liked ? `Remove your thumbs up (${stats.likes})` : `Give this post a thumbs up (${stats.likes})`}
        >
            <ThumbsUp size={16} strokeWidth={1.75} aria-hidden="true" />
            <span>{stats.liked ? 'liked' : 'thumbs up'}</span>
            <span className="post-like-count">{stats.likes}</span>
        </button>
    );
};
