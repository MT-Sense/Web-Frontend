import { api } from './client'
import type { Role } from '@/types/user'

export interface EmailStatus {
  /** False when the backend has no SMTP_HOST: emails are only written to the server log. */
  configured: boolean
  from: string
  pending: number
  /** Failed in the last 7 days. */
  failed: number
}

export interface EmailRecipient {
  id: string
  fullName: string
  email: string
  role: Role
}

export function status() {
  return api.get<EmailStatus>('/api/email/status')
}

export function sendTest() {
  return api.post<{ sentTo: string; configured: boolean }>('/api/email/test')
}

/** Active HR and executive members of the caller's organization. */
export function recipients() {
  return api.get<EmailRecipient[]>('/api/email/recipients')
}

/** Queues the org-wide summary of a period (latest when omitted) to the chosen leaders. */
export function sendSummary(payload: { periodId?: string; recipientIds: string[]; note?: string }) {
  return api.post<{ queued: number }>('/api/email/summary', payload)
}
