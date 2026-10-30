import { ref, shallowRef } from 'vue'

/** Small fetch-on-mount helper: runs `fetcher` immediately, exposes loading/error state and
 * a `reload` to re-run it (e.g. when a filter changes). */
export function useAsyncData<T>(fetcher: () => Promise<T>) {
  const data = shallowRef<T | null>(null)
  const loading = ref(true)
  const error = ref(false)
  let requestId = 0

  async function load() {
    const currentRequest = ++requestId
    loading.value = true
    error.value = false
    try {
      const result = await fetcher()
      if (currentRequest === requestId) data.value = result
    } catch {
      if (currentRequest === requestId) error.value = true
    } finally {
      if (currentRequest === requestId) loading.value = false
    }
  }

  void load()

  return { data, loading, error, reload: load }
}
