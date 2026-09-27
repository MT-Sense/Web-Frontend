import { readonly, ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastOptions {
  title: string
  description?: string
  type?: ToastType
  duration?: number
}

export interface ToastItem extends Required<Pick<ToastOptions, 'title' | 'type'>> {
  id: number
  description: string
}

const items = ref<ToastItem[]>([])
let nextId = 1
const timers = new Map<number, ReturnType<typeof setTimeout>>()

export function dismissToast(id: number) {
  items.value = items.value.filter(item => item.id !== id)
  const timer = timers.get(id)

  if (timer) {
    clearTimeout(timer)
  }

  timers.delete(id)
}

function show(options: ToastOptions) {
  const id = nextId++
  items.value = [...items.value.slice(-4), {
    id,
    title: options.title,
    description: options.description ?? '',
    type: options.type ?? 'info',
  }]
  const duration = options.duration ?? 5000

  if (duration > 0) {
    timers.set(id, setTimeout(() => {
      dismissToast(id)
    }, duration))
  }

  return id
}

export const toast = {
  show,
  success(title: string, description = '', duration?: number) {
    return show({ title, description, duration, type: 'success' })
  },
  error(title: string, description = '', duration = 7000) {
    return show({ title, description, duration, type: 'error' })
  },
  info(title: string, description = '', duration?: number) {
    return show({ title, description, duration, type: 'info' })
  },
}

export function useToast() {
  return { toast, toasts: readonly(items), dismiss: dismissToast }
}

export const toasts = readonly(items)
