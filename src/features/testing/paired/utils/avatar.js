export function initials(name) {
  const cleaned = (name || '?').replace(/[()]/g, '').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
}

export function getMemberAvatarUrl(member, isMine = false, userProfile = null) {
  const custom =
    (isMine ? userProfile?.avatar_url || userProfile?.avatar : null) ||
    member?.avatar_url ||
    member?.avatar;
  if (custom) return custom;
  const seed = (member?.display_name || member?.user_id || 'student').replace(/[()]/g, '').trim();
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed || 'student')}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}
