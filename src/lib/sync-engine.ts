import { supabase } from '@/lib/supabase/client'

export interface QueuedAction {
  id: string
  table: string
  operation: 'insert' | 'update' | 'delete'
  payload: Record<string, any>
}

export async function executeMutation(action: QueuedAction): Promise<boolean> {
  try {
    if (action.operation === 'insert') {
      const { error } = await supabase.from(action.table).insert(action.payload)
      return !error
    }
    if (action.operation === 'update') {
      const { error } = await supabase
        .from(action.table)
        .update(action.payload.data)
        .eq('id', action.payload.id)
      return !error
    }
    if (action.operation === 'delete') {
      const { error } = await supabase.from(action.table).delete().eq('id', action.payload.id)
      return !error
    }
    return false
  } catch {
    return false
  }
}

export async function replayQueue(actions: QueuedAction[]): Promise<boolean> {
  let allSuccess = true
  for (const action of actions) {
    const success = await executeMutation(action)
    if (!success) allSuccess = false
  }
  return allSuccess
}
