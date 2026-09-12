import { create } from './create-store'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

export interface ProfessionalProfile {
  id: string
  user_id: string
  profession: string
  register_code: string | null
  specialty: string | null
  phone: string | null
  bio: string | null
  clinic_name: string | null
  created_at: string
  updated_at: string
}

export interface PatientLink {
  id: string
  professional_id: string
  patient_id: string
  status: 'pending' | 'active' | 'rejected' | 'ended'
  requested_by: string
  created_at: string
  responded_at: string | null
  patient_name?: string
  patient_email?: string
  professional_name?: string
  professional_profession?: string
  professional_register?: string
}

export interface Appointment {
  id: string
  professional_id: string
  patient_id: string
  title: string | null
  scheduled_at: string
  duration_minutes: number
  status: 'scheduled' | 'done' | 'canceled' | 'no_show'
  notes: string | null
  created_at: string
  updated_at: string
  patient_name?: string
}

export interface ClinicalNote {
  id: string
  professional_id: string
  patient_id: string
  appointment_id: string | null
  content: string
  created_at: string
  updated_at: string
  patient_name?: string
}

export interface PatientReadData {
  patient_id: string
  goals: any | null
  latest_metrics: any | null
  metrics_history: any[]
  medical_exams: any[]
  habits_count: number
  habits_adherence_pct: number
  tasks_count: number
  tasks_completed_count: number
}

interface ProfessionalState {
  profile: ProfessionalProfile | null
  patients: PatientLink[]
  incomingInvites: PatientLink[]
  myProfessionals: PatientLink[]
  appointments: Appointment[]
  notes: ClinicalNote[]
  loading: boolean
  error: string | null

  // Methods
  loadProfessionalData: () => Promise<void>
  loadPatientConsentData: () => Promise<void>
  upsertClinicProfile: (data: Partial<ProfessionalProfile>) => Promise<boolean>

  // Patient link management
  invitePatientByEmail: (email: string) => Promise<boolean>
  respondPatientInvite: (linkId: string, accept: boolean) => Promise<boolean>
  endPatientLink: (linkId: string) => Promise<boolean>

  // Appointments
  createAppointment: (data: {
    patient_id: string
    title?: string
    scheduled_at: string
    duration_minutes?: number
    notes?: string
  }) => Promise<boolean>
  updateAppointmentStatus: (
    id: string,
    status: 'scheduled' | 'done' | 'canceled' | 'no_show',
  ) => Promise<boolean>
  deleteAppointment: (id: string) => Promise<boolean>

  // Notes
  createClinicalNote: (data: {
    patient_id: string
    appointment_id?: string | null
    content: string
  }) => Promise<boolean>
  updateClinicalNote: (id: string, content: string) => Promise<boolean>
  deleteClinicalNote: (id: string) => Promise<boolean>

  // Patient details reader
  fetchPatientSharedData: (patientId: string) => Promise<PatientReadData | null>
}

export const useProfessionalStore = create<ProfessionalState>((set, get) => ({
  profile: null,
  patients: [],
  incomingInvites: [],
  myProfessionals: [],
  appointments: [],
  notes: [],
  loading: false,
  error: null,

  loadProfessionalData: async () => {
    set({ loading: true, error: null })
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        set({ loading: false })
        return
      }

      // Fetch professional profile, patient links, appointments, notes
      const [profRes, linksRes, apptsRes, notesRes] = await Promise.all([
        supabase.from('professional_profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase
          .from('professional_patients')
          .select('*')
          .eq('professional_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('professional_appointments')
          .select('*')
          .eq('professional_id', user.id)
          .order('scheduled_at', { ascending: true }),
        supabase
          .from('professional_notes')
          .select('*')
          .eq('professional_id', user.id)
          .order('created_at', { ascending: false }),
      ])

      const rawLinks = linksRes.data || []
      const rawAppts = apptsRes.data || []
      const rawNotes = notesRes.data || []

      // Collect patient ids to fetch display names / emails
      const patientIds = Array.from(
        new Set([
          ...rawLinks.map((l: any) => l.patient_id),
          ...rawAppts.map((a: any) => a.patient_id),
          ...rawNotes.map((n: any) => n.patient_id),
        ]),
      )

      let patientProfilesMap: Record<string, { name: string; email: string }> = {}
      if (patientIds.length > 0) {
        const { data: pProfiles } = await supabase
          .from('profiles')
          .select('id, display_name, email')
          .in('id', patientIds)

        if (pProfiles) {
          pProfiles.forEach((p: any) => {
            patientProfilesMap[p.id] = {
              name: p.display_name || p.email.split('@')[0],
              email: p.email,
            }
          })
        }
      }

      const enrichedLinks: PatientLink[] = rawLinks.map((l: any) => ({
        ...l,
        patient_name: patientProfilesMap[l.patient_id]?.name || 'Paciente',
        patient_email: patientProfilesMap[l.patient_id]?.email || '',
      }))

      const enrichedAppts: Appointment[] = rawAppts.map((a: any) => ({
        ...a,
        patient_name: patientProfilesMap[a.patient_id]?.name || 'Paciente',
      }))

      const enrichedNotes: ClinicalNote[] = rawNotes.map((n: any) => ({
        ...n,
        patient_name: patientProfilesMap[n.patient_id]?.name || 'Paciente',
      }))

      set({
        profile: profRes.data as ProfessionalProfile | null,
        patients: enrichedLinks,
        appointments: enrichedAppts,
        notes: enrichedNotes,
        loading: false,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar dados do consultório'
      set({ error: message, loading: false })
      toast.error(message)
    }
  },

  loadPatientConsentData: async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Find links where current user is the patient
      const { data: links } = await supabase
        .from('professional_patients')
        .select('*')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false })

      if (!links || links.length === 0) {
        set({ incomingInvites: [], myProfessionals: [] })
        return
      }

      // Collect professional user ids
      const profUserIds = Array.from(new Set(links.map((l: any) => l.professional_id)))
      const [profProfilesRes, clinicProfilesRes] = await Promise.all([
        supabase.from('profiles').select('id, display_name, email').in('id', profUserIds),
        supabase.from('professional_profiles').select('*').in('user_id', profUserIds),
      ])

      const nameMap: Record<string, string> = {}
      const clinicMap: Record<string, any> = {}

      if (profProfilesRes.data) {
        profProfilesRes.data.forEach((p: any) => {
          nameMap[p.id] = p.display_name || p.email.split('@')[0]
        })
      }
      if (clinicProfilesRes.data) {
        clinicProfilesRes.data.forEach((c: any) => {
          clinicMap[c.user_id] = c
        })
      }

      const incoming: PatientLink[] = []
      const activeOrEnded: PatientLink[] = []

      links.forEach((l: any) => {
        const item: PatientLink = {
          ...l,
          professional_name: nameMap[l.professional_id] || 'Profissional',
          professional_profession:
            clinicMap[l.professional_id]?.profession || 'Profissional da Saúde',
          professional_register: clinicMap[l.professional_id]?.register_code || null,
        }
        if (l.status === 'pending' && l.requested_by !== user.id) {
          incoming.push(item)
        } else if (l.status === 'active' || l.status === 'ended') {
          activeOrEnded.push(item)
        }
      })

      set({
        incomingInvites: incoming,
        myProfessionals: activeOrEnded,
      })
    } catch (err) {
      console.error('Error loading patient consent data:', err)
    }
  },

  upsertClinicProfile: async (data: Partial<ProfessionalProfile>) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const current = get().profile
      const payload = {
        user_id: user.id,
        profession: data.profession || 'Nutricionista',
        register_code: data.register_code || null,
        specialty: data.specialty || null,
        phone: data.phone || null,
        bio: data.bio || null,
        clinic_name: data.clinic_name || null,
      }

      let res
      if (current?.id) {
        res = await supabase
          .from('professional_profiles')
          .update(payload)
          .eq('user_id', user.id)
          .select()
          .single()
      } else {
        res = await supabase.from('professional_profiles').insert(payload).select().single()
      }

      if (res.error) throw res.error

      set({ profile: res.data as ProfessionalProfile })
      toast.success('Consultório configurado com sucesso!')
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar consultório'
      toast.error(message)
      return false
    }
  },

  invitePatientByEmail: async (email: string) => {
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !cleanEmail.includes('@')) {
      toast.error('Informe um e-mail válido.')
      return false
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      // Look up target profile by email
      const { data: targetProfile, error: searchErr } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .eq('email', cleanEmail)
        .maybeSingle()

      if (searchErr || !targetProfile) {
        toast.error('Nenhum usuário encontrado com este e-mail no sistema.')
        return false
      }

      if (targetProfile.id === user.id) {
        toast.error('Você não pode convidar a si mesmo como paciente.')
        return false
      }

      // Check if already invited or linked
      const existing = get().patients.find((p) => p.patient_id === targetProfile.id)
      if (existing) {
        if (existing.status === 'active') {
          toast.info('Este paciente já possui vínculo ativo com você.')
          return false
        }
        if (existing.status === 'pending') {
          toast.info('Já existe um convite pendente para este paciente.')
          return false
        }
      }

      const { data: created, error: insertErr } = await supabase
        .from('professional_patients')
        .upsert(
          {
            professional_id: user.id,
            patient_id: targetProfile.id,
            status: 'pending',
            requested_by: user.id,
          },
          { onConflict: 'professional_id,patient_id' },
        )
        .select()
        .single()

      if (insertErr) throw insertErr

      const newLink: PatientLink = {
        ...(created as any),
        patient_name: targetProfile.display_name || targetProfile.email.split('@')[0],
        patient_email: targetProfile.email,
      }

      set((state) => ({
        patients: [newLink, ...state.patients.filter((p) => p.id !== newLink.id)],
      }))

      toast.success(`Convite enviado para ${targetProfile.email}!`)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao convidar paciente'
      toast.error(message)
      return false
    }
  },

  respondPatientInvite: async (linkId: string, accept: boolean) => {
    const prevIncoming = get().incomingInvites
    const target = prevIncoming.find((l) => l.id === linkId)
    if (!target) return false

    const newStatus = accept ? 'active' : 'rejected'

    // Optimistic
    set((state) => ({
      incomingInvites: state.incomingInvites.filter((l) => l.id !== linkId),
      myProfessionals: accept
        ? [
            { ...target, status: 'active', responded_at: new Date().toISOString() },
            ...state.myProfessionals,
          ]
        : state.myProfessionals,
    }))

    try {
      const { error } = await supabase
        .from('professional_patients')
        .update({
          status: newStatus,
          responded_at: new Date().toISOString(),
        })
        .eq('id', linkId)

      if (error) throw error

      toast.success(
        accept
          ? 'Convite aceito! Seu profissional agora pode acompanhar seus dados clínicos.'
          : 'Convite recusado.',
      )
      return true
    } catch (err) {
      set({ incomingInvites: prevIncoming })
      const message = err instanceof Error ? err.message : 'Erro ao responder convite'
      toast.error(message)
      return false
    }
  },

  endPatientLink: async (linkId: string) => {
    const prevPatients = get().patients
    const prevMyProfessionals = get().myProfessionals

    // Optimistic
    set((state) => ({
      patients: state.patients.map((p) => (p.id === linkId ? { ...p, status: 'ended' } : p)),
      myProfessionals: state.myProfessionals.map((p) =>
        p.id === linkId ? { ...p, status: 'ended' } : p,
      ),
    }))

    try {
      const { error } = await supabase
        .from('professional_patients')
        .update({
          status: 'ended',
          responded_at: new Date().toISOString(),
        })
        .eq('id', linkId)

      if (error) throw error

      toast.success('Vínculo profissional encerrado.')
      return true
    } catch (err) {
      set({ patients: prevPatients, myProfessionals: prevMyProfessionals })
      const message = err instanceof Error ? err.message : 'Erro ao encerrar vínculo'
      toast.error(message)
      return false
    }
  },

  createAppointment: async (data) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const patient = get().patients.find((p) => p.patient_id === data.patient_id)

      const payload = {
        professional_id: user.id,
        patient_id: data.patient_id,
        title: data.title || 'Consulta',
        scheduled_at: data.scheduled_at,
        duration_minutes: data.duration_minutes || 50,
        status: 'scheduled',
        notes: data.notes || null,
      }

      const { data: created, error } = await supabase
        .from('professional_appointments')
        .insert(payload)
        .select()
        .single()

      if (error) throw error

      const enriched: Appointment = {
        ...(created as any),
        patient_name: patient?.patient_name || 'Paciente',
      }

      set((state) => ({
        appointments: [...state.appointments, enriched].sort(
          (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
        ),
      }))

      toast.success('Consulta agendada com sucesso!')
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar consulta'
      toast.error(message)
      return false
    }
  },

  updateAppointmentStatus: async (id, status) => {
    const prev = get().appointments
    set((state) => ({
      appointments: state.appointments.map((a) => (a.id === id ? { ...a, status } : a)),
    }))

    try {
      const { error } = await supabase
        .from('professional_appointments')
        .update({ status })
        .eq('id', id)

      if (error) throw error
      toast.success('Status da consulta atualizado!')
      return true
    } catch (err) {
      set({ appointments: prev })
      const message = err instanceof Error ? err.message : 'Erro ao atualizar consulta'
      toast.error(message)
      return false
    }
  },

  deleteAppointment: async (id) => {
    const prev = get().appointments
    set((state) => ({
      appointments: state.appointments.filter((a) => a.id !== id),
    }))

    try {
      const { error } = await supabase.from('professional_appointments').delete().eq('id', id)
      if (error) throw error
      toast.success('Consulta removida!')
      return true
    } catch (err) {
      set({ appointments: prev })
      const message = err instanceof Error ? err.message : 'Erro ao remover consulta'
      toast.error(message)
      return false
    }
  },

  createClinicalNote: async (data) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const patient = get().patients.find((p) => p.patient_id === data.patient_id)

      const payload = {
        professional_id: user.id,
        patient_id: data.patient_id,
        appointment_id: data.appointment_id || null,
        content: data.content,
      }

      const { data: created, error } = await supabase
        .from('professional_notes')
        .insert(payload)
        .select()
        .single()

      if (error) throw error

      const enriched: ClinicalNote = {
        ...(created as any),
        patient_name: patient?.patient_name || 'Paciente',
      }

      set((state) => ({
        notes: [enriched, ...state.notes],
      }))

      toast.success('Anotação clínica salva!')
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar anotação clínica'
      toast.error(message)
      return false
    }
  },

  updateClinicalNote: async (id, content) => {
    const prev = get().notes
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id ? { ...n, content, updated_at: new Date().toISOString() } : n,
      ),
    }))

    try {
      const { error } = await supabase.from('professional_notes').update({ content }).eq('id', id)

      if (error) throw error
      toast.success('Anotação atualizada!')
      return true
    } catch (err) {
      set({ notes: prev })
      const message = err instanceof Error ? err.message : 'Erro ao atualizar anotação'
      toast.error(message)
      return false
    }
  },

  deleteClinicalNote: async (id) => {
    const prev = get().notes
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
    }))

    try {
      const { error } = await supabase.from('professional_notes').delete().eq('id', id)
      if (error) throw error
      toast.success('Anotação removida!')
      return true
    } catch (err) {
      set({ notes: prev })
      const message = err instanceof Error ? err.message : 'Erro ao remover anotação'
      toast.error(message)
      return false
    }
  },

  fetchPatientSharedData: async (patientId: string) => {
    try {
      const [goalsRes, metricsRes, examsRes, habitsRes, tasksRes] = await Promise.all([
        supabase.from('patient_goals').select('*').eq('user_id', patientId).maybeSingle(),
        supabase
          .from('body_metrics')
          .select('*')
          .eq('user_id', patientId)
          .order('date', { ascending: false })
          .limit(20),
        supabase
          .from('medical_exams')
          .select('*')
          .eq('user_id', patientId)
          .order('date', { ascending: false })
          .limit(20),
        supabase.from('habits').select('id, week_days, completions').eq('user_id', patientId),
        supabase.from('tasks').select('id, completed').eq('user_id', patientId),
      ])

      const metricsList = metricsRes.data || []
      const latestMetric = metricsList[0] || null

      const habits = habitsRes.data || []
      const tasks = tasksRes.data || []

      // Calculate aggregate adherence
      let totalHabitCompletions = 0
      habits.forEach((h: any) => {
        if (Array.isArray(h.completions)) {
          totalHabitCompletions += h.completions.length
        }
      })

      const completedTasksCount = tasks.filter((t: any) => t.completed).length

      return {
        patient_id: patientId,
        goals: goalsRes.data || null,
        latest_metrics: latestMetric,
        metrics_history: metricsList,
        medical_exams: examsRes.data || [],
        habits_count: habits.length,
        habits_adherence_pct:
          habits.length > 0
            ? Math.min(100, Math.round((totalHabitCompletions / (habits.length * 7 || 1)) * 100))
            : 0,
        tasks_count: tasks.length,
        tasks_completed_count: completedTasksCount,
      }
    } catch (err) {
      console.error('Error fetching patient shared data:', err)
      return null
    }
  },
}))
