// resources.updated_at advances on every view-count update, so it must not
// drive article modification dates or sitemap freshness signals.
export function getBlogModifiedAt(post = {}) {
  const publishedAt = post.published_at || post.created_at || null;
  const contentUpdatedAt = post.content_updated_at;
  const publishedTime = Date.parse(publishedAt);
  const contentTime = Date.parse(contentUpdatedAt);

  if (
    Number.isFinite(contentTime) &&
    (!Number.isFinite(publishedTime) || contentTime > publishedTime)
  ) {
    return contentUpdatedAt;
  }
  return publishedAt;
}

export function getVisibleBlogUpdatedAt(post = {}) {
  const publishedAt = post.published_at || post.created_at;
  const modifiedAt = getBlogModifiedAt(post);
  return Date.parse(modifiedAt) - Date.parse(publishedAt) >= 24 * 60 * 60 * 1000
    ? modifiedAt
    : null;
}
