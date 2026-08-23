export type AlertType =
  | 'low_satisfaction_position'
  | 'low_satisfaction_department'
  | 'low_response_rate'
  | 'sentiment_drop'

export type AlertSeverity = 'info' | 'warning' | 'critical'

export interface Alert {
  id: string
  alertType: AlertType
  severity: AlertSeverity
  message: string
  relatedDepartmentId?: string
  relatedPositionId?: string
}
