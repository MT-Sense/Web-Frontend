<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import {
  ArrowRight,
  ChartNoAxesCombined,
  Check,
  Languages,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Users,
} from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth'
import { setLocale } from '@/i18n'

const { t, locale } = useI18n()
const auth = useAuthStore()
const home = computed(() => auth.homeRouteFor(auth.currentRole ?? 'employee'))
const features = [
  { key: 'listen', icon: MessageSquareText },
  { key: 'understand', icon: ChartNoAxesCombined },
  { key: 'act', icon: Sparkles },
]
const protections = ['separate', 'threshold', 'access'] as const
</script>

<template>
  <div class="landing">
    <a class="skip-link" href="#main">{{ t('landing.skip') }}</a>
    <header class="site-header">
      <div class="shell header-inner">
        <RouterLink to="/" class="brand" :aria-label="t('app.name')">
          {{ t('app.name') }}
        </RouterLink>
        <nav class="section-nav" :aria-label="t('landing.navigation')">
          <a href="#features">{{ t('landing.featuresNav') }}</a>
          <a href="#how-it-works">{{ t('landing.howNav') }}</a>
          <a href="#privacy">{{ t('landing.privacyNav') }}</a>
        </nav>
        <div class="header-actions">
          <Button
            variant="ghost"
            size="sm"
            :aria-label="t('landing.language')"
            @click="setLocale(locale === 'th' ? 'en' : 'th')"
          >
            <Languages :size="16" aria-hidden="true" />{{ locale === 'th' ? 'EN' : 'TH' }}
          </Button>
          <Button as-child size="sm">
            <RouterLink :to="auth.isAuthenticated ? home : '/login'">
              {{ t(auth.isAuthenticated ? 'landing.openApp' : 'landing.login') }}
              <ArrowRight :size="15" aria-hidden="true" />
            </RouterLink>
          </Button>
        </div>
      </div>
    </header>

    <main id="main">
      <section class="hero shell" aria-labelledby="hero-title">
        <div class="hero-copy">
          <p class="eyebrow"><span class="eyebrow-line" />{{ t('landing.eyebrow') }}</p>
          <h1 id="hero-title">
            {{ t('landing.heroTitle') }}<br /><span>{{ t('landing.heroAccent') }}</span>
          </h1>
          <p class="hero-description">{{ t('landing.heroDescription') }}</p>
          <div class="hero-actions">
            <Button as-child size="lg">
              <RouterLink :to="auth.isAuthenticated ? home : '/signup'">
                {{ t(auth.isAuthenticated ? 'landing.openApp' : 'landing.createOrg') }}
                <ArrowRight :size="18" aria-hidden="true" />
              </RouterLink>
            </Button>
            <a class="text-link" href="#how-it-works"
              >{{ t('landing.discover') }}<ArrowRight :size="16" aria-hidden="true"
            /></a>
          </div>
          <p class="join-note">
            {{ t('landing.invited') }}
            <RouterLink to="/join">{{ t('landing.joinOrg') }}</RouterLink>
          </p>
          <div class="hero-assurance">
            <ShieldCheck :size="18" aria-hidden="true" />{{ t('landing.assurance') }}
          </div>
        </div>

        <div class="overview" role="img" :aria-label="t('landing.overviewAlt')">
          <div class="overview-heading">
            <span class="brand-mini">{{ t('app.name') }}</span>
            <span class="example-label">{{ t('landing.illustration') }}</span>
          </div>
          <div class="overview-body">
            <div class="overview-top">
              <div>
                <p class="eyebrow">{{ t('landing.overviewEyebrow') }}</p>
                <h2>{{ t('landing.overviewTitle') }}</h2>
              </div>
              <span class="overview-icon"
                ><ChartNoAxesCombined :size="24" aria-hidden="true"
              /></span>
            </div>
            <div class="signal-grid">
              <div class="signal">
                <MessageSquareText :size="19" aria-hidden="true" /><strong>{{
                  t('landing.signalVoice')
                }}</strong
                ><span>{{ t('landing.signalVoiceDetail') }}</span>
              </div>
              <div class="signal">
                <Users :size="19" aria-hidden="true" /><strong>{{ t('landing.signalTeam') }}</strong
                ><span>{{ t('landing.signalTeamDetail') }}</span>
              </div>
            </div>
            <div class="insight">
              <div class="insight-heading">
                <Sparkles :size="18" aria-hidden="true" /><strong>{{
                  t('landing.insightTitle')
                }}</strong>
              </div>
              <p>{{ t('landing.insightDescription') }}</p>
              <div class="topic-tags">
                <span>{{ t('landing.topicWork') }}</span
                ><span>{{ t('landing.topicGrowth') }}</span
                ><span>{{ t('landing.topicBenefits') }}</span>
              </div>
            </div>
            <div class="overview-footer">
              <ShieldCheck :size="17" aria-hidden="true" /><span>{{
                t('landing.overviewPrivacy')
              }}</span
              ><Check :size="17" aria-hidden="true" />
            </div>
          </div>
          <div class="floating-note panel">
            <span class="note-icon"><Check :size="18" aria-hidden="true" /></span>
            <div>
              <strong>{{ t('landing.noteTitle') }}</strong
              ><span>{{ t('landing.noteDescription') }}</span>
            </div>
          </div>
        </div>
      </section>

      <section id="features" class="features-section" aria-labelledby="features-title">
        <div class="shell">
          <div class="section-heading">
            <p class="eyebrow">{{ t('landing.featuresEyebrow') }}</p>
            <h2 id="features-title">{{ t('landing.featuresTitle') }}</h2>
            <p>{{ t('landing.featuresDescription') }}</p>
          </div>
          <div class="feature-grid">
            <article v-for="(feature, index) in features" :key="feature.key" class="panel feature">
              <div class="feature-top">
                <span class="feature-icon"
                  ><component :is="feature.icon" :size="24" aria-hidden="true" /></span
                ><span class="step-number">{{ String(index + 1).padStart(2, '0') }}</span>
              </div>
              <h3>{{ t('landing.' + feature.key + 'Title') }}</h3>
              <p>{{ t('landing.' + feature.key + 'Description') }}</p>
            </article>
          </div>
        </div>
      </section>

      <section id="how-it-works" class="shell workflow-section" aria-labelledby="workflow-title">
        <div class="workflow-intro">
          <p class="eyebrow">{{ t('landing.howNav') }}</p>
          <h2 id="workflow-title">{{ t('landing.workflowTitle') }}</h2>
          <p>{{ t('landing.workflowDescription') }}</p>
          <RouterLink class="text-link" to="/signup"
            >{{ t('landing.createOrg') }}<ArrowRight :size="17" aria-hidden="true"
          /></RouterLink>
        </div>
        <ol class="workflow">
          <li v-for="step in [1, 2, 3]" :key="step">
            <span class="workflow-number">{{ step }}</span>
            <div>
              <h3>{{ t('landing.step' + step + 'Title') }}</h3>
              <p>{{ t('landing.step' + step + 'Description') }}</p>
            </div>
          </li>
        </ol>
      </section>

      <section id="privacy" class="shell privacy-section" aria-labelledby="privacy-title">
        <div class="privacy-panel panel">
          <div class="privacy-intro">
            <span class="feature-icon"><ShieldCheck :size="27" aria-hidden="true" /></span>
            <p class="eyebrow">{{ t('landing.privacyNav') }}</p>
            <h2 id="privacy-title">{{ t('landing.privacyTitle') }}</h2>
            <p>{{ t('landing.privacyDescription') }}</p>
          </div>
          <div class="protection-list">
            <div v-for="item in protections" :key="item" class="protection">
              <Check :size="20" aria-hidden="true" />
              <div>
                <h3>{{ t('landing.' + item + 'Title') }}</h3>
                <p>{{ t('landing.' + item + 'Description') }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="shell closing" aria-labelledby="closing-title">
        <p class="eyebrow">{{ t('app.name') }}</p>
        <h2 id="closing-title">{{ t('landing.closingTitle') }}</h2>
        <p>{{ t('landing.closingDescription') }}</p>
        <div class="closing-actions">
          <Button as-child size="lg"
            ><RouterLink :to="auth.isAuthenticated ? home : '/signup'"
              >{{ t(auth.isAuthenticated ? 'landing.openApp' : 'landing.createOrg')
              }}<ArrowRight :size="18" aria-hidden="true" /></RouterLink></Button
          ><Button as-child variant="secondary" size="lg"
            ><RouterLink to="/join">{{ t('landing.joinOrg') }}</RouterLink></Button
          >
        </div>
      </section>
    </main>

    <footer class="shell site-footer">
      <span class="brand">{{ t('app.name') }}</span>
      <p>{{ t('landing.footer') }}</p>
      <RouterLink :to="auth.isAuthenticated ? home : '/login'">{{
        t(auth.isAuthenticated ? 'landing.openApp' : 'landing.login')
      }}</RouterLink>
    </footer>
  </div>
</template>

<style scoped>
.landing {
  background: var(--color-bg);
  overflow-x: clip;
}
.shell {
  width: min(100% - var(--space-7) * 2, 1160px);
  margin-inline: auto;
}
.site-header {
  background: color-mix(in srgb, var(--color-surface) 90%, transparent);
  border-bottom: 1px solid var(--color-border);
}
.header-inner,
.header-actions,
.brand,
.section-nav,
.hero-actions,
.text-link,
.hero-assurance,
.overview-heading,
.brand-mini,
.overview-top,
.insight-heading,
.overview-footer,
.floating-note,
.feature-top,
.closing-actions,
.site-footer {
  display: flex;
  align-items: center;
}
.header-inner {
  min-height: calc(var(--header-height) + var(--space-4));
  gap: var(--space-5);
  justify-content: space-between;
}
.brand {
  gap: var(--space-2);
  color: var(--color-text);
  text-decoration: none;
  font-size: var(--font-size-lg);
  font-weight: 700;
  letter-spacing: -0.04em;
  white-space: nowrap;
}
.feature-icon,
.overview-icon,
.note-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--color-primary);
  background: var(--color-primary-bg);
  border-radius: var(--radius-lg);
}
.header-actions {
  gap: var(--space-2);
}
.section-nav {
  gap: var(--space-5);
}
.section-nav a,
.site-footer a {
  font-size: var(--font-size-sm);
  text-decoration: none;
  color: var(--color-text-muted);
}
.section-nav a:hover,
.site-footer a:hover {
  color: var(--color-primary);
}
.hero {
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  gap: var(--space-7);
  align-items: center;
  padding-block: clamp(4rem, 8vw, 7rem);
}
.eyebrow {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0 0 var(--space-4);
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: 600;
}
.eyebrow-line {
  width: var(--space-5);
  height: 2px;
  background: var(--color-primary);
}
h1 {
  font-size: clamp(2.5rem, 4.2vw, 3.6rem);
  line-height: 1.35;
  letter-spacing: -0.045em;
  margin: 0 0 var(--space-5);
  font-weight: 700;
}
h1 span {
  color: var(--color-primary);
}
.hero-description {
  max-width: 32rem;
  font-size: var(--font-size-lg);
  line-height: 1.9;
  color: var(--color-text-muted);
  margin: 0 0 var(--space-6);
}
.hero-actions {
  gap: var(--space-5);
  flex-wrap: wrap;
}
.text-link {
  display: inline-flex;
  gap: var(--space-2);
  font-weight: 600;
  font-size: var(--font-size-md);
  text-decoration: none;
}
.text-link:hover {
  text-decoration: underline;
}
.join-note {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  margin-block: var(--space-4) var(--space-6);
}
.join-note a {
  margin-inline-start: var(--space-1);
  text-underline-offset: 4px;
}
.hero-assurance {
  gap: var(--space-2);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}
.hero-assurance svg {
  color: var(--color-positive);
  flex-shrink: 0;
}
.overview {
  position: relative;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  transform: rotate(-1deg);
}
.overview::before {
  content: '';
  position: absolute;
  inset: -2rem;
  border-radius: 50%;
  background: radial-gradient(ellipse, var(--color-accent-200), transparent 70%);
  z-index: -1;
}
.overview-heading {
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
  justify-content: space-between;
  gap: var(--space-2);
}
.brand-mini {
  gap: var(--space-2);
  color: var(--color-primary);
  font-weight: 700;
  font-size: var(--font-size-sm);
}
.example-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.overview-body {
  padding: var(--space-5);
}
.overview-top {
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
}
.overview-top .eyebrow {
  margin-bottom: var(--space-1);
}
.overview-top h2 {
  font-size: var(--font-size-xl);
  margin: 0;
}
.overview-icon,
.feature-icon {
  width: var(--space-7);
  height: var(--space-7);
}
.signal-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}
.signal {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-bg);
}
.signal svg {
  color: var(--color-primary);
}
.signal strong {
  font-size: var(--font-size-md);
}
.signal span {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.insight {
  margin-top: var(--space-4);
  padding: var(--space-4);
  border: 1px solid var(--color-accent-200);
  border-radius: var(--radius-lg);
}
.insight-heading {
  gap: var(--space-2);
  color: var(--color-primary);
}
.insight p {
  color: var(--color-text-muted);
  line-height: 1.8;
  font-size: var(--font-size-sm);
  margin-block: var(--space-2) var(--space-3);
}
.topic-tags {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}
.topic-tags span {
  padding: var(--space-1) var(--space-2);
  background: var(--color-primary-bg);
  color: var(--color-accent-800);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
}
.overview-footer {
  margin-top: var(--space-5);
  gap: var(--space-2);
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}
.overview-footer svg {
  color: var(--color-positive);
  flex-shrink: 0;
}
.overview-footer svg:last-child {
  margin-inline-start: auto;
}
.floating-note {
  position: absolute;
  right: calc(-1 * var(--space-4));
  bottom: calc(-1 * var(--space-5));
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  box-shadow: var(--shadow-md);
  transform: rotate(1deg);
}
.note-icon {
  width: var(--space-6);
  height: var(--space-6);
  color: var(--color-positive);
  background: var(--color-positive-bg);
  border-radius: 50%;
}
.floating-note strong,
.floating-note span:not(.note-icon) {
  display: block;
  font-size: var(--font-size-sm);
}
.floating-note div > span {
  color: var(--color-text-muted);
  margin-top: var(--space-1);
}
.features-section {
  padding-block: var(--space-7);
  border-block: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-surface) 50%, var(--color-bg));
}
.section-heading {
  max-width: 42rem;
  margin-bottom: var(--space-6);
}
h2 {
  font-size: clamp(1.6rem, 2.7vw, 2.25rem);
  line-height: 1.5;
  letter-spacing: -0.025em;
  margin: 0 0 var(--space-3);
}
.section-heading > p:last-child,
.workflow-intro > p:not(.eyebrow),
.privacy-intro > p:last-child,
.closing > p:not(.eyebrow) {
  line-height: 1.9;
  color: var(--color-text-muted);
  margin: 0;
}
.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-5);
}
.feature {
  padding: var(--space-6);
}
.feature-top {
  justify-content: space-between;
  margin-bottom: var(--space-5);
}
.step-number {
  color: var(--color-text-subtle);
  font-size: var(--font-size-xs);
  font-weight: 600;
}
h3 {
  font-size: var(--font-size-lg);
  margin: 0 0 var(--space-2);
  line-height: 1.6;
}
.feature p,
.workflow p,
.protection p {
  color: var(--color-text-muted);
  font-size: var(--font-size-md);
  line-height: 1.9;
  margin: 0;
}
.workflow-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: calc(var(--space-7) * 2);
  padding-block: calc(var(--space-7) * 2);
  align-items: start;
}
.workflow-intro .text-link {
  margin-top: var(--space-5);
}
.workflow {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--space-6);
}
.workflow li {
  display: flex;
  gap: var(--space-4);
}
.workflow-number {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border: 1px solid var(--color-accent-300);
  color: var(--color-primary);
  border-radius: 50%;
  font-weight: 600;
  font-size: var(--font-size-sm);
}
.privacy-panel {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-7);
  padding: var(--space-7);
}
.privacy-intro .feature-icon {
  margin-bottom: var(--space-5);
}
.protection-list {
  display: grid;
  gap: var(--space-5);
  align-content: center;
}
.protection {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
}
.protection > svg {
  flex-shrink: 0;
  color: var(--color-primary);
  margin-top: var(--space-1);
}
.protection h3 {
  font-size: var(--font-size-md);
}
.protection p {
  font-size: var(--font-size-sm);
}
.closing {
  text-align: center;
  padding-block: calc(var(--space-7) * 2);
}
.closing .eyebrow {
  justify-content: center;
}
.closing-actions {
  justify-content: center;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-5);
}
.site-footer {
  border-top: 1px solid var(--color-border);
  padding-block: var(--space-5);
  gap: var(--space-5);
  flex-wrap: wrap;
}
.site-footer p {
  flex: 1;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  margin: 0;
}
.skip-link {
  position: fixed;
  top: var(--space-3);
  left: var(--space-3);
  z-index: 10;
  padding: var(--space-3);
  background: var(--color-surface);
  border-radius: var(--radius-md);
  transform: translateY(-200%);
}
.skip-link:focus {
  transform: translateY(0);
}
section[id] {
  scroll-margin-top: var(--space-5);
}
@media (max-width: 1000px) {
  .section-nav {
    display: none;
  }
  .hero {
    gap: var(--space-6);
  }
  .shell {
    width: calc(100% - var(--space-6) * 2);
  }
  .feature {
    padding: var(--space-5);
  }
  .workflow-section {
    gap: var(--space-7);
  }
}
@media (max-width: 760px) {
  .hero {
    grid-template-columns: 1fr;
    padding-block: var(--space-7) calc(var(--space-7) * 1.5);
    gap: var(--space-7);
  }
  .hero-copy {
    max-width: 36rem;
  }
  .overview {
    width: 100%;
    max-width: 34rem;
    margin-inline: auto;
    transform: none;
  }
  .floating-note {
    right: var(--space-3);
  }
  .feature-grid,
  .workflow-section,
  .privacy-panel {
    grid-template-columns: 1fr;
  }
  .workflow-section,
  .closing {
    padding-block: calc(var(--space-7) * 1.5);
  }
  .privacy-panel {
    padding: var(--space-6);
    gap: var(--space-6);
  }
  .feature-grid {
    gap: var(--space-4);
  }
  .feature-top {
    margin-bottom: var(--space-4);
  }
  .site-footer p {
    flex-basis: 100%;
    order: 3;
  }
  .site-footer > a:last-child {
    margin-inline-start: auto;
  }
}
@media (max-width: 420px) {
  .shell {
    width: calc(100% - var(--space-4) * 2);
  }
  .header-inner {
    gap: var(--space-2);
  }
  .overview-body {
    padding: var(--space-4);
  }
  .overview-top h2 {
    font-size: var(--font-size-lg);
  }
  .hero-actions {
    gap: var(--space-4);
  }
}
</style>
