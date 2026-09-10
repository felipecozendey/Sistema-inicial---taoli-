export interface TaskSystemSettings {
  id: string
  points_per_task: number
  points_per_habit: number
  bonus_streak: number
  points_per_level: number
  unlock_plot_cost: number
  show_garden: boolean
  show_week_day_tabs: boolean
  updated_by?: string | null
  updated_at?: string
}

export const DEFAULT_TASK_SETTINGS: TaskSystemSettings = {
  id: 'default',
  points_per_task: 10,
  points_per_habit: 5,
  bonus_streak: 15,
  points_per_level: 100,
  unlock_plot_cost: 50,
  show_garden: true,
  show_week_day_tabs: true,
}
