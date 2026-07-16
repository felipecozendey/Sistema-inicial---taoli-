// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      body_metrics: {
        Row: {
          activity_level: string | null
          age: number | null
          blood_pressure: string | null
          body_fat_percentage: number | null
          created_at: string
          date: string
          days_for_goal: number | null
          fat_mass: number | null
          gender: string | null
          get: number | null
          heart_rate_rest: number | null
          height: number | null
          id: string
          injury_factor: number
          lean_mass: number | null
          measurements: Json
          met_activities: Json
          methodology_used: string | null
          muscle_mass: number | null
          photo_urls: string[]
          primary_goal: string | null
          sleep_quality: number | null
          stress_level: number | null
          target_weight: number | null
          tmb: number | null
          user_id: string
          venta_target: number | null
          weight: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          blood_pressure?: string | null
          body_fat_percentage?: number | null
          created_at?: string
          date?: string
          days_for_goal?: number | null
          fat_mass?: number | null
          gender?: string | null
          get?: number | null
          heart_rate_rest?: number | null
          height?: number | null
          id?: string
          injury_factor?: number
          lean_mass?: number | null
          measurements?: Json
          met_activities?: Json
          methodology_used?: string | null
          muscle_mass?: number | null
          photo_urls?: string[]
          primary_goal?: string | null
          sleep_quality?: number | null
          stress_level?: number | null
          target_weight?: number | null
          tmb?: number | null
          user_id: string
          venta_target?: number | null
          weight?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          blood_pressure?: string | null
          body_fat_percentage?: number | null
          created_at?: string
          date?: string
          days_for_goal?: number | null
          fat_mass?: number | null
          gender?: string | null
          get?: number | null
          heart_rate_rest?: number | null
          height?: number | null
          id?: string
          injury_factor?: number
          lean_mass?: number | null
          measurements?: Json
          met_activities?: Json
          methodology_used?: string | null
          muscle_mass?: number | null
          photo_urls?: string[]
          primary_goal?: string | null
          sleep_quality?: number | null
          stress_level?: number | null
          target_weight?: number | null
          tmb?: number | null
          user_id?: string
          venta_target?: number | null
          weight?: number | null
        }
        Relationships: []
      }
      decks: {
        Row: {
          color: string
          created_at: string
          emoji: string
          id: string
          title: string
          user_id: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          emoji?: string
          id?: string
          title: string
          user_id?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          emoji?: string
          id?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      diet_plan_items: {
        Row: {
          created_at: string
          description: string
          id: string
          plan_id: string
          quantity: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          plan_id: string
          quantity?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          plan_id?: string
          quantity?: string
        }
        Relationships: [
          {
            foreignKeyName: 'diet_plan_items_plan_id_fkey'
            columns: ['plan_id']
            isOneToOne: false
            referencedRelation: 'diet_plans'
            referencedColumns: ['id']
          },
        ]
      }
      diet_plans: {
        Row: {
          created_at: string
          id: string
          name: string
          order_index: number
          time: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          order_index?: number
          time?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          order_index?: number
          time?: string
          user_id?: string
        }
        Relationships: []
      }
      fasting_logs: {
        Row: {
          actual_hours: number
          completed: boolean
          created_at: string
          end_time: string
          feeling: string
          id: string
          start_time: string
          target_hours: number
          user_id: string
        }
        Insert: {
          actual_hours?: number
          completed?: boolean
          created_at?: string
          end_time: string
          feeling?: string
          id?: string
          start_time: string
          target_hours?: number
          user_id: string
        }
        Update: {
          actual_hours?: number
          completed?: boolean
          created_at?: string
          end_time?: string
          feeling?: string
          id?: string
          start_time?: string
          target_hours?: number
          user_id?: string
        }
        Relationships: []
      }
      finance_categories: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: string
          name: string
          parent_id: string | null
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name: string
          parent_id?: string | null
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name?: string
          parent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'finance_categories_parent_id_fkey'
            columns: ['parent_id']
            isOneToOne: false
            referencedRelation: 'finance_categories'
            referencedColumns: ['id']
          },
        ]
      }
      flashcards: {
        Row: {
          back: string
          created_at: string
          deck_id: string
          ease_factor: number
          front: string
          id: string
          interval: number
          next_review_date: string
          note_id: string | null
          user_id: string | null
        }
        Insert: {
          back: string
          created_at?: string
          deck_id: string
          ease_factor?: number
          front: string
          id?: string
          interval?: number
          next_review_date?: string
          note_id?: string | null
          user_id?: string | null
        }
        Update: {
          back?: string
          created_at?: string
          deck_id?: string
          ease_factor?: number
          front?: string
          id?: string
          interval?: number
          next_review_date?: string
          note_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'flashcards_deck_id_fkey'
            columns: ['deck_id']
            isOneToOne: false
            referencedRelation: 'decks'
            referencedColumns: ['id']
          },
        ]
      }
      habits: {
        Row: {
          completions: Json
          created_at: string
          escudos: number
          frequency: string
          frozen_dates: Json
          id: string
          tag_id: string | null
          target_completions: number | null
          title: string
          user_id: string
          week_days: Json
          weekly_goal: number
        }
        Insert: {
          completions?: Json
          created_at?: string
          escudos?: number
          frequency?: string
          frozen_dates?: Json
          id?: string
          tag_id?: string | null
          target_completions?: number | null
          title: string
          user_id: string
          week_days?: Json
          weekly_goal?: number
        }
        Update: {
          completions?: Json
          created_at?: string
          escudos?: number
          frequency?: string
          frozen_dates?: Json
          id?: string
          tag_id?: string | null
          target_completions?: number | null
          title?: string
          user_id?: string
          week_days?: Json
          weekly_goal?: number
        }
        Relationships: []
      }
      meal_logs: {
        Row: {
          adherence: string
          calories: number
          carbs: number
          created_at: string
          description: string
          fat: number
          id: string
          items: Json
          meal_type: string
          photo_url: string | null
          protein: number
          quality: string
          user_id: string
        }
        Insert: {
          adherence?: string
          calories?: number
          carbs?: number
          created_at?: string
          description?: string
          fat?: number
          id?: string
          items?: Json
          meal_type: string
          photo_url?: string | null
          protein?: number
          quality: string
          user_id: string
        }
        Update: {
          adherence?: string
          calories?: number
          carbs?: number
          created_at?: string
          description?: string
          fat?: number
          id?: string
          items?: Json
          meal_type?: string
          photo_url?: string | null
          protein?: number
          quality?: string
          user_id?: string
        }
        Relationships: []
      }
      medical_exams: {
        Row: {
          created_at: string
          date: string
          file_url: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          file_url?: string
          id?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          file_url?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      note_references: {
        Row: {
          created_at: string
          id: string
          source_note_id: string
          target_note_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          source_note_id: string
          target_note_id: string
        }
        Update: {
          created_at?: string
          id?: string
          source_note_id?: string
          target_note_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'note_references_source_note_id_fkey'
            columns: ['source_note_id']
            isOneToOne: false
            referencedRelation: 'notes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'note_references_target_note_id_fkey'
            columns: ['target_note_id']
            isOneToOne: false
            referencedRelation: 'notes'
            referencedColumns: ['id']
          },
        ]
      }
      notebooks: {
        Row: {
          color: string
          created_at: string
          emoji: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          emoji?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          emoji?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string
          created_at: string
          emoji: string
          id: string
          notebook_id: string | null
          tag_ids: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          emoji?: string
          id?: string
          notebook_id?: string | null
          tag_ids?: string[] | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          emoji?: string
          id?: string
          notebook_id?: string | null
          tag_ids?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nutrition_micro_goals: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      passwords: {
        Row: {
          category: string
          created_at: string
          id: string
          password: string
          title: string
          url: string | null
          user_id: string
          username: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          password: string
          title: string
          url?: string | null
          user_id: string
          username: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          password?: string
          title?: string
          url?: string | null
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      patient_goals: {
        Row: {
          created_at: string
          height: number | null
          id: string
          target_body_fat: number | null
          target_lean_mass: number | null
          target_weight: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          height?: number | null
          id?: string
          target_body_fat?: number | null
          target_lean_mass?: number | null
          target_weight?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          height?: number | null
          id?: string
          target_body_fat?: number | null
          target_lean_mass?: number | null
          target_weight?: number | null
          user_id?: string
        }
        Relationships: []
      }
      personal_records: {
        Row: {
          bench_press: string
          created_at: string
          id: string
          run_time: string
          squat: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bench_press?: string
          created_at?: string
          id?: string
          run_time?: string
          squat?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bench_press?: string
          created_at?: string
          id?: string
          run_time?: string
          squat?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed: boolean
          created_at: string
          due_date: string | null
          energy_level: number
          estimated_time: number
          id: string
          priority: string
          scheduled_date: string | null
          subtasks: Json
          tag_id: string | null
          tag_ids: string[] | null
          title: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          due_date?: string | null
          energy_level?: number
          estimated_time?: number
          id?: string
          priority?: string
          scheduled_date?: string | null
          subtasks?: Json
          tag_id?: string | null
          tag_ids?: string[] | null
          title: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          due_date?: string | null
          energy_level?: number
          estimated_time?: number
          id?: string
          priority?: string
          scheduled_date?: string | null
          subtasks?: Json
          tag_id?: string | null
          tag_ids?: string[] | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string | null
          id: string
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          status?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_history: {
        Row: {
          completed_at: string
          data: Json
          id: string
          routine_id: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          data?: Json
          id?: string
          routine_id?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string
          data?: Json
          id?: string
          routine_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'workout_history_routine_id_fkey'
            columns: ['routine_id']
            isOneToOne: false
            referencedRelation: 'workout_routines'
            referencedColumns: ['id']
          },
        ]
      }
      workout_routines: {
        Row: {
          created_at: string
          exercises: Json
          id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exercises?: Json
          id?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          exercises?: Json
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
