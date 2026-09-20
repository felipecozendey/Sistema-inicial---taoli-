import { supabase } from '@/lib/supabase/client'

export interface PublicProfile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  banner_url: string | null
  bio: string | null
  motivational_phrase: string | null
  is_private: boolean
  is_banned: boolean
  created_at: string
  // Computed counters
  followers_count?: number
  following_count?: number
  posts_count?: number
  is_following?: boolean
  is_blocked?: boolean
}

export interface SocialPost {
  id: string
  author_id: string
  kind: 'photo' | 'reminder'
  content: string | null
  image_url: string | null
  created_at: string
  is_deleted: boolean
  author?: PublicProfile
}

export interface ModerationAction {
  id: string
  actor_id: string
  action:
    | 'delete_post'
    | 'restore_post'
    | 'ban_user'
    | 'unban_user'
    | 'delete_group_post'
    | 'restore_group_post'
    | 'delete_group'
    | 'pin_group_post'
    | 'unpin_group_post'
    | 'create_group_poll'
    | 'delete_group_poll'
    | 'tag_member'
    | 'remove_member_tag'
    | 'remove_group_member'
  target_user_id: string | null
  target_post_id: string | null
  details: Record<string, any>
  created_at: string
  actor?: {
    email?: string
    display_name?: string
  }
}

export interface SocialGroup {
  id: string
  name: string
  description: string | null
  cover_url: string | null
  created_by: string
  is_closed: boolean
  is_deleted: boolean
  created_at: string
  members_count?: number
  current_user_status?: 'member' | 'pending' | null
  current_user_role?: 'owner' | 'member' | null
  owner?: PublicProfile
}

export interface GroupMember {
  group_id: string
  user_id: string
  status: 'member' | 'pending'
  role: 'owner' | 'member'
  joined_at: string
  user?: PublicProfile
}

export interface GroupPost {
  id: string
  group_id: string
  author_id: string
  kind: 'photo' | 'reminder'
  content: string | null
  image_url: string | null
  created_at: string
  is_deleted: boolean
  pinned_at?: string | null
  pinned_by?: string | null
  pinned_by_user?: PublicProfile | null
  author?: PublicProfile
  author_tag?: GroupMemberTag | null
  group?: {
    id: string
    name: string
    cover_url: string | null
  }
}

export interface GroupPollOption {
  id: string
  poll_id: string
  option_text: string
  position: number
  created_at: string
  vote_count?: number
  percentage?: number
  voters?: PublicProfile[]
}

export interface GroupPoll {
  id: string
  group_id: string
  question: string
  created_by: string
  closes_at: string | null
  is_deleted: boolean
  created_at: string
  creator?: PublicProfile
  options: GroupPollOption[]
  user_voted_option_id?: string | null
  total_votes?: number
  participation_rate?: number // voters / active_members
  is_closed?: boolean
}

export interface GroupMemberTag {
  id: string
  group_id: string
  user_id: string
  label: string
  color: string
  expires_at: string | null
  created_by: string
  created_at: string
  is_expired?: boolean
  creator?: PublicProfile
  group?: {
    id: string
    name: string
  }
}

export interface GroupMemberEvent {
  id: string
  group_id: string
  user_id: string
  event: 'joined' | 'left' | 'removed' | 'approved' | 'rejected' | 'request_sent'
  actor_id: string | null
  created_at: string
  user?: PublicProfile
  actor?: PublicProfile
  group?: {
    id: string
    name: string
  }
}

export interface GroupAdminMetrics {
  period: '7d' | '30d' | 'all'
  joined_count: number
  left_count: number
  removed_count: number
  posts_count: number
  posts_per_day: number
  active_members: number
  pending_members: number
  approval_rate: number // approved / (approved + rejected)
  activity_timeline: { date: string; posts: number; joined: number; votes: number }[]
  top_active_members: {
    user: PublicProfile
    post_count: number
    vote_count: number
    total_interactions: number
    tags?: GroupMemberTag[]
  }[]
}

// 1. Upload files to 'social' bucket (avatars, banners, posts, groups)
export async function uploadSocialImage(
  file: File,
  folder: 'avatars' | 'banners' | 'posts' | 'groups',
  userId: string,
): Promise<string> {
  const maxBytes = 5 * 1024 * 1024 // 5MB limit
  if (file.size > maxBytes) {
    throw new Error('A imagem deve ter no máximo 5MB.')
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!validTypes.includes(file.type)) {
    throw new Error('Formato inválido. Use JPG, PNG ou WEBP.')
  }

  const extension = file.name.split('.').pop() || 'jpg'
  const filename = `${folder}/${userId}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${extension}`

  const { error: uploadError } = await supabase.storage.from('social').upload(filename, file, {
    cacheControl: '3600',
    upsert: true,
  })

  if (uploadError) {
    throw uploadError
  }

  const { data } = supabase.storage.from('social').getPublicUrl(filename)
  return data.publicUrl
}

// 2. Check username availability
export async function checkUsernameAvailability(
  username: string,
  currentUserId?: string,
): Promise<boolean> {
  const clean = username.trim().toLowerCase()
  if (!clean || clean.length < 3 || clean.length > 24) return false
  if (!/^[a-z0-9._]+$/.test(clean)) return false

  const { data, error } = await (supabase.rpc as any)('check_username_available', {
    target_username: clean,
    current_user_id: currentUserId || null,
  })

  if (error) {
    // fallback direct query
    let query = (supabase.from as any)('profiles').select('id').eq('username', clean)

    if (currentUserId) {
      query = query.neq('id', currentUserId)
    }

    const res = await query.maybeSingle()
    return !res.data
  }

  return Boolean(data)
}

// 3. Get Public Profile by username or id
export async function getPublicProfile(
  identifier: { username?: string; id?: string },
  currentUserId?: string,
): Promise<PublicProfile | null> {
  let query = (supabase.from as any)('public_profiles').select('*')

  if (identifier.username) {
    query = query.eq('username', identifier.username.toLowerCase())
  } else if (identifier.id) {
    query = query.eq('id', identifier.id)
  } else {
    return null
  }

  const { data, error } = await query.maybeSingle()
  if (error || !data) return null

  const profile = data as PublicProfile

  // Get counters in parallel
  const [followersRes, followingRes, postsRes, followCheck, blockCheck] = await Promise.all([
    (supabase.from as any)('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', profile.id),
    (supabase.from as any)('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', profile.id),
    (supabase.from as any)('posts')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', profile.id)
      .eq('is_deleted', false),
    currentUserId && currentUserId !== profile.id
      ? (supabase.from as any)('follows')
          .select('follower_id')
          .eq('follower_id', currentUserId)
          .eq('following_id', profile.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    currentUserId && currentUserId !== profile.id
      ? (supabase.from as any)('user_blocks')
          .select('blocker_id')
          .eq('blocker_id', currentUserId)
          .eq('blocked_id', profile.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  profile.followers_count = (followersRes as any)?.count || 0
  profile.following_count = (followingRes as any)?.count || 0
  profile.posts_count = (postsRes as any)?.count || 0
  profile.is_following = Boolean((followCheck as any)?.data)
  profile.is_blocked = Boolean((blockCheck as any)?.data)

  return profile
}

// 4. Update Profile
export async function updateSocialProfile(
  userId: string,
  payload: {
    display_name?: string
    username?: string
    avatar_url?: string
    banner_url?: string
    bio?: string
    motivational_phrase?: string
    is_private?: boolean
  },
) {
  const { error } = await (supabase.from as any)('profiles')
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) throw error
}

// 5. Follow / Unfollow
export async function followUser(followerId: string, followingId: string) {
  const { error } = await (supabase.from as any)('follows').insert({
    follower_id: followerId,
    following_id: followingId,
  })
  if (error) throw error
}

export async function unfollowUser(followerId: string, followingId: string) {
  const { error } = await (supabase.from as any)('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
  if (error) throw error
}

// 6. Block / Unblock User
export async function blockUser(blockerId: string, blockedId: string) {
  // Also remove follows mutually
  await (supabase.from as any)('follows')
    .delete()
    .or(
      `and(follower_id.eq.${blockerId},following_id.eq.${blockedId}),and(follower_id.eq.${blockedId},following_id.eq.${blockerId})`,
    )

  const { error } = await (supabase.from as any)('user_blocks').insert({
    blocker_id: blockerId,
    blocked_id: blockedId,
  })
  if (error) throw error
}

export async function unblockUser(blockerId: string, blockedId: string) {
  const { error } = await (supabase.from as any)('user_blocks')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId)
  if (error) throw error
}

// 7. Search users by name or @
export async function searchUsers(
  queryText: string,
  currentUserId?: string,
): Promise<PublicProfile[]> {
  const clean = queryText.trim().toLowerCase()

  // First get users blocked by or blocking current user
  let blockedUserIds: string[] = []
  if (currentUserId) {
    const { data: blocks } = await (supabase.from as any)('user_blocks')
      .select('blocker_id, blocked_id')
      .or(`blocker_id.eq.${currentUserId},blocked_id.eq.${currentUserId}`)

    if (blocks) {
      blockedUserIds = (blocks as any[]).map((b: any) =>
        b.blocker_id === currentUserId ? b.blocked_id : b.blocker_id,
      )
    }
  }

  let query = (supabase.from as any)('public_profiles').select('*').eq('is_banned', false)

  if (clean) {
    query = query.or(`username.ilike.%${clean}%,display_name.ilike.%${clean}%`)
  } else {
    // suggestions: recent users
    query = query.order('created_at', { ascending: false }).limit(10)
  }

  const { data, error } = await query.limit(20)
  if (error || !data) return []

  const filtered = (data as PublicProfile[]).filter((p) => !blockedUserIds.includes(p.id))

  // Attach is_following if current user
  if (currentUserId && filtered.length > 0) {
    const { data: myFollows } = await (supabase.from as any)('follows')
      .select('following_id')
      .eq('follower_id', currentUserId)
      .in(
        'following_id',
        filtered.map((p) => p.id),
      )

    const followingSet = new Set(((myFollows as any[]) || []).map((f) => f.following_id))
    for (const p of filtered) {
      p.is_following = followingSet.has(p.id)
    }
  }

  return filtered
}

// 8. Feed posts (my posts + who I follow)
export async function getFeedPosts(
  currentUserId: string,
  page = 0,
  pageSize = 10,
): Promise<SocialPost[]> {
  // 1. Get who current user is following
  const { data: follows } = await (supabase.from as any)('follows')
    .select('following_id')
    .eq('follower_id', currentUserId)

  const allowedAuthorIds = [currentUserId, ...((follows as any[]) || []).map((f) => f.following_id)]

  const from = page * pageSize
  const to = from + pageSize - 1

  const { data: postsData, error } = await (supabase.from as any)('posts')
    .select('*')
    .in('author_id', allowedAuthorIds)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error || !postsData) return []

  // Fetch author public profiles
  const authorIds = Array.from(new Set((postsData as any[]).map((p) => p.author_id)))
  const { data: authors } = await (supabase.from as any)('public_profiles')
    .select('*')
    .in('id', authorIds)

  const authorMap = new Map(((authors as any[]) || []).map((a) => [a.id, a as PublicProfile]))

  return (postsData as any[]).map((p) => ({
    ...p,
    author: authorMap.get(p.author_id),
  }))
}

// 9. User profile posts
export async function getUserPosts(authorId: string): Promise<SocialPost[]> {
  const { data, error } = await (supabase.from as any)('posts')
    .select('*')
    .eq('author_id', authorId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data as SocialPost[]
}

// 10. Create post
export async function createPost(
  authorId: string,
  kind: 'photo' | 'reminder',
  content?: string,
  imageUrl?: string,
): Promise<SocialPost> {
  const { data, error } = await (supabase.from as any)('posts')
    .insert({
      author_id: authorId,
      kind,
      content: content?.trim() || null,
      image_url: imageUrl || null,
    })
    .select()
    .single()

  if (error) throw error
  return data as SocialPost
}

// 11. Delete own post (soft delete)
export async function deleteOwnPost(postId: string, userId: string) {
  const { error } = await (supabase.from as any)('posts')
    .update({ is_deleted: true })
    .eq('id', postId)
    .eq('author_id', userId)

  if (error) throw error
}

// 12. Master moderation
export async function masterModeratePost(postId: string, deleteIt: boolean, reason?: string) {
  const { error } = await (supabase.rpc as any)('master_moderate_post', {
    target_post_id: postId,
    delete_it: deleteIt,
    reason: reason || 'Moderação Master',
  })
  if (error) throw error
}

export async function masterSetUserBan(targetUserId: string, banned: boolean, reason?: string) {
  const { error } = await (supabase.rpc as any)('master_set_user_ban', {
    target_id: targetUserId,
    banned,
    reason: reason || 'Moderação Master',
  })
  if (error) throw error
}

export async function getMasterModerationFeed(
  includeDeleted = true,
  typeFilter: 'all' | 'photo' | 'reminder' = 'all',
  authorSearch = '',
): Promise<{ posts: SocialPost[]; actions: ModerationAction[] }> {
  let query = (supabase.from as any)('posts').select('*').order('created_at', { ascending: false })

  if (!includeDeleted) {
    query = query.eq('is_deleted', false)
  }

  if (typeFilter !== 'all') {
    query = query.eq('kind', typeFilter)
  }

  const { data: postsData, error } = await query.limit(100)
  if (error || !postsData) return { posts: [], actions: [] }

  // Authors
  const authorIds = Array.from(new Set((postsData as any[]).map((p) => p.author_id)))
  const { data: authors } = await (supabase.from as any)('profiles')
    .select('id, username, display_name, email, avatar_url, is_banned')
    .in('id', authorIds)

  const authorMap = new Map(((authors as any[]) || []).map((a) => [a.id, a]))

  let mappedPosts: SocialPost[] = (postsData as any[]).map((p) => {
    const a = authorMap.get(p.author_id)
    return {
      ...p,
      author: a
        ? {
            id: a.id,
            username: a.username || 'user',
            display_name: a.display_name,
            avatar_url: a.avatar_url,
            banner_url: null,
            bio: null,
            motivational_phrase: null,
            is_private: false,
            is_banned: Boolean(a.is_banned),
            created_at: '',
          }
        : undefined,
    }
  })

  if (authorSearch.trim()) {
    const q = authorSearch.trim().toLowerCase()
    mappedPosts = mappedPosts.filter(
      (p) =>
        p.author?.username?.toLowerCase().includes(q) ||
        p.author?.display_name?.toLowerCase().includes(q),
    )
  }

  // Get moderation actions
  const { data: actionsData } = await (supabase.from as any)('moderation_actions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  return {
    posts: mappedPosts,
    actions: (actionsData as ModerationAction[]) || [],
  }
}

// 13. Groups Management and Fetching
export async function getGroupsList(
  currentUserId: string,
  filter: 'all' | 'my' = 'all',
  searchQuery = '',
): Promise<SocialGroup[]> {
  let query = (supabase.from as any)('groups')
    .select('*')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  if (searchQuery.trim()) {
    query = query.ilike('name', `%${searchQuery.trim()}%`)
  }

  const { data: groupsData, error } = await query
  if (error || !groupsData) return []

  const groupIds = (groupsData as any[]).map((g) => g.id)
  if (groupIds.length === 0) return []

  // Fetch current user memberships
  const { data: userMemberships } = await (supabase.from as any)('group_members')
    .select('group_id, status, role')
    .eq('user_id', currentUserId)
    .in('group_id', groupIds)

  const membershipMap = new Map<
    string,
    { status: 'member' | 'pending'; role: 'owner' | 'member' }
  >()
  for (const m of (userMemberships as any[]) || []) {
    membershipMap.set(m.group_id, { status: m.status, role: m.role })
  }

  // Fetch member counts for these groups (only status='member')
  const { data: memberCounts } = await (supabase.from as any)('group_members')
    .select('group_id')
    .eq('status', 'member')
    .in('group_id', groupIds)

  const countMap = new Map<string, number>()
  for (const mc of (memberCounts as any[]) || []) {
    countMap.set(mc.group_id, (countMap.get(mc.group_id) || 0) + 1)
  }

  // Fetch owners public profiles
  const ownerIds = Array.from(new Set((groupsData as any[]).map((g) => g.created_by)))
  const { data: owners } = await (supabase.from as any)('public_profiles')
    .select('*')
    .in('id', ownerIds)
  const ownerMap = new Map<string, PublicProfile>()
  for (const o of (owners as any[]) || []) {
    ownerMap.set(o.id, o as PublicProfile)
  }

  const result: SocialGroup[] = (groupsData as any[]).map((g) => {
    const mem = membershipMap.get(g.id)
    return {
      ...g,
      members_count: countMap.get(g.id) || 0,
      current_user_status: mem?.status || null,
      current_user_role: mem?.role || null,
      owner: ownerMap.get(g.created_by),
    }
  })

  if (filter === 'my') {
    return result.filter(
      (g) => g.current_user_status === 'member' || g.created_by === currentUserId,
    )
  }

  return result
}

export async function getGroupDetails(
  groupId: string,
  currentUserId?: string,
): Promise<SocialGroup | null> {
  const { data: group, error } = await (supabase.from as any)('groups')
    .select('*')
    .eq('id', groupId)
    .single()

  if (error || !group) return null

  // Count active members
  const { count: memberCount } = await (supabase.from as any)('group_members')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', groupId)
    .eq('status', 'member')

  // Owner profile
  const { data: owner } = await (supabase.from as any)('public_profiles')
    .select('*')
    .eq('id', group.created_by)
    .maybeSingle()

  let currentMem: { status: 'member' | 'pending'; role: 'owner' | 'member' } | null = null
  if (currentUserId) {
    const { data: mem } = await (supabase.from as any)('group_members')
      .select('status, role')
      .eq('group_id', groupId)
      .eq('user_id', currentUserId)
      .maybeSingle()
    if (mem) currentMem = mem
  }

  return {
    ...group,
    members_count: memberCount || 0,
    current_user_status: currentMem?.status || null,
    current_user_role: currentMem?.role || null,
    owner: owner as PublicProfile | undefined,
  }
}

export async function createSocialGroup(
  creatorId: string,
  data: {
    name: string
    description?: string
    coverUrl?: string
    isClosed?: boolean
  },
): Promise<SocialGroup> {
  const cleanName = data.name.trim()
  if (!cleanName) {
    throw new Error('O nome do grupo é obrigatório.')
  }
  if (cleanName.length > 60) {
    throw new Error('O nome do grupo deve ter no máximo 60 caracteres.')
  }

  const { data: newGroup, error: groupError } = await (supabase.from as any)('groups')
    .insert({
      name: cleanName,
      description: data.description?.trim() || null,
      cover_url: data.coverUrl || null,
      created_by: creatorId,
      is_closed: Boolean(data.isClosed),
    })
    .select()
    .single()

  if (groupError) throw groupError

  // Insert creator as owner + member in group_members
  const { error: memberError } = await (supabase.from as any)('group_members').insert({
    group_id: newGroup.id,
    user_id: creatorId,
    status: 'member',
    role: 'owner',
  })

  if (memberError) {
    console.error('Erro ao adicionar dono como membro:', memberError)
  }

  return {
    ...newGroup,
    members_count: 1,
    current_user_status: 'member',
    current_user_role: 'owner',
  }
}

export async function joinOrRequestGroup(
  groupId: string,
  userId: string,
  isClosed: boolean,
): Promise<'member' | 'pending'> {
  const targetStatus = isClosed ? 'pending' : 'member'

  const { error } = await (supabase.from as any)('group_members').insert({
    group_id: groupId,
    user_id: userId,
    status: targetStatus,
    role: 'member',
  })

  if (error) throw error
  return targetStatus
}

export async function leaveGroup(groupId: string, userId: string) {
  const { error } = await (supabase.from as any)('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function getGroupMembersList(groupId: string): Promise<GroupMember[]> {
  const { data: members, error } = await (supabase.from as any)('group_members')
    .select('*')
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true })

  if (error || !members) return []

  const userIds = (members as any[]).map((m) => m.user_id)
  const { data: profiles } = await (supabase.from as any)('public_profiles')
    .select('*')
    .in('id', userIds)

  const profileMap = new Map<string, PublicProfile>()
  for (const p of (profiles as any[]) || []) {
    profileMap.set(p.id, p as PublicProfile)
  }

  return (members as any[]).map((m) => ({
    ...m,
    user: profileMap.get(m.user_id),
  }))
}

export async function updateGroupMemberStatus(
  groupId: string,
  targetUserId: string,
  newStatus: 'member' | 'reject',
) {
  if (newStatus === 'reject') {
    const { error } = await (supabase.from as any)('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', targetUserId)
    if (error) throw error
  } else {
    const { error } = await (supabase.from as any)('group_members')
      .update({ status: 'member' })
      .eq('group_id', groupId)
      .eq('user_id', targetUserId)
    if (error) throw error
  }
}

export async function removeGroupMember(groupId: string, targetUserId: string) {
  const { error } = await (supabase.from as any)('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', targetUserId)

  if (error) throw error
}

// 14. Group Posts
export async function getGroupPosts(groupId: string): Promise<GroupPost[]> {
  const { data: posts, error } = await (supabase.from as any)('group_posts')
    .select('*')
    .eq('group_id', groupId)
    .eq('is_deleted', false)
    .order('pinned_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error || !posts) return []

  const authorIds = Array.from(new Set((posts as any[]).map((p) => p.author_id)))
  const pinnerIds = Array.from(
    new Set((posts as any[]).filter((p) => p.pinned_by).map((p) => p.pinned_by)),
  )
  const allUserIds = Array.from(new Set([...authorIds, ...pinnerIds]))

  const [{ data: profiles }, { data: tags }] = await Promise.all([
    (supabase.from as any)('public_profiles').select('*').in('id', allUserIds),
    (supabase.from as any)('group_member_tags')
      .select('*')
      .eq('group_id', groupId)
      .in('user_id', authorIds),
  ])

  const profileMap = new Map<string, PublicProfile>()
  for (const p of (profiles as any[]) || []) {
    profileMap.set(p.id, p as PublicProfile)
  }

  const nowStr = new Date().toISOString()
  const tagMap = new Map<string, GroupMemberTag>()
  for (const t of (tags as any[]) || []) {
    // only active non-expired tag
    if (!t.expires_at || t.expires_at > nowStr) {
      tagMap.set(t.user_id, t as GroupMemberTag)
    }
  }

  return (posts as any[]).map((p) => ({
    ...p,
    author: profileMap.get(p.author_id),
    pinned_by_user: p.pinned_by ? profileMap.get(p.pinned_by) : null,
    author_tag: tagMap.get(p.author_id) || null,
  }))
}

// 14.1 Pin / Unpin Group Post
export async function pinGroupPostAction(groupId: string, postId: string) {
  const { error } = await (supabase.rpc as any)('pin_group_post', {
    p_group_id: groupId,
    p_post_id: postId,
  })
  if (error) throw error
}

export async function unpinGroupPostAction(groupId: string, postId: string) {
  const { error } = await (supabase.rpc as any)('unpin_group_post', {
    p_group_id: groupId,
    p_post_id: postId,
  })
  if (error) throw error
}

// 14.2 Group Polls API
export async function getGroupPolls(
  groupId: string,
  currentUserId?: string,
  isOwner = false,
): Promise<GroupPoll[]> {
  const { data: rawPolls, error } = await (supabase.from as any)('group_polls')
    .select('*')
    .eq('group_id', groupId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  if (error || !rawPolls || rawPolls.length === 0) return []

  const pollIds = (rawPolls as any[]).map((p) => p.id)

  // Fetch options
  const { data: optionsData } = await (supabase.from as any)('group_poll_options')
    .select('*')
    .in('poll_id', pollIds)
    .order('position', { ascending: true })

  const optionsList = (optionsData as any[]) || []

  // Fetch votes: if owner, fetch all votes with voter details. If regular member, fetch aggregated counts + user's own vote
  let votesList: any[] = []
  if (isOwner) {
    const { data: rawVotes } = await (supabase.from as any)('group_poll_votes')
      .select('poll_id, option_id, user_id, created_at')
      .in('poll_id', pollIds)
    votesList = rawVotes || []
  } else if (currentUserId) {
    const { data: myVotes } = await (supabase.from as any)('group_poll_votes')
      .select('poll_id, option_id, user_id, created_at')
      .in('poll_id', pollIds)
      .eq('user_id', currentUserId)
    votesList = myVotes || []
  }

  // Voter profiles if owner
  const voterProfileMap = new Map<string, PublicProfile>()
  if (isOwner && votesList.length > 0) {
    const voterIds = Array.from(new Set(votesList.map((v) => v.user_id)))
    const { data: voterProfiles } = await (supabase.from as any)('public_profiles')
      .select('*')
      .in('id', voterIds)
    for (const vp of (voterProfiles as any[]) || []) {
      voterProfileMap.set(vp.id, vp as PublicProfile)
    }
  }

  // Also get aggregated vote counts per option from RPC get_group_poll_results
  const optionCountMap = new Map<string, number>()
  await Promise.all(
    pollIds.map(async (pid) => {
      try {
        const { data: results } = await (supabase.rpc as any)('get_group_poll_results', {
          p_poll_id: pid,
        })
        if (results && Array.isArray(results)) {
          for (const r of results) {
            optionCountMap.set(r.option_id, Number(r.vote_count) || 0)
          }
        }
      } catch (err) {
        // fallback to votesList count if RPC fails
        console.warn('Fallback get_group_poll_results:', err)
      }
    }),
  )

  // Fetch active member count for participation rate
  const { count: activeMembersCount } = await (supabase.from as any)('group_members')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', groupId)
    .eq('status', 'member')

  const nowIso = new Date().toISOString()

  return (rawPolls as any[]).map((poll) => {
    const pOptions = optionsList.filter((o) => o.poll_id === poll.id)
    const pVotes = votesList.filter((v) => v.poll_id === poll.id)
    const myVote = currentUserId ? pVotes.find((v) => v.user_id === currentUserId) : null

    // compute total votes
    let totalVotes = 0
    pOptions.forEach((opt) => {
      const cnt = optionCountMap.has(opt.id)
        ? optionCountMap.get(opt.id)!
        : isOwner
          ? pVotes.filter((v) => v.option_id === opt.id).length
          : 0
      totalVotes += cnt
    })

    const mappedOptions: GroupPollOption[] = pOptions.map((opt) => {
      const cnt = optionCountMap.has(opt.id)
        ? optionCountMap.get(opt.id)!
        : isOwner
          ? pVotes.filter((v) => v.option_id === opt.id).length
          : 0
      const pct = totalVotes > 0 ? Math.round((cnt / totalVotes) * 100) : 0
      const optionVoters = isOwner
        ? (pVotes
            .filter((v) => v.option_id === opt.id)
            .map((v) => voterProfileMap.get(v.user_id))
            .filter(Boolean) as PublicProfile[])
        : undefined

      return {
        ...opt,
        vote_count: cnt,
        percentage: pct,
        voters: optionVoters,
      }
    })

    const isClosed = Boolean(poll.closes_at && poll.closes_at <= nowIso)
    const activeTotal = activeMembersCount || 1
    const participationRate =
      totalVotes > 0 ? Math.min(100, Math.round((totalVotes / activeTotal) * 100)) : 0

    return {
      ...poll,
      options: mappedOptions,
      user_voted_option_id: myVote?.option_id || null,
      total_votes: totalVotes,
      participation_rate: participationRate,
      is_closed: isClosed,
    }
  })
}

export async function createGroupPoll(
  groupId: string,
  creatorId: string,
  question: string,
  options: string[],
  closesAt?: string | null,
): Promise<GroupPoll> {
  const cleanQ = question.trim()
  if (!cleanQ) throw new Error('A pergunta da enquete é obrigatória.')
  const cleanOpts = options.map((o) => o.trim()).filter(Boolean)
  if (cleanOpts.length < 2 || cleanOpts.length > 6) {
    throw new Error('A enquete deve ter entre 2 e 6 opções.')
  }

  // 1. Insert poll
  const { data: newPoll, error: pollErr } = await (supabase.from as any)('group_polls')
    .insert({
      group_id: groupId,
      question: cleanQ,
      created_by: creatorId,
      closes_at: closesAt || null,
    })
    .select()
    .single()

  if (pollErr) throw pollErr

  // 2. Insert options
  const optionPayloads = cleanOpts.map((text, idx) => ({
    poll_id: newPoll.id,
    option_text: text,
    position: idx,
  }))

  const { data: createdOptions, error: optErr } = await (supabase.from as any)('group_poll_options')
    .insert(optionPayloads)
    .select()

  if (optErr) throw optErr

  // 3. Audit in moderation_actions
  await (supabase.from as any)('moderation_actions').insert({
    actor_id: creatorId,
    action: 'create_group_poll',
    details: {
      group_id: groupId,
      poll_id: newPoll.id,
      question: cleanQ,
      timestamp: new Date().toISOString(),
    },
  })

  return {
    ...newPoll,
    options: (createdOptions as any[]).map((o) => ({
      ...o,
      vote_count: 0,
      percentage: 0,
    })),
    total_votes: 0,
    user_voted_option_id: null,
    is_closed: false,
  }
}

export async function voteGroupPoll(pollId: string, optionId: string, userId: string) {
  // Upsert vote (PK: poll_id, user_id)
  const { error } = await (supabase.from as any)('group_poll_votes').upsert(
    {
      poll_id: pollId,
      option_id: optionId,
      user_id: userId,
      created_at: new Date().toISOString(),
    },
    { onConflict: 'poll_id,user_id' },
  )

  if (error) throw error
}

export async function closeGroupPoll(pollId: string) {
  const { error } = await (supabase.from as any)('group_polls')
    .update({ closes_at: new Date().toISOString() })
    .eq('id', pollId)

  if (error) throw error
}

export async function deleteGroupPoll(pollId: string, userId: string, groupId: string) {
  const { error } = await (supabase.from as any)('group_polls')
    .update({ is_deleted: true })
    .eq('id', pollId)

  if (error) throw error

  await (supabase.from as any)('moderation_actions').insert({
    actor_id: userId,
    action: 'delete_group_poll',
    details: {
      group_id: groupId,
      poll_id: pollId,
      timestamp: new Date().toISOString(),
    },
  })
}

// 14.3 Group Member Tags API
export async function getGroupMemberTags(
  groupId: string,
  includeExpired = false,
): Promise<GroupMemberTag[]> {
  let query = (supabase.from as any)('group_member_tags')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })

  const { data: rawTags, error } = await query
  if (error || !rawTags) return []

  const nowIso = new Date().toISOString()
  const userIds = Array.from(new Set((rawTags as any[]).map((t) => t.user_id)))
  const { data: profiles } = await (supabase.from as any)('public_profiles')
    .select('*')
    .in('id', userIds)

  const profileMap = new Map<string, PublicProfile>()
  for (const p of (profiles as any[]) || []) {
    profileMap.set(p.id, p as PublicProfile)
  }

  const mapped = (rawTags as any[]).map((t) => ({
    ...t,
    is_expired: Boolean(t.expires_at && t.expires_at <= nowIso),
    creator: profileMap.get(t.created_by),
  }))

  if (!includeExpired) {
    return mapped.filter((t) => !t.is_expired)
  }
  return mapped
}

export async function addMemberTag(
  groupId: string,
  userId: string,
  creatorId: string,
  label: string,
  color: string,
  expiresAt?: string | null,
): Promise<GroupMemberTag> {
  const clean = label.trim()
  if (!clean) throw new Error('A tag deve ter um rótulo.')

  const { data: newTag, error } = await (supabase.from as any)('group_member_tags')
    .insert({
      group_id: groupId,
      user_id: userId,
      label: clean,
      color: color || '#58CC02',
      expires_at: expiresAt || null,
      created_by: creatorId,
    })
    .select()
    .single()

  if (error) throw error

  // Log in moderation_actions
  await (supabase.from as any)('moderation_actions').insert({
    actor_id: creatorId,
    action: 'tag_member',
    target_user_id: userId,
    details: {
      group_id: groupId,
      tag_id: newTag.id,
      label: clean,
      color: color || '#58CC02',
      expires_at: expiresAt || null,
      timestamp: new Date().toISOString(),
    },
  })

  return newTag as GroupMemberTag
}

export async function removeMemberTag(tagId: string, actorId: string, groupId: string) {
  const { data: existingTag } = await (supabase.from as any)('group_member_tags')
    .select('*')
    .eq('id', tagId)
    .maybeSingle()

  const { error } = await (supabase.from as any)('group_member_tags').delete().eq('id', tagId)
  if (error) throw error

  if (existingTag) {
    await (supabase.from as any)('moderation_actions').insert({
      actor_id: actorId,
      action: 'remove_member_tag',
      target_user_id: existingTag.user_id,
      details: {
        group_id: groupId,
        tag_id: tagId,
        label: existingTag.label,
        timestamp: new Date().toISOString(),
      },
    })
  }
}

// 14.4 Group Member Events API (History of entries, exits, removals)
export async function getGroupMemberEvents(groupId: string): Promise<GroupMemberEvent[]> {
  const { data: rawEvents, error } = await (supabase.from as any)('group_member_events')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })

  if (error || !rawEvents) return []

  const userIds = Array.from(
    new Set((rawEvents as any[]).flatMap((e) => [e.user_id, e.actor_id]).filter(Boolean)),
  )

  const { data: profiles } = await (supabase.from as any)('public_profiles')
    .select('*')
    .in('id', userIds)

  const profileMap = new Map<string, PublicProfile>()
  for (const p of (profiles as any[]) || []) {
    profileMap.set(p.id, p as PublicProfile)
  }

  return (rawEvents as any[]).map((e) => ({
    ...e,
    user: profileMap.get(e.user_id),
    actor: e.actor_id ? profileMap.get(e.actor_id) : undefined,
  }))
}

// 14.5 Group Administration Metrics & Activity Timeline
export async function getGroupAdminMetrics(
  groupId: string,
  period: '7d' | '30d' | 'all' = '30d',
): Promise<GroupAdminMetrics> {
  const now = new Date()
  let cutoffDate: Date | null = null
  let daysCount = 30

  if (period === '7d') {
    cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    daysCount = 7
  } else if (period === '30d') {
    cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    daysCount = 30
  }

  const cutoffIso = cutoffDate ? cutoffDate.toISOString() : null

  // Fetch parallel datasets
  const [eventsRes, postsRes, membersRes, tagsRes, pollsRes] = await Promise.all([
    (supabase.from as any)('group_member_events')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true }),
    (supabase.from as any)('group_posts')
      .select('id, author_id, created_at, is_deleted')
      .eq('group_id', groupId)
      .eq('is_deleted', false),
    (supabase.from as any)('group_members').select('user_id, status').eq('group_id', groupId),
    (supabase.from as any)('group_member_tags').select('*').eq('group_id', groupId),
    (supabase.from as any)('group_polls')
      .select('id')
      .eq('group_id', groupId)
      .eq('is_deleted', false),
  ])

  const allEvents = (eventsRes.data as any[]) || []
  const allPosts = (postsRes.data as any[]) || []
  const allMembers = (membersRes.data as any[]) || []
  const allTags = (tagsRes.data as any[]) || []
  const allPolls = (pollsRes.data as any[]) || []

  // Filter by period
  const periodEvents = cutoffIso ? allEvents.filter((e) => e.created_at >= cutoffIso) : allEvents
  const periodPosts = cutoffIso ? allPosts.filter((p) => p.created_at >= cutoffIso) : allPosts

  // Fetch votes for polls in this group to calculate interactions
  let periodVotes: any[] = []
  if (allPolls.length > 0) {
    const pollIds = allPolls.map((p) => p.id)
    let voteQuery = (supabase.from as any)('group_poll_votes')
      .select('poll_id, user_id, created_at')
      .in('poll_id', pollIds)
    if (cutoffIso) {
      voteQuery = voteQuery.gte('created_at', cutoffIso)
    }
    const { data: vData } = await voteQuery
    periodVotes = vData || []
  }

  // Counters
  const joinedCount = periodEvents.filter(
    (e) => e.event === 'joined' || e.event === 'approved',
  ).length
  const leftCount = periodEvents.filter((e) => e.event === 'left').length
  const removedCount = periodEvents.filter((e) => e.event === 'removed').length
  const postsCount = periodPosts.length
  const postsPerDay = Number((postsCount / Math.max(1, daysCount)).toFixed(1))

  const activeMembers = allMembers.filter((m) => m.status === 'member').length
  const pendingMembers = allMembers.filter((m) => m.status === 'pending').length

  const approvedEventsCount = periodEvents.filter((e) => e.event === 'approved').length
  const rejectedEventsCount = periodEvents.filter((e) => e.event === 'rejected').length
  const totalDecided = approvedEventsCount + rejectedEventsCount
  const approvalRate =
    totalDecided > 0 ? Math.round((approvedEventsCount / totalDecided) * 100) : 100

  // Activity timeline map: date YYYY-MM-DD -> { posts, joined, votes }
  const timelineMap = new Map<string, { posts: number; joined: number; votes: number }>()

  // initialize dates for period
  const startDay = cutoffDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  for (let d = new Date(startDay); d <= now; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10)
    timelineMap.set(key, { posts: 0, joined: 0, votes: 0 })
  }

  periodPosts.forEach((p) => {
    const key = p.created_at.slice(0, 10)
    const entry = timelineMap.get(key) || { posts: 0, joined: 0, votes: 0 }
    entry.posts += 1
    timelineMap.set(key, entry)
  })

  periodEvents.forEach((e) => {
    if (e.event === 'joined' || e.event === 'approved') {
      const key = e.created_at.slice(0, 10)
      const entry = timelineMap.get(key) || { posts: 0, joined: 0, votes: 0 }
      entry.joined += 1
      timelineMap.set(key, entry)
    }
  })

  periodVotes.forEach((v) => {
    const key = v.created_at.slice(0, 10)
    const entry = timelineMap.get(key) || { posts: 0, joined: 0, votes: 0 }
    entry.votes += 1
    timelineMap.set(key, entry)
  })

  const activityTimeline = Array.from(timelineMap.entries())
    .map(([date, counts]) => ({
      date: date.slice(5), // MM-DD
      ...counts,
    }))
    .slice(-30)

  // Top interacting members: count posts + votes
  const userInteractions = new Map<string, { posts: number; votes: number }>()
  periodPosts.forEach((p) => {
    const cur = userInteractions.get(p.author_id) || { posts: 0, votes: 0 }
    cur.posts += 1
    userInteractions.set(p.author_id, cur)
  })

  periodVotes.forEach((v) => {
    const cur = userInteractions.get(v.user_id) || { posts: 0, votes: 0 }
    cur.votes += 1
    userInteractions.set(v.user_id, cur)
  })

  const topUserEntries = Array.from(userInteractions.entries())
    .map(([uid, stats]) => ({
      userId: uid,
      post_count: stats.posts,
      vote_count: stats.votes,
      total_interactions: stats.posts + stats.votes,
    }))
    .sort((a, b) => b.total_interactions - a.total_interactions)
    .slice(0, 5)

  // Fetch profiles of top users
  let topActiveMembers: GroupAdminMetrics['top_active_members'] = []
  if (topUserEntries.length > 0) {
    const uids = topUserEntries.map((e) => e.userId)
    const { data: userProfiles } = await (supabase.from as any)('public_profiles')
      .select('*')
      .in('id', uids)

    const uMap = new Map<string, PublicProfile>()
    for (const p of (userProfiles as any[]) || []) {
      uMap.set(p.id, p as PublicProfile)
    }

    const nowIso = new Date().toISOString()
    topActiveMembers = topUserEntries.map((entry) => {
      const uTags = allTags
        .filter((t) => t.user_id === entry.userId)
        .map((t) => ({
          ...t,
          is_expired: Boolean(t.expires_at && t.expires_at <= nowIso),
        }))
      return {
        user: uMap.get(entry.userId) || {
          id: entry.userId,
          username: 'user',
          display_name: null,
          avatar_url: null,
          banner_url: null,
          bio: null,
          motivational_phrase: null,
          is_private: false,
          is_banned: false,
          created_at: '',
        },
        post_count: entry.post_count,
        vote_count: entry.vote_count,
        total_interactions: entry.total_interactions,
        tags: uTags,
      }
    })
  }

  return {
    period,
    joined_count: joinedCount,
    left_count: leftCount,
    removed_count: removedCount,
    posts_count: postsCount,
    posts_per_day: postsPerDay,
    active_members: activeMembers,
    pending_members: pendingMembers,
    approval_rate: approvalRate,
    activity_timeline: activityTimeline,
    top_active_members: topActiveMembers,
  }
}

// 14.6 Patient Social History API for PatientDetailsDrawer
// strictly anchored to groups.created_by = currentUserId (the logged in professional)
export interface PatientSocialHistoryData {
  groups: {
    group: SocialGroup
    membership_status: 'member' | 'pending' | 'former'
    joined_at?: string
    exit_event?: GroupMemberEvent | null
  }[]
  tags: GroupMemberTag[]
  posts: (GroupPost & { was_moderated?: boolean })[]
  moderation_timeline: {
    id: string
    action: string
    created_at: string
    details: any
    label: string
  }[]
}

export async function getPatientSocialHistory(
  patientId: string,
  professionalId: string,
): Promise<PatientSocialHistoryData> {
  // 1. Fetch only groups created by this professional
  const { data: proGroups } = await (supabase.from as any)('groups')
    .select('*')
    .eq('created_by', professionalId)
    .order('created_at', { ascending: false })

  const groupsList = (proGroups as any[]) || []
  if (groupsList.length === 0) {
    return {
      groups: [],
      tags: [],
      posts: [],
      moderation_timeline: [],
    }
  }

  const groupIds = groupsList.map((g) => g.id)
  const groupMap = new Map<string, SocialGroup>()
  groupsList.forEach((g) => groupMap.set(g.id, g as SocialGroup))

  // 2. Fetch patient's membership & events in these groups
  const [membershipsRes, eventsRes, tagsRes, postsRes, moderationRes] = await Promise.all([
    (supabase.from as any)('group_members')
      .select('*')
      .in('group_id', groupIds)
      .eq('user_id', patientId),
    (supabase.from as any)('group_member_events')
      .select('*')
      .in('group_id', groupIds)
      .eq('user_id', patientId)
      .order('created_at', { ascending: false }),
    (supabase.from as any)('group_member_tags')
      .select('*')
      .in('group_id', groupIds)
      .eq('user_id', patientId)
      .order('created_at', { ascending: false }),
    (supabase.from as any)('group_posts')
      .select('*')
      .in('group_id', groupIds)
      .eq('author_id', patientId)
      .order('created_at', { ascending: false }),
    (supabase.from as any)('moderation_actions')
      .select('*')
      .eq('target_user_id', patientId)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const activeMemberships = (membershipsRes.data as any[]) || []
  const allEvents = (eventsRes.data as any[]) || []
  const allTags = (tagsRes.data as any[]) || []
  const allPosts = (postsRes.data as any[]) || []
  const allModeration = (moderationRes.data as any[]) || []

  // Combine groups where patient is or was a member
  const patientGroupIds = Array.from(
    new Set([
      ...activeMemberships.map((m) => m.group_id),
      ...allEvents.map((e) => e.group_id),
      ...allPosts.map((p) => p.group_id),
    ]),
  )

  const nowIso = new Date().toISOString()

  const groupsData = patientGroupIds.map((gid) => {
    const grp = groupMap.get(gid)!
    const activeMem = activeMemberships.find((m) => m.group_id === gid)
    const grpEvents = allEvents.filter((e) => e.group_id === gid)
    const lastExit = grpEvents.find((e) => e.event === 'left' || e.event === 'removed')

    let status: 'member' | 'pending' | 'former' = 'former'
    if (activeMem) {
      status = activeMem.status === 'member' ? 'member' : 'pending'
    }

    return {
      group: grp,
      membership_status: status,
      joined_at: activeMem?.joined_at || grpEvents.find((e) => e.event === 'joined')?.created_at,
      exit_event: status === 'former' ? lastExit || null : null,
    }
  })

  // Format tags
  const mappedTags: GroupMemberTag[] = allTags.map((t) => ({
    ...t,
    is_expired: Boolean(t.expires_at && t.expires_at <= nowIso),
    group: groupMap.get(t.group_id)
      ? { id: t.group_id, name: groupMap.get(t.group_id)!.name }
      : undefined,
  }))

  // Format posts
  const mappedPosts: (GroupPost & { was_moderated?: boolean })[] = allPosts.map((p) => ({
    ...p,
    group: groupMap.get(p.group_id)
      ? { id: p.group_id, name: groupMap.get(p.group_id)!.name, cover_url: null }
      : undefined,
    was_moderated: Boolean(
      p.is_deleted &&
      allModeration.some(
        (m) =>
          m.target_post_id === p.id ||
          m.details?.post_id === p.id ||
          m.action === 'delete_group_post',
      ),
    ),
  }))

  // Filter moderation timeline to actions relevant to these pro groups
  const relevantModeration = allModeration.filter((m) => {
    const targetGid = m.details?.group_id
    return !targetGid || groupIds.includes(targetGid)
  })

  const moderationTimeline = [
    ...relevantModeration.map((m) => ({
      id: m.id,
      action: m.action,
      created_at: m.created_at,
      details: m.details,
      label:
        m.action === 'remove_group_member'
          ? 'Removido de grupo'
          : m.action === 'delete_group_post'
            ? 'Post moderado / apagado'
            : m.action === 'tag_member'
              ? `Tag concedida: "${m.details?.label || ''}"`
              : m.action === 'remove_member_tag'
                ? `Tag removida: "${m.details?.label || ''}"`
                : m.action,
    })),
    ...allEvents
      .filter((e) => e.event === 'removed')
      .map((e) => ({
        id: e.id,
        action: 'removed',
        created_at: e.created_at,
        details: { group_id: e.group_id },
        label: `Removido do grupo ${groupMap.get(e.group_id)?.name || ''}`,
      })),
  ].sort((a, b) => b.created_at.localeCompare(a.created_at))

  return {
    groups: groupsData,
    tags: mappedTags,
    posts: mappedPosts,
    moderation_timeline: moderationTimeline,
  }
}

export async function createGroupPost(
  groupId: string,
  authorId: string,
  kind: 'photo' | 'reminder',
  content?: string,
  imageUrl?: string,
): Promise<GroupPost> {
  const { data, error } = await (supabase.from as any)('group_posts')
    .insert({
      group_id: groupId,
      author_id: authorId,
      kind,
      content: content?.trim() || null,
      image_url: imageUrl || null,
    })
    .select()
    .single()

  if (error) throw error
  return data as GroupPost
}

export async function deleteGroupPost(postId: string, userId: string) {
  // Author or group owner can soft delete
  const { error } = await (supabase.from as any)('group_posts')
    .update({ is_deleted: true })
    .eq('id', postId)

  if (error) throw error
}

// 15. Master Group Moderation RPCs
export async function masterDeleteGroupPost(postId: string, reason?: string) {
  const { error } = await (supabase.rpc as any)('master_delete_group_post', {
    group_post_id: postId,
    reason: reason || 'Moderação Master',
  })
  if (error) throw error
}

export async function masterRestoreGroupPost(postId: string, reason?: string) {
  const { error } = await (supabase.rpc as any)('master_restore_group_post', {
    group_post_id: postId,
    reason: reason || 'Moderação Master',
  })
  if (error) throw error
}

export async function masterDeleteGroup(groupId: string, reason?: string) {
  const { error } = await (supabase.rpc as any)('master_delete_group', {
    group_id: groupId,
    reason: reason || 'Moderação Master',
  })
  if (error) throw error
}

export async function getMasterGroupsModeration(
  includeDeleted = true,
  searchQuery = '',
  postTypeFilter: 'all' | 'photo' | 'reminder' = 'all',
): Promise<{
  groups: SocialGroup[]
  groupPosts: GroupPost[]
  totalPendingMembers: number
}> {
  // 1. Fetch groups
  let gQuery = (supabase.from as any)('groups')
    .select('*')
    .order('created_at', { ascending: false })

  if (!includeDeleted) {
    gQuery = gQuery.eq('is_deleted', false)
  }

  const { data: rawGroups } = await gQuery.limit(100)
  const groupsList = (rawGroups as any[]) || []
  const groupIds = groupsList.map((g) => g.id)

  // Owners
  const ownerIds = Array.from(new Set(groupsList.map((g) => g.created_by)))
  const { data: owners } = await (supabase.from as any)('profiles')
    .select('id, username, display_name, email, avatar_url, is_banned')
    .in('id', ownerIds)
  const ownerMap = new Map<string, any>()
  for (const o of (owners as any[]) || []) {
    ownerMap.set(o.id, o)
  }

  // Member counts
  const { data: memberRows } = await (supabase.from as any)('group_members')
    .select('group_id, status')
    .in('group_id', groupIds)

  const countMap = new Map<string, number>()
  let totalPending = 0
  for (const m of (memberRows as any[]) || []) {
    if (m.status === 'member') {
      countMap.set(m.group_id, (countMap.get(m.group_id) || 0) + 1)
    } else if (m.status === 'pending') {
      totalPending += 1
    }
  }

  let mappedGroups: SocialGroup[] = groupsList.map((g) => {
    const o = ownerMap.get(g.created_by)
    return {
      ...g,
      members_count: countMap.get(g.id) || 0,
      owner: o
        ? {
            id: o.id,
            username: o.username || 'user',
            display_name: o.display_name,
            avatar_url: o.avatar_url,
            banner_url: null,
            bio: null,
            motivational_phrase: null,
            is_private: false,
            is_banned: Boolean(o.is_banned),
            created_at: '',
          }
        : undefined,
    }
  })

  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase()
    mappedGroups = mappedGroups.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.owner?.username?.toLowerCase().includes(q) ||
        g.owner?.display_name?.toLowerCase().includes(q),
    )
  }

  // 2. Fetch group posts
  let pQuery = (supabase.from as any)('group_posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (!includeDeleted) {
    pQuery = pQuery.eq('is_deleted', false)
  }

  if (postTypeFilter !== 'all') {
    pQuery = pQuery.eq('kind', postTypeFilter)
  }

  const { data: rawGroupPosts } = await pQuery.limit(100)
  const postList = (rawGroupPosts as any[]) || []

  // Group maps
  const groupMap = new Map<string, { id: string; name: string; cover_url: string | null }>()
  for (const g of groupsList) {
    groupMap.set(g.id, { id: g.id, name: g.name, cover_url: g.cover_url })
  }

  // Post authors
  const postAuthorIds = Array.from(new Set(postList.map((p) => p.author_id)))
  const { data: postAuthors } = await (supabase.from as any)('profiles')
    .select('id, username, display_name, email, avatar_url, is_banned')
    .in('id', postAuthorIds)

  const postAuthorMap = new Map<string, any>()
  for (const pa of (postAuthors as any[]) || []) {
    postAuthorMap.set(pa.id, pa)
  }

  let mappedPosts: GroupPost[] = postList.map((p) => {
    const a = postAuthorMap.get(p.author_id)
    return {
      ...p,
      group: groupMap.get(p.group_id) || { id: p.group_id, name: 'Grupo', cover_url: null },
      author: a
        ? {
            id: a.id,
            username: a.username || 'user',
            display_name: a.display_name,
            avatar_url: a.avatar_url,
            banner_url: null,
            bio: null,
            motivational_phrase: null,
            is_private: false,
            is_banned: Boolean(a.is_banned),
            created_at: '',
          }
        : undefined,
    }
  })

  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase()
    mappedPosts = mappedPosts.filter(
      (p) =>
        p.group?.name?.toLowerCase().includes(q) ||
        p.author?.username?.toLowerCase().includes(q) ||
        p.author?.display_name?.toLowerCase().includes(q),
    )
  }

  return {
    groups: mappedGroups,
    groupPosts: mappedPosts,
    totalPendingMembers: totalPending,
  }
}
