# CLAUDE.md

คำแนะนำสำหรับ Claude Code เมื่อทำงานกับ repo นี้

## โปรเจกต์

**MT-Sense** — Web frontend สำหรับระบบเก็บ feedback พนักงานแบบไม่ระบุตัวตน (anonymous) + วิเคราะห์ sentiment ด้วย AI แล้วแสดงผลผ่าน dashboard ที่ปรับเนื้อหาตาม role

Stack: Vue 3 (`<script setup lang="ts">`) + TypeScript + Vite + Pinia + vue-router + vue-i18n + Tailwind v4 + shadcn-vue

ต่อกับ backend จริงแล้ว (`../Backend-Service`, Go/Fiber/GORM/Postgres) — ทุกหน้าเรียก API ผ่าน
`src/api/*` (ไม่มี `src/mocks/` อีกต่อไป), login เป็นของจริง (`POST /api/auth/login`), role มา
จาก JWT เสมอ ต้องรันทั้งสองฝั่งคู่กัน: `VITE_API_BASE_URL` ใน `.env.local` ชี้ไปที่ backend
(default `http://localhost:8080`)

Role enum ตอนนี้คือ `'admin' | 'executive' | 'employee'` (ตรงกับ DB enum ของ backend) —
`admin` คือ role เดิมที่เคยเรียก HR ในโค้ด แต่ badge ที่ผู้ใช้เห็นยังขึ้น "HR" เหมือนเดิม (ผ่าน
i18n key `role.admin`)

แบบสอบถามเป็นโมเดลคงที่แล้ว: 1 คะแนนความพึงพอใจ (1-5) + ความคิดเห็นเปิด 1 ช่องต่อรอบ ไม่มี
Form Builder แบบหลายคำถามอีกต่อไป — หน้า HR ที่เคยเป็น "จัดการฟอร์ม" ตอนนี้คือ "รอบสำรวจ"
(`SurveyPeriodsView.vue`, `/survey-periods`) สำหรับเปิด/ปิดรอบเท่านั้น

## คำสั่ง

```bash
pnpm dev          # dev server
pnpm build        # type-check + production build
pnpm type-check   # vue-tsc --build
pnpm lint         # oxlint + eslint (--fix ทั้งคู่)
pnpm test:unit    # vitest
pnpm test:e2e     # playwright
```

รันด้วย **pnpm เท่านั้น** (repo นี้ pin vue ไว้ที่ rc ผ่าน `pnpm-workspace.yaml` overrides)

## กฎเหล็ก — ห้ามละเมิด (Privacy-by-design)

นี่คือหัวใจของทั้งระบบ ไม่ใช่ nice-to-have:

1. **แยก identity ออกจากคำตอบ** — `survey_responses` ห้ามมี FK ตรงไป `users.id` ใช้ anonymous token แทน
2. **n < 5 suppression** — ทุกกลุ่มที่มีผู้ตอบ < 5 คน ต้องถูกซ่อน ใช้ type `Suppressible<T>` (`src/types/common.ts`) + component `EmptyOrSuppressed.vue` ตอนต่อ backend จริงต้อง enforce ที่ API layer ด้วย (`HAVING COUNT(*) >= 5`) ห้ามพึ่ง frontend อย่างเดียว
3. **Executive ไม่เห็นข้อความดิบ** — เห็นได้แค่ aggregate เท่านั้น
4. **Feed ต้องผ่าน 2 ด่าน** — โพสต์จะขึ้น `/voices` ได้ต้อง `optedIn && published` (ดู `VoicesFeedView.vue`)
5. **Role มาจาก backend เสมอ** — ห้ามให้ผู้ใช้เลือก role เอง (dev role picker ถูกลบออกแล้ว — `LoginView.vue` เรียก `POST /api/auth/login` จริง, role มาจาก JWT)

ถ้าจะแก้อะไรที่กระทบข้อพวกนี้ — **ถามก่อน**

## โครงสร้าง

```
src/
  views/        หน้าจอ (10 หน้า) — แยกโฟลเดอร์ตาม role: hr/ executive/ employee/ survey/ settings/
  layouts/      chrome ของแต่ละ role: AuthLayout / HrLayout / ExecutiveLayout / EmployeeLayout
  components/
    ui/         ⚠️ shadcn-vue vendored — generated ด้วย CLI, lint ignore ไว้แล้ว
    charts/ common/ dashboard/ feed/ forms/ kpi/ layout/ survey/
  composables/  useIsMobile, useRoleLayout, useAsyncData (fetch-on-mount + loading/error)
  api/          client.ts (fetch wrapper: token, 401→refresh, error surfacing) + 1 module ต่อ domain
  stores/       auth (Pinia, JWT + refresh token ใน localStorage), surveyDraft (autosave ลง localStorage)
  router/       index.ts + guards.ts (requireRole)
  i18n/         locales/th.ts, locales/en.ts — คู่กันเสมอ
  types/        มี comment อธิบาย domain rule ไว้ อ่านก่อนแก้ — ตรงกับ backend DTO เกือบ 1:1
  styles/       tokens.css — ไฟล์ CSS global ไฟล์เดียว
```

Routes กำหนด role ผ่าน `meta.roles` แล้ว `requireRole` ใน `guards.ts` เช็คให้
หน้าที่ใช้ได้หลาย role (`/voices`, `/survey/:id`, `/settings`) ใช้ `useRoleLayout()` เลือก layout เอง

## Styling

**อ่าน `src/styles/tokens.css` ก่อนเขียน CSS ทุกครั้ง**

- ธีม: light + accent สีเหลืองอำพัน `#b68235` มี ramp `--color-accent-100` … `-900`
- **ห้าม hardcode สี/ค่า px** ที่ token มีอยู่แล้ว — ใช้ `var(--color-*)`, `var(--space-*)`, `var(--radius-*)`, `var(--shadow-*)`
- token สี/รัศมี/เงา อยู่ใน `@theme` → ใช้ได้ทั้ง `var(--color-hr)` และ Tailwind utility `bg-hr`
- token ที่ไม่ใช่สี (`--space-*`, `--font-size-*`, `--sidebar-width`) อยู่ใน `:root` ธรรมดา
- **ห้ามใส่สีใหม่** ถ้า design ไม่ได้ระบุ (role colors / sentiment colors ตั้งใจคงของเดิมไว้)

กฎหน้าตาจาก design system:

| กฎ | รายละเอียด |
|---|---|
| ปุ่ม | **outline เสมอ ไม่ fill** — สีพื้นขึ้นเฉพาะตอน hover/active |
| Card | ใช้ global class `.panel` (พื้นทึบ ไม่มี border + เงาอ่อน) **อย่าเขียน card CSS ซ้ำในแต่ละ component** |
| Focus | `:focus-visible` = เส้นขอบ accent 2px ห้ามปล่อยเป็นวงแหวนน้ำเงินของ browser |
| Heatmap | คะแนนยิ่งต่ำ = accent ยิ่งเข้ม ตัวหนังสือสลับ `accent-100` / `accent-900` ตามความเข้ม |

**Motion**: ใส่ effect ได้ แต่ต้องห่อด้วย `@media (prefers-reduced-motion: reduce)` ทุกครั้ง

**Icons**: ใช้ `@lucide/vue` เท่านั้น (`import { Lock } from '@lucide/vue'`) — **ห้ามใช้ emoji เป็นไอคอน** และห้ามลง icon library ตัวอื่นเพิ่ม

## Conventions

- `<script setup lang="ts">` เสมอ, `<style scoped>` เสมอ (ยกเว้น tokens.css)
- import ด้วย alias `@/` เสมอ
- เพิ่มข้อความใหม่ → ต้องเพิ่มทั้ง `th.ts` และ `en.ts` **ห้าม hardcode ข้อความในหน้าจอ**
- Pinia แบบ composition (`defineStore('x', () => {...})`)
- เพิ่ม shadcn component: `pnpm dlx shadcn-vue@latest add <name>` แล้วแก้ไฟล์ที่ generate ออกมาได้เลย (มันเป็น source ของเรา) — แต่แก้ผ่าน `cva()` config อย่าเปลี่ยน variant API
- **ก่อนสร้าง component ใหม่ ให้เช็คก่อนว่ามีอยู่แล้วไหม** — มี component พร้อมใช้ ~30 ตัว + shadcn primitives อีก 21 ตัว

## ก่อนบอกว่าเสร็จ

```bash
pnpm type-check && pnpm lint && pnpm test:unit
```

แล้วเปิด browser เช็คของจริงด้วย ถ้าแก้อะไรที่เห็นได้บนหน้าจอ — อย่าให้ผู้ใช้ไปเช็คเอง

⚠️ `HeatmapGrid.spec.ts` ยึด class `.suppressed-row` ไว้ ถ้าแก้ component นั้นอย่าลบ class นี้

## ประวัติงาน

รายละเอียดสิ่งที่ทำไปแล้วอยู่ใน [CLAUDE.cache.md](CLAUDE.cache.md)
