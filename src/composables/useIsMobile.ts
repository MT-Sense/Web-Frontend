import { onMounted, onUnmounted, ref } from 'vue'

const QUERY = '(max-width: 640px)'

export function useIsMobile() {
  const isMobile = ref(false)
  let mql: MediaQueryList | null = null

  function update() {
    isMobile.value = mql?.matches ?? false
  }

  onMounted(() => {
    mql = window.matchMedia(QUERY)
    update()
    mql.addEventListener('change', update)
  })

  onUnmounted(() => {
    mql?.removeEventListener('change', update)
  })

  return { isMobile }
}
