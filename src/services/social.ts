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
  author?: PublicProfile
  group?: {
    id: string
    name: string
    cover_url: string | null
  }
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
    .order('created_at', { ascending: false })

  if (error || !posts) return []

  const authorIds = Array.from(new Set((posts as any[]).map((p) => p.author_id)))
  const { data: profiles } = await (supabase.from as any)('public_profiles')
    .select('*')
    .in('id', authorIds)

  const profileMap = new Map<string, PublicProfile>()
  for (const p of (profiles as any[]) || []) {
    profileMap.set(p.id, p as PublicProfile)
  }

  return (posts as any[]).map((p) => ({
    ...p,
    author: profileMap.get(p.author_id),
  }))
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
