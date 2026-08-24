<script setup lang="ts">
import { computed } from 'vue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface DropdownOption {
  value: string
  label: string
}

const props = defineProps<{
  modelValue: string
  options: DropdownOption[]
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const selected = computed({
  get: () => props.modelValue,
  set: (v: string) => emit('update:modelValue', v),
})
</script>

<template>
  <Select v-model="selected">
    <SelectTrigger class="min-w-40 font-semibold">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem v-for="opt in props.options" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>
