<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { LogOut, Settings } from '@lucide/vue'
import type { CurrentUser } from '@/types/user'
import { useAuthStore } from '@/stores/auth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const props = defineProps<{ user: CurrentUser }>()
const router = useRouter()
const auth = useAuthStore()
const { t } = useI18n()

function initials(name: string) {
  return name.trim().slice(0, 1)
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <button type="button" class="avatar-trigger" :aria-label="props.user.fullName">
        <Avatar class="size-9">
          <AvatarFallback class="avatar-fallback">{{ initials(props.user.fullName) }}</AvatarFallback>
        </Avatar>
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="min-w-44">
      <DropdownMenuLabel>{{ props.user.fullName }}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem @select="router.push('/settings')">
        <Settings :size="16" aria-hidden="true" />
        {{ t('nav.settings') }}
      </DropdownMenuItem>
      <DropdownMenuItem @select="handleLogout">
        <LogOut :size="16" aria-hidden="true" />
        {{ t('common.logout') }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<style scoped>
.avatar-trigger {
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  border-radius: 50%;
  transition: transform 150ms ease;
}

.avatar-trigger:active {
  transform: scale(0.94);
}

.avatar-fallback {
  background: var(--color-accent-200);
  color: var(--color-accent-800);
  font-weight: 700;
}
</style>
