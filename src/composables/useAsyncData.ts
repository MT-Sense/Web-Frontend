import { ref, shallowRef } from 'vue'

/** Small fetch-on-mount helper: runs `fetcher` immediately, exposes loading/error state and
 * a `reload` to re-run it (e.g. when a filter changes). */
export function useAsyncData<T>(fetcher: () => Promise<T>) {
  const data = shallowRef<T | null>(null)
  const loading = ref(true)
  const error = ref(false)

  async function load() {
    loading.value = true
    error.value = false
    try {
      data.value = await fetcher()
    } catch {
      error.value = true
    } finally {
      loading.value = false
    }
  }

  void load()

  return { data, loading, error, reload: load }
}
