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
  action: 'delete_post' | 'restore_post' | 'ban_user' | 'unban_user'
  target_user_id: string | null
  target_post_id: string | null
  details: Record<string, any>
  created_at: string
  actor?: {
    email?: string
    display_name?: string
  }
}

// 1. Upload files to 'social' bucket (avatars, banners, posts)
export async function uploadSocialImage(
  file: File,
  folder: 'avatars' | 'banners' | 'posts',
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
