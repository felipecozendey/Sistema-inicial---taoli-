import { useSyncExternalStore } from 'react'

type SetState<T> = (partial: Partial<T> | ((prev: T) => Partial<T>)) => void
type GetState<T> = () => T

interface StoreApi<T> {
  getState: GetState<T>
  setState: SetState<T>
  subscribe: (listener: (state: T) => void) => () => void
}

type UseStore<T> = {
  (): T
  <U>(selector: (state: T) => U): U
} & StoreApi<T>

export function create<T>(initializer: (set: SetState<T>, get: GetState<T>) => T): UseStore<T> {
  let state: T
  const listeners = new Set<() => void>()

  const setState: SetState<T> = (partial) => {
    const nextPartial =
      typeof partial === 'function' ? (partial as (prev: T) => Partial<T>)(state) : partial
    state = { ...state, ...nextPartial }
    listeners.forEach((l) => l())
  }

  const getState: GetState<T> = () => state

  state = initializer(setState, getState)

  const subscribeInternal = (listener: () => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  const useStore = (<U>(selector?: (state: T) => U): U | T => {
    const sel = selector ?? ((s: T) => s as unknown as U)
    return useSyncExternalStore(
      subscribeInternal,
      () => sel(getState()),
      () => sel(getState()),
    )
  }) as UseStore<T>

  useStore.getState = getState
  useStore.setState = setState
  useStore.subscribe = (listener: (state: T) => void) => {
    const wrapper = () => listener(state)
    listeners.add(wrapper)
    return () => {
      listeners.delete(wrapper)
    }
  }

  return useStore
}
