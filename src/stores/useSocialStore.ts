import { create } from './create-store'
import {
  PublicProfile,
  SocialPost,
  getPublicProfile,
  updateSocialProfile,
  followUser,
  unfollowUser,
  blockUser,
  unblockUser,
  searchUsers,
  getFeedPosts,
  getUserPosts,
  createPost,
  deleteOwnPost,
  uploadSocialImage,
} from '@/services/social'
import { toast } from 'sonner'

interface SocialState {
  myProfile: PublicProfile | null
  currentViewProfile: PublicProfile | null
  feedPosts: SocialPost[]
  profilePosts: SocialPost[]
  searchResults: PublicProfile[]
  feedPage: number
  hasMoreFeed: boolean
  loadingFeed: boolean
  loadingProfile: boolean
  loadingSearch: boolean
  posting: boolean

  // Actions
  loadMyProfile: (userId: string) => Promise<void>
  loadUserProfile: (
    identifier: { username?: string; id?: string },
    currentUserId?: string,
  ) => Promise<void>
  loadFeed: (currentUserId: string, reset?: boolean) => Promise<void>
  loadUserPosts: (authorId: string) => Promise<void>
  search: (query: string, currentUserId?: string) => Promise<void>
  toggleFollow: (targetUserId: string, currentUserId: string) => Promise<boolean>
  blockTargetUser: (targetUserId: string, currentUserId: string) => Promise<boolean>
  unblockTargetUser: (targetUserId: string, currentUserId: string) => Promise<boolean>
  publishPost: (
    currentUserId: string,
    kind: 'photo' | 'reminder',
    content?: string,
    imageFile?: File | null,
  ) => Promise<boolean>
  removePost: (postId: string, currentUserId: string) => Promise<boolean>
  updateProfileDetails: (
    userId: string,
    data: {
      display_name?: string
      username?: string
      avatar_url?: string
      banner_url?: string
      bio?: string
      motivational_phrase?: string
      is_private?: boolean
    },
  ) => Promise<boolean>

  // Groups State & Actions
  groups: import('@/services/social').SocialGroup[]
  loadingGroups: boolean
  currentGroup: import('@/services/social').SocialGroup | null
  currentGroupPosts: import('@/services/social').GroupPost[]
  currentGroupMembers: import('@/services/social').GroupMember[]
  loadingGroupDetails: boolean
  loadingGroupPosts: boolean
  loadGroups: (userId: string, filter?: 'all' | 'my', search?: string) => Promise<void>
  loadGroupDetails: (groupId: string, userId?: string) => Promise<void>
  loadGroupPosts: (groupId: string) => Promise<void>
  loadGroupMembers: (groupId: string) => Promise<void>
  createNewGroup: (
    creatorId: string,
    data: { name: string; description?: string; coverFile?: File | null; isClosed?: boolean },
  ) => Promise<import('@/services/social').SocialGroup | null>
  toggleGroupMembership: (
    group: import('@/services/social').SocialGroup,
    userId: string,
  ) => Promise<boolean>
  publishGroupPost: (
    groupId: string,
    authorId: string,
    kind: 'photo' | 'reminder',
    content?: string,
    imageFile?: File | null,
  ) => Promise<boolean>
  removeGroupPost: (postId: string, userId: string) => Promise<boolean>
  respondMembershipRequest: (
    groupId: string,
    targetUserId: string,
    action: 'member' | 'reject',
  ) => Promise<boolean>
  removeMemberFromGroup: (groupId: string, targetUserId: string) => Promise<boolean>

  // Group Pro features
  currentGroupPolls: import('@/services/social').GroupPoll[]
  currentGroupTags: import('@/services/social').GroupMemberTag[]
  currentGroupEvents: import('@/services/social').GroupMemberEvent[]
  currentGroupMetrics: import('@/services/social').GroupAdminMetrics | null
  loadingGroupPolls: boolean
  loadingGroupAdmin: boolean
  loadGroupPolls: (groupId: string, currentUserId?: string, isOwner?: boolean) => Promise<void>
  loadGroupTags: (groupId: string, includeExpired?: boolean) => Promise<void>
  loadGroupAdminMetrics: (groupId: string, period?: '7d' | '30d' | 'all') => Promise<void>
  pinPost: (groupId: string, postId: string) => Promise<boolean>
  unpinPost: (groupId: string, postId: string) => Promise<boolean>
  publishPoll: (
    groupId: string,
    creatorId: string,
    question: string,
    options: string[],
    closesAt?: string | null,
  ) => Promise<boolean>
  votePoll: (pollId: string, optionId: string, userId: string, groupId: string) => Promise<boolean>
  endPoll: (pollId: string, groupId: string) => Promise<boolean>
  removePoll: (pollId: string, userId: string, groupId: string) => Promise<boolean>
  assignTag: (
    groupId: string,
    userId: string,
    creatorId: string,
    label: string,
    color: string,
    expiresAt?: string | null,
  ) => Promise<boolean>
  deleteTag: (tagId: string, actorId: string, groupId: string) => Promise<boolean>
}

export const useSocialStore = create<SocialState>((set, get) => ({
  myProfile: null,
  currentViewProfile: null,
  feedPosts: [],
  profilePosts: [],
  searchResults: [],
  feedPage: 0,
  hasMoreFeed: true,
  loadingFeed: false,
  loadingProfile: false,
  loadingSearch: false,
  posting: false,

  // Groups Initial State
  groups: [],
  loadingGroups: false,
  currentGroup: null,
  currentGroupPosts: [],
  currentGroupMembers: [],
  loadingGroupDetails: false,
  loadingGroupPosts: false,
  currentGroupPolls: [],
  currentGroupTags: [],
  currentGroupEvents: [],
  currentGroupMetrics: null,
  loadingGroupPolls: false,
  loadingGroupAdmin: false,

  loadMyProfile: async (userId: string) => {
    try {
      const profile = await getPublicProfile({ id: userId }, userId)
      if (profile) {
        set({ myProfile: profile })
      }
    } catch (err) {
      console.error('Erro ao carregar meu perfil social:', err)
    }
  },

  loadUserProfile: async (identifier, currentUserId) => {
    set({ loadingProfile: true })
    try {
      const profile = await getPublicProfile(identifier, currentUserId)
      set({ currentViewProfile: profile, loadingProfile: false })
      if (profile) {
        get().loadUserPosts(profile.id)
      }
    } catch (err) {
      console.error('Erro ao carregar perfil:', err)
      set({ currentViewProfile: null, loadingProfile: false })
    }
  },

  loadFeed: async (currentUserId: string, reset = false) => {
    const page = reset ? 0 : get().feedPage
    set({ loadingFeed: true })
    try {
      const posts = await getFeedPosts(currentUserId, page, 10)
      set((state) => ({
        feedPosts: reset ? posts : [...state.feedPosts, ...posts],
        feedPage: page + 1,
        hasMoreFeed: posts.length >= 10,
        loadingFeed: false,
      }))
    } catch (err) {
      console.error('Erro ao carregar feed:', err)
      set({ loadingFeed: false })
    }
  },

  loadUserPosts: async (authorId: string) => {
    try {
      const posts = await getUserPosts(authorId)
      set({ profilePosts: posts })
    } catch (err) {
      console.error('Erro ao carregar posts do perfil:', err)
      set({ profilePosts: [] })
    }
  },

  search: async (queryText: string, currentUserId?: string) => {
    set({ loadingSearch: true })
    try {
      const results = await searchUsers(queryText, currentUserId)
      set({ searchResults: results, loadingSearch: false })
    } catch (err) {
      console.error('Erro na busca de usuários:', err)
      set({ searchResults: [], loadingSearch: false })
    }
  },

  toggleFollow: async (targetUserId: string, currentUserId: string) => {
    const { currentViewProfile, searchResults, myProfile } = get()

    // Determine current status
    let wasFollowing = false
    if (currentViewProfile && currentViewProfile.id === targetUserId) {
      wasFollowing = Boolean(currentViewProfile.is_following)
    } else {
      const found = searchResults.find((u) => u.id === targetUserId)
      if (found) wasFollowing = Boolean(found.is_following)
    }

    const nextFollowing = !wasFollowing

    // Optimistic update
    set((state) => ({
      currentViewProfile:
        state.currentViewProfile && state.currentViewProfile.id === targetUserId
          ? {
              ...state.currentViewProfile,
              is_following: nextFollowing,
              followers_count: Math.max(
                0,
                (state.currentViewProfile.followers_count || 0) + (nextFollowing ? 1 : -1),
              ),
            }
          : state.currentViewProfile,
      searchResults: state.searchResults.map((u) =>
        u.id === targetUserId ? { ...u, is_following: nextFollowing } : u,
      ),
      myProfile:
        state.myProfile && state.myProfile.id === currentUserId
          ? {
              ...state.myProfile,
              following_count: Math.max(
                0,
                (state.myProfile.following_count || 0) + (nextFollowing ? 1 : -1),
              ),
            }
          : state.myProfile,
    }))

    try {
      if (nextFollowing) {
        await followUser(currentUserId, targetUserId)
        toast.success('Seguindo com sucesso! 🌱')
      } else {
        await unfollowUser(currentUserId, targetUserId)
        toast.info('Deixou de seguir')
      }
      return true
    } catch (err) {
      // Rollback
      set((state) => ({
        currentViewProfile:
          state.currentViewProfile && state.currentViewProfile.id === targetUserId
            ? {
                ...state.currentViewProfile,
                is_following: wasFollowing,
                followers_count: Math.max(
                  0,
                  (state.currentViewProfile.followers_count || 0) + (wasFollowing ? 1 : -1),
                ),
              }
            : state.currentViewProfile,
        searchResults: state.searchResults.map((u) =>
          u.id === targetUserId ? { ...u, is_following: wasFollowing } : u,
        ),
        myProfile:
          state.myProfile && state.myProfile.id === currentUserId
            ? {
                ...state.myProfile,
                following_count: Math.max(
                  0,
                  (state.myProfile.following_count || 0) + (wasFollowing ? 1 : -1),
                ),
              }
            : state.myProfile,
      }))
      const msg = err instanceof Error ? err.message : 'Falha ao atualizar conexão'
      toast.error(msg)
      return false
    }
  },

  blockTargetUser: async (targetUserId: string, currentUserId: string) => {
    try {
      await blockUser(currentUserId, targetUserId)
      toast.success('Usuário bloqueado com sucesso.')

      // Update state
      set((state) => ({
        currentViewProfile:
          state.currentViewProfile && state.currentViewProfile.id === targetUserId
            ? { ...state.currentViewProfile, is_blocked: true, is_following: false }
            : state.currentViewProfile,
        searchResults: state.searchResults.filter((u) => u.id !== targetUserId),
        feedPosts: state.feedPosts.filter((p) => p.author_id !== targetUserId),
      }))
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao bloquear usuário'
      toast.error(msg)
      return false
    }
  },

  unblockTargetUser: async (targetUserId: string, currentUserId: string) => {
    try {
      await unblockUser(currentUserId, targetUserId)
      toast.success('Usuário desbloqueado.')
      set((state) => ({
        currentViewProfile:
          state.currentViewProfile && state.currentViewProfile.id === targetUserId
            ? { ...state.currentViewProfile, is_blocked: false }
            : state.currentViewProfile,
      }))
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao desbloquear usuário'
      toast.error(msg)
      return false
    }
  },

  publishPost: async (currentUserId, kind, content, imageFile) => {
    set({ posting: true })
    try {
      let imageUrl: string | undefined = undefined

      if (kind === 'photo') {
        if (!imageFile) {
          toast.error('Selecione uma imagem para publicar.')
          set({ posting: false })
          return false
        }
        imageUrl = await uploadSocialImage(imageFile, 'posts', currentUserId)
      } else {
        if (!content || !content.trim()) {
          toast.error('Digite uma mensagem para o lembrete.')
          set({ posting: false })
          return false
        }
      }

      const newPost = await createPost(currentUserId, kind, content, imageUrl)

      const myProfile = get().myProfile
      const fullPost: SocialPost = {
        ...newPost,
        author: myProfile || undefined,
      }

      // Add optimistically to top of feed & profile posts
      set((state) => ({
        feedPosts: [fullPost, ...state.feedPosts],
        profilePosts: [fullPost, ...state.profilePosts],
        myProfile: state.myProfile
          ? {
              ...state.myProfile,
              posts_count: (state.myProfile.posts_count || 0) + 1,
            }
          : state.myProfile,
        posting: false,
      }))

      toast.success('Publicado com sucesso! ✨')
      return true
    } catch (err) {
      set({ posting: false })
      const msg = err instanceof Error ? err.message : 'Falha ao criar publicação'
      toast.error(msg)
      return false
    }
  },

  removePost: async (postId: string, currentUserId: string) => {
    const prevFeed = get().feedPosts
    const prevProfile = get().profilePosts

    // Optimistic delete
    set({
      feedPosts: prevFeed.filter((p) => p.id !== postId),
      profilePosts: prevProfile.filter((p) => p.id !== postId),
      myProfile: get().myProfile
        ? {
            ...get().myProfile!,
            posts_count: Math.max(0, (get().myProfile!.posts_count || 0) - 1),
          }
        : null,
    })

    try {
      await deleteOwnPost(postId, currentUserId)
      toast.success('Publicação excluída.')
      return true
    } catch (err) {
      // Rollback
      set({
        feedPosts: prevFeed,
        profilePosts: prevProfile,
      })
      const msg = err instanceof Error ? err.message : 'Erro ao excluir publicação'
      toast.error(msg)
      return false
    }
  },

  updateProfileDetails: async (userId, data) => {
    try {
      await updateSocialProfile(userId, data)
      set((state) => {
        if (!state.myProfile) return state
        return {
          myProfile: {
            ...state.myProfile,
            display_name: data.display_name ?? state.myProfile.display_name,
            username: data.username ?? state.myProfile.username,
            avatar_url: data.avatar_url ?? state.myProfile.avatar_url,
            banner_url: data.banner_url ?? state.myProfile.banner_url,
            bio: data.bio ?? state.myProfile.bio,
            motivational_phrase: data.motivational_phrase ?? state.myProfile.motivational_phrase,
            is_private: data.is_private ?? state.myProfile.is_private,
          },
        }
      })
      toast.success('Perfil atualizado com sucesso!')
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao atualizar perfil'
      toast.error(msg)
      return false
    }
  },

  // Groups Actions
  loadGroups: async (userId: string, filter = 'all', search = '') => {
    set({ loadingGroups: true })
    try {
      const { getGroupsList } = await import('@/services/social')
      const groups = await getGroupsList(userId, filter, search)
      set({ groups, loadingGroups: false })
    } catch (err) {
      console.error('Erro ao carregar grupos:', err)
      set({ groups: [], loadingGroups: false })
    }
  },

  loadGroupDetails: async (groupId: string, userId?: string) => {
    set({ loadingGroupDetails: true })
    try {
      const { getGroupDetails } = await import('@/services/social')
      const group = await getGroupDetails(groupId, userId)
      set({ currentGroup: group, loadingGroupDetails: false })
    } catch (err) {
      console.error('Erro ao carregar detalhes do grupo:', err)
      set({ currentGroup: null, loadingGroupDetails: false })
    }
  },

  loadGroupPosts: async (groupId: string) => {
    set({ loadingGroupPosts: true })
    try {
      const { getGroupPosts } = await import('@/services/social')
      const posts = await getGroupPosts(groupId)
      set({ currentGroupPosts: posts, loadingGroupPosts: false })
    } catch (err) {
      console.error('Erro ao carregar posts do grupo:', err)
      set({ currentGroupPosts: [], loadingGroupPosts: false })
    }
  },

  loadGroupMembers: async (groupId: string) => {
    try {
      const { getGroupMembersList } = await import('@/services/social')
      const members = await getGroupMembersList(groupId)
      set({ currentGroupMembers: members })
    } catch (err) {
      console.error('Erro ao carregar membros do grupo:', err)
      set({ currentGroupMembers: [] })
    }
  },

  createNewGroup: async (creatorId, data) => {
    try {
      let coverUrl: string | undefined = undefined
      if (data.coverFile) {
        coverUrl = await uploadSocialImage(data.coverFile, 'groups', creatorId)
      }
      const { createSocialGroup } = await import('@/services/social')
      const newGroup = await createSocialGroup(creatorId, {
        name: data.name,
        description: data.description,
        coverUrl,
        isClosed: data.isClosed,
      })

      set((state) => ({
        groups: [newGroup, ...state.groups],
      }))

      toast.success('Grupo criado com sucesso! 🎉')
      return newGroup
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao criar grupo'
      toast.error(msg)
      return null
    }
  },

  toggleGroupMembership: async (group, userId) => {
    const isMember = group.current_user_status === 'member'
    const isPending = group.current_user_status === 'pending'
    const wasJoined = Boolean(isMember || isPending)

    const prevGroups = get().groups
    const prevCurrentGroup = get().currentGroup

    // Optimistic update
    const nextStatus = wasJoined ? null : group.is_closed ? 'pending' : 'member'
    const countDiff = nextStatus === 'member' ? 1 : wasJoined && isMember ? -1 : 0

    const updateGroupObj = (g: any) => {
      if (g.id !== group.id) return g
      return {
        ...g,
        current_user_status: nextStatus,
        members_count: Math.max(0, (g.members_count || 0) + countDiff),
      }
    }

    set((state) => ({
      groups: state.groups.map(updateGroupObj),
      currentGroup:
        state.currentGroup && state.currentGroup.id === group.id
          ? updateGroupObj(state.currentGroup)
          : state.currentGroup,
    }))

    try {
      const { joinOrRequestGroup, leaveGroup } = await import('@/services/social')
      if (wasJoined) {
        await leaveGroup(group.id, userId)
        toast.info(isPending ? 'Solicitação cancelada' : 'Você saiu do grupo')
      } else {
        const resStatus = await joinOrRequestGroup(group.id, userId, group.is_closed)
        if (resStatus === 'pending') {
          toast.success('Solicitação de entrada enviada! Aguarde a aprovação do dono ⏳')
        } else {
          toast.success('Você entrou no grupo! Bem-vindo(a) 🌱')
        }
      }
      return true
    } catch (err) {
      // Rollback
      set({
        groups: prevGroups,
        currentGroup: prevCurrentGroup,
      })
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar participação no grupo'
      toast.error(msg)
      return false
    }
  },

  publishGroupPost: async (groupId, authorId, kind, content, imageFile) => {
    set({ posting: true })
    try {
      let imageUrl: string | undefined = undefined
      if (kind === 'photo') {
        if (!imageFile) {
          toast.error('Selecione uma imagem para publicar.')
          set({ posting: false })
          return false
        }
        imageUrl = await uploadSocialImage(imageFile, 'posts', authorId)
      } else {
        if (!content || !content.trim()) {
          toast.error('Digite uma mensagem para o lembrete.')
          set({ posting: false })
          return false
        }
      }

      const { createGroupPost } = await import('@/services/social')
      const newPost = await createGroupPost(groupId, authorId, kind, content, imageUrl)

      const myProfile = get().myProfile
      const fullPost = {
        ...newPost,
        author: myProfile || undefined,
      }

      set((state) => ({
        currentGroupPosts: [fullPost, ...state.currentGroupPosts],
        posting: false,
      }))

      toast.success('Publicação no grupo enviada! ✨')
      return true
    } catch (err) {
      set({ posting: false })
      const msg = err instanceof Error ? err.message : 'Falha ao criar publicação no grupo'
      toast.error(msg)
      return false
    }
  },

  removeGroupPost: async (postId, userId) => {
    const prevPosts = get().currentGroupPosts
    set({
      currentGroupPosts: prevPosts.filter((p) => p.id !== postId),
    })

    try {
      const { deleteGroupPost } = await import('@/services/social')
      await deleteGroupPost(postId, userId)
      toast.success('Publicação removida do grupo.')
      return true
    } catch (err) {
      set({ currentGroupPosts: prevPosts })
      const msg = err instanceof Error ? err.message : 'Erro ao excluir publicação'
      toast.error(msg)
      return false
    }
  },

  respondMembershipRequest: async (groupId, targetUserId, action) => {
    try {
      const { updateGroupMemberStatus } = await import('@/services/social')
      await updateGroupMemberStatus(groupId, targetUserId, action)

      set((state) => ({
        currentGroupMembers:
          action === 'reject'
            ? state.currentGroupMembers.filter((m) => m.user_id !== targetUserId)
            : state.currentGroupMembers.map((m) =>
                m.user_id === targetUserId ? { ...m, status: 'member' } : m,
              ),
        currentGroup:
          state.currentGroup && action === 'member'
            ? { ...state.currentGroup, members_count: (state.currentGroup.members_count || 0) + 1 }
            : state.currentGroup,
      }))

      toast.success(
        action === 'member'
          ? 'Membro aprovado com sucesso! 🎉'
          : 'Solicitação recusada e removida.',
      )
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar solicitação'
      toast.error(msg)
      return false
    }
  },

  removeMemberFromGroup: async (groupId, targetUserId) => {
    try {
      const { removeGroupMember } = await import('@/services/social')
      await removeGroupMember(groupId, targetUserId)

      set((state) => ({
        currentGroupMembers: state.currentGroupMembers.filter((m) => m.user_id !== targetUserId),
        currentGroup: state.currentGroup
          ? {
              ...state.currentGroup,
              members_count: Math.max(0, (state.currentGroup.members_count || 1) - 1),
            }
          : null,
      }))

      toast.success('Membro removido do grupo.')
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao remover membro'
      toast.error(msg)
      return false
    }
  },

  // Pro Features Implementations
  loadGroupPolls: async (groupId, currentUserId, isOwner = false) => {
    set({ loadingGroupPolls: true })
    try {
      const { getGroupPolls } = await import('@/services/social')
      const polls = await getGroupPolls(groupId, currentUserId, isOwner)
      set({ currentGroupPolls: polls, loadingGroupPolls: false })
    } catch (err) {
      console.error('Erro ao carregar enquetes do grupo:', err)
      set({ currentGroupPolls: [], loadingGroupPolls: false })
    }
  },

  loadGroupTags: async (groupId, includeExpired = true) => {
    try {
      const { getGroupMemberTags } = await import('@/services/social')
      const tags = await getGroupMemberTags(groupId, includeExpired)
      set({ currentGroupTags: tags })
    } catch (err) {
      console.error('Erro ao carregar tags do grupo:', err)
      set({ currentGroupTags: [] })
    }
  },

  loadGroupAdminMetrics: async (groupId, period = '30d') => {
    set({ loadingGroupAdmin: true })
    try {
      const { getGroupAdminMetrics, getGroupMemberEvents } = await import('@/services/social')
      const [metrics, events] = await Promise.all([
        getGroupAdminMetrics(groupId, period),
        getGroupMemberEvents(groupId),
      ])
      set({
        currentGroupMetrics: metrics,
        currentGroupEvents: events,
        loadingGroupAdmin: false,
      })
    } catch (err) {
      console.error('Erro ao carregar métricas de administração:', err)
      set({ currentGroupMetrics: null, currentGroupEvents: [], loadingGroupAdmin: false })
    }
  },

  pinPost: async (groupId, postId) => {
    const prevPosts = get().currentGroupPosts
    const nowIso = new Date().toISOString()
    const myProfile = get().myProfile

    // Optimistic: unpin others, pin target
    set({
      currentGroupPosts: prevPosts
        .map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              pinned_at: nowIso,
              pinned_by: myProfile?.id || null,
              pinned_by_user: myProfile || null,
            }
          }
          return {
            ...p,
            pinned_at: null,
            pinned_by: null,
            pinned_by_user: null,
          }
        })
        .sort((a, b) => {
          if (a.pinned_at && !b.pinned_at) return -1
          if (!a.pinned_at && b.pinned_at) return 1
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }),
    })

    try {
      const { pinGroupPostAction } = await import('@/services/social')
      await pinGroupPostAction(groupId, postId)
      toast.success('Publicação fixada no topo! 📌')
      return true
    } catch (err) {
      set({ currentGroupPosts: prevPosts })
      const msg = err instanceof Error ? err.message : 'Erro ao fixar publicação'
      toast.error(msg)
      return false
    }
  },

  unpinPost: async (groupId, postId) => {
    const prevPosts = get().currentGroupPosts
    // Optimistic
    set({
      currentGroupPosts: prevPosts
        .map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              pinned_at: null,
              pinned_by: null,
              pinned_by_user: null,
            }
          }
          return p
        })
        .sort((a, b) => {
          if (a.pinned_at && !b.pinned_at) return -1
          if (!a.pinned_at && b.pinned_at) return 1
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }),
    })

    try {
      const { unpinGroupPostAction } = await import('@/services/social')
      await unpinGroupPostAction(groupId, postId)
      toast.info('Publicação desafixada do topo.')
      return true
    } catch (err) {
      set({ currentGroupPosts: prevPosts })
      const msg = err instanceof Error ? err.message : 'Erro ao desafixar publicação'
      toast.error(msg)
      return false
    }
  },

  publishPoll: async (groupId, creatorId, question, options, closesAt) => {
    try {
      const { createGroupPoll } = await import('@/services/social')
      const poll = await createGroupPoll(groupId, creatorId, question, options, closesAt)
      set((state) => ({
        currentGroupPolls: [poll, ...state.currentGroupPolls],
      }))
      toast.success('Enquete publicada no grupo! 📊')
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar enquete'
      toast.error(msg)
      return false
    }
  },

  votePoll: async (pollId, optionId, userId, groupId) => {
    const prevPolls = get().currentGroupPolls
    const isOwner = get().currentGroup?.created_by === userId

    // Optimistic vote update
    set({
      currentGroupPolls: prevPolls.map((poll) => {
        if (poll.id !== pollId) return poll
        const hadPreviousVote = Boolean(poll.user_voted_option_id)
        const prevOptId = poll.user_voted_option_id

        const updatedOptions = poll.options.map((opt) => {
          let count = opt.vote_count || 0
          if (hadPreviousVote && opt.id === prevOptId) {
            count = Math.max(0, count - 1)
          }
          if (opt.id === optionId) {
            count += 1
          }
          return { ...opt, vote_count: count }
        })

        const totalVotes = updatedOptions.reduce((acc, o) => acc + (o.vote_count || 0), 0)
        const optsWithPct = updatedOptions.map((opt) => ({
          ...opt,
          percentage: totalVotes > 0 ? Math.round(((opt.vote_count || 0) / totalVotes) * 100) : 0,
        }))

        return {
          ...poll,
          user_voted_option_id: optionId,
          total_votes: totalVotes,
          options: optsWithPct,
        }
      }),
    })

    try {
      const { voteGroupPoll } = await import('@/services/social')
      await voteGroupPoll(pollId, optionId, userId)
      toast.success('Voto registrado! 🗳️')
      // re-sync to get official backend numbers
      get().loadGroupPolls(groupId, userId, isOwner)
      return true
    } catch (err) {
      set({ currentGroupPolls: prevPolls })
      const msg = err instanceof Error ? err.message : 'Erro ao votar'
      toast.error(msg)
      return false
    }
  },

  endPoll: async (pollId, groupId) => {
    try {
      const { closeGroupPoll } = await import('@/services/social')
      await closeGroupPoll(pollId)
      set((state) => ({
        currentGroupPolls: state.currentGroupPolls.map((p) =>
          p.id === pollId ? { ...p, is_closed: true, closes_at: new Date().toISOString() } : p,
        ),
      }))
      toast.success('Enquete encerrada.')
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao encerrar enquete'
      toast.error(msg)
      return false
    }
  },

  removePoll: async (pollId, userId, groupId) => {
    const prevPolls = get().currentGroupPolls
    set({
      currentGroupPolls: prevPolls.filter((p) => p.id !== pollId),
    })

    try {
      const { deleteGroupPoll } = await import('@/services/social')
      await deleteGroupPoll(pollId, userId, groupId)
      toast.success('Enquete excluída.')
      return true
    } catch (err) {
      set({ currentGroupPolls: prevPolls })
      const msg = err instanceof Error ? err.message : 'Erro ao excluir enquete'
      toast.error(msg)
      return false
    }
  },

  assignTag: async (groupId, userId, creatorId, label, color, expiresAt) => {
    try {
      const { addMemberTag } = await import('@/services/social')
      const newTag = await addMemberTag(groupId, userId, creatorId, label, color, expiresAt)
      set((state) => ({
        currentGroupTags: [newTag, ...state.currentGroupTags],
      }))
      // refresh posts & metrics so tags appear on cards
      get().loadGroupPosts(groupId)
      toast.success(`Tag "${label}" concedida com sucesso! 🏷️`)
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao conceder tag'
      toast.error(msg)
      return false
    }
  },

  deleteTag: async (tagId, actorId, groupId) => {
    const prevTags = get().currentGroupTags
    set({
      currentGroupTags: prevTags.filter((t) => t.id !== tagId),
    })

    try {
      const { removeMemberTag } = await import('@/services/social')
      await removeMemberTag(tagId, actorId, groupId)
      get().loadGroupPosts(groupId)
      toast.info('Tag removida do membro.')
      return true
    } catch (err) {
      set({ currentGroupTags: prevTags })
      const msg = err instanceof Error ? err.message : 'Erro ao remover tag'
      toast.error(msg)
      return false
    }
  },
}))
