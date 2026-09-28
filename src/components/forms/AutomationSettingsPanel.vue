<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { Button } from '@/components/ui/button'
import * as automation from '@/api/automation'
import { departments } from '@/api/dashboard'
import type { Department } from '@/types/department'
import { useToast } from '@/composables/useToast'

const { t } = useI18n()
const { toast } = useToast()
const config = ref<automation.SettingsResponse | null>(null)
const depts = ref<Department[]>([])
const token = ref('')
const clearToken = ref(false)
const busy = ref(false)
const error = ref('')

function normalizeSettings(settings: automation.SettingsResponse) {
  settings.settings.departmentProjects ??= {}
  settings.settings.connectorType ||= settings.settings.jiraSite ? 'jira_cloud' : 'manual'
  settings.settings.toolName ||= settings.settings.connectorType === 'jira_cloud' ? 'Jira Cloud' : ''
  settings.settings.toolInstructions ??= ''

  return settings
}

async function load() {
  busy.value = true
  error.value = ''

  try {
    const [settings, list] = await Promise.all([automation.getSettings(), departments()])

    config.value = normalizeSettings(settings)
    depts.value = list
  } catch (e) {
    error.value = String(e instanceof Error ? e.message : e)
  } finally {
    busy.value = false
  }
}

async function persistSettings() {
  if (!config.value) {
    return null
  }

  const settings = await automation.saveSettings({
    ...config.value.settings,
    token: token.value,
    clearToken: clearToken.value,
  })

  config.value = normalizeSettings(settings)
  token.value = ''
  clearToken.value = false

  return config.value
}

async function save() {
  if (!config.value) return

  busy.value = true
  error.value = ''

  try {
    await persistSettings()
    toast.success(t('automationSettings.saved'), t('automationSettings.savedDetail'))
  } catch (e) {
    error.value = String(e instanceof Error ? e.message : e)
  } finally {
    busy.value = false
  }
}

async function test() {
  if (!config.value) return

  busy.value = true
  error.value = ''

  try {
    await persistSettings()

    const result = await automation.testJira()

    toast.success(t('automationSettings.testPassed'), result.message)
  } catch (e) {
    error.value = String(e instanceof Error ? e.message : e)
  } finally {
    busy.value = false
  }
}

onMounted(load)

</script>

<template>
  <section id="automation-settings" class="panel automation-settings">
    <h2>{{ t('automationSettings.title') }}</h2>
    <p>{{ t('automationSettings.intro') }}</p>
    <RouterLink to="/hr-assistant">{{ t('automationSettings.openProposals') }}</RouterLink>
    <p v-if="error" role="alert" class="error">{{ error }} <Button variant="link" :disabled="busy" @click="load">{{ t('automationSettings.reload') }}</Button></p>
    <p v-if="busy && !config">{{ t('automationSettings.loading') }}</p>
    <form v-if="config" @submit.prevent="save">
      <fieldset :disabled="busy">
        <legend>{{ t('automationSettings.thresholds') }}</legend>
        <div class="pair">
          <label>{{ t('automationSettings.minResponses') }}<input v-model.number="config.settings.minResponses" type="number" min="5" max="10000" required /></label>
          <label>{{ t('automationSettings.mentionPercent') }}<input v-model.number="config.settings.mentionPercent" type="number" min="1" max="100" required /></label>
        </div>
        <p class="hint">{{ t('automationSettings.thresholdHint') }}</p>
        <p v-if="!config.aiReady" class="hint">{{ t('automationSettings.aiNotReady') }}</p>
      </fieldset>
      <fieldset :disabled="busy">
        <legend>{{ t('automationSettings.tools') }}</legend>
        <p class="hint">{{ t('automationSettings.toolsHint') }}</p>
        <div class="pair">
          <label>{{ t('automationSettings.toolName') }}<input v-model="config.settings.toolName" maxlength="100" :placeholder="t('automationSettings.toolPlaceholder')" /></label>
          <label>{{ t('automationSettings.mode') }}<select v-model="config.settings.connectorType"><option value="manual">{{ t('automationSettings.manualModeOption') }}</option><option value="jira_cloud">{{ t('automationSettings.jiraModeOption') }}</option></select></label>
        </div>
        <label>{{ t('automationSettings.instructions') }}<textarea v-model="config.settings.toolInstructions" rows="3" maxlength="2000" :placeholder="t('automationSettings.instructionsPlaceholder')" /></label>

        <div v-if="config.settings.connectorType === 'manual'" class="manual-note">
          <strong>{{ t('automationSettings.manualMode') }}</strong>
          <p class="hint">{{ t('automationSettings.manualHint') }}</p>
        </div>

        <div v-else class="adapter-settings">
          <h3>{{ t('automationSettings.jiraTitle') }}</h3>
          <p class="hint">{{ t('automationSettings.jiraHint') }}</p>
          <label>{{ t('automationSettings.siteUrl') }}<input v-model="config.settings.jiraSite" type="url" placeholder="https://company.atlassian.net" /></label>
          <label>{{ t('automationSettings.accountEmail') }}<input v-model="config.settings.jiraEmail" type="email" autocomplete="off" /></label>
          <label>{{ t('automationSettings.apiToken') }} <span class="hint">{{ config.tokenSet ? t('automationSettings.tokenSaved') : t('automationSettings.tokenNotSet') }}</span><input v-model="token" type="password" autocomplete="new-password" :disabled="!config.encryptionReady" :placeholder="t('automationSettings.keepToken')" /></label>
          <label v-if="config.tokenSet" class="check"><input v-model="clearToken" type="checkbox" />{{ t('automationSettings.clearToken') }}</label>
          <p v-if="!config.encryptionReady" class="hint">{{ t('automationSettings.encryptionRequired') }}</p>
          <div class="pair">
            <label>{{ t('automationSettings.companyProject') }}<input v-model="config.settings.jiraProject" placeholder="HR" /></label>
            <label>{{ t('automationSettings.issueType') }}<input v-model="config.settings.jiraIssueType" inputmode="numeric" placeholder="10001" /></label>
          </div>
          <details v-if="config.settings.departmentProjects">
            <summary>{{ t('automationSettings.mapDepartments') }}</summary>
            <p class="hint">{{ t('automationSettings.mapHint') }}</p>
            <label v-for="dept in depts" :key="dept.id">{{ dept.name }}<input v-model="config.settings.departmentProjects[dept.id]" placeholder="PROJECT" /></label>
          </details>
          <label class="check"><input v-model="config.settings.allowJiraWrite" type="checkbox" />{{ t('automationSettings.allowWrite') }}</label>
          <Button type="button" variant="secondary" @click="test">{{ t('automationSettings.testAdapter') }}</Button>
        </div>
      </fieldset>
      <fieldset :disabled="busy">
        <legend>{{ t('automationSettings.references') }}</legend>
        <p class="hint">{{ t('automationSettings.referencesHint') }}</p>
        <label>{{ t('automationSettings.trainingCatalog') }}<textarea v-model="config.settings.trainingCatalog" rows="5" maxlength="6000" /></label>
        <label>{{ t('automationSettings.approvalPolicy') }}<textarea v-model="config.settings.approvalPolicy" rows="5" maxlength="6000" /></label>
        <label>{{ t('automationSettings.benefitsPolicy') }}<textarea v-model="config.settings.benefitsPolicy" rows="5" maxlength="6000" /></label>
      </fieldset>
      <Button type="submit" :disabled="busy">{{ busy ? t('automationSettings.working') : t('automationSettings.save') }}</Button>
    </form>
  </section>
</template>

<style scoped>
.automation-settings, form, fieldset { display: grid; gap: var(--space-3); }
h2, p { margin: 0; }
fieldset { border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); min-width: 0; }
legend { font-weight: 600; padding: 0 var(--space-2); }
label { display: grid; gap: var(--space-2); font-size: var(--font-size-sm); }
input:not([type=checkbox]), select, textarea { width: 100%; min-width: 0; padding: var(--space-2); border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); color: var(--color-text); font: inherit; }
textarea { resize: vertical; }
.check { display: flex; align-items: center; gap: var(--space-2); }
.pair { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
.hint, p { font-size: var(--font-size-sm); color: var(--color-text-muted); }
.error { color: var(--color-danger); }
.manual-note, .adapter-settings { display: grid; gap: var(--space-3); padding: var(--space-3); border-radius: var(--radius-md); background: var(--color-bg); }
.adapter-settings h3 { margin: 0; font-size: var(--font-size-md); }
a { color: var(--color-primary); }
summary { cursor: pointer; margin-bottom: var(--space-3); }
details label { margin-top: var(--space-2); }
.panel h2 {
  margin: 0 0 var(--space-4);
  font-size: var(--font-size-md);
  font-weight: 600;
  letter-spacing: -0.01em;
}
@media(max-width:560px) { .pair { grid-template-columns: 1fr; } }
</style>
