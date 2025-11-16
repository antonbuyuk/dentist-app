export type Appointment = {
  id: string
  patientName: string
  doctorName?: string
  notes?: string
  start: string // ISO
  end: string   // ISO
}

export type ScheduleEvent =
  | { type: 'create'; item: Appointment }
  | { type: 'update'; item: Appointment }
  | { type: 'delete'; id: string }


