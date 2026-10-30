import { expect, it, vi } from 'vitest'
import { useAsyncData } from '../useAsyncData'

it('keeps the latest page when an older request arrives afterwards', async () => {
  let finishFirst!: (value: string) => void
  let finishSecond!: (value: string) => void
  const fetcher = vi.fn<() => Promise<string>>()
    .mockImplementationOnce(() => new Promise<string>((resolve) => { finishFirst = resolve }))
    .mockImplementationOnce(() => new Promise<string>((resolve) => { finishSecond = resolve }))
  const state = useAsyncData(fetcher)
  const latest = state.reload()
  finishSecond('page 2')
  await latest
  finishFirst('page 1')
  await Promise.resolve()
  expect(state.data.value).toBe('page 2')
  expect(state.loading.value).toBe(false)
})

it('ignores an older failure while the latest page is loading', async () => {
  let failFirst!: (error: Error) => void
  let finishSecond!: (value: string) => void
  const fetcher = vi.fn<() => Promise<string>>()
    .mockImplementationOnce(() => new Promise<string>((_, reject) => { failFirst = reject }))
    .mockImplementationOnce(() => new Promise<string>((resolve) => { finishSecond = resolve }))
  const state = useAsyncData(fetcher)
  const latest = state.reload()
  failFirst(new Error('old request failed'))
  await Promise.resolve()
  expect(state.error.value).toBe(false)
  expect(state.loading.value).toBe(true)
  finishSecond('page 2')
  await latest
  expect(state.data.value).toBe('page 2')
})
