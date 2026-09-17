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
}))
