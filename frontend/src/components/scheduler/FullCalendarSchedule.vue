<script setup lang="ts">
import { ref, computed } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ruLocale from '@fullcalendar/core/locales/ru.js';
import type { EventInput } from '@fullcalendar/core';
import type { Appointment } from '~/types/appointment';
import type { AppointmentSuggestion } from '~/store/appointment-suggestions';

const props = withDefaults(defineProps<{
  appointments: Appointment[];
  suggestions?: AppointmentSuggestion[];
  initialDate?: Date;
  allowDateClick?: boolean;
  editable?: boolean;
}>(), {
  allowDateClick: true,
  editable: true,
  suggestions: () => [],
});

const emit = defineEmits<{
  (e: 'eventClick', event: { id: string }): void;
  (e: 'suggestionClick', suggestion: { id: string }): void;
  (e: 'eventDrop', event: { id: string; start: string; end: string }): void;
  (e: 'eventResize', event: { id: string; start: string; end: string }): void;
  (e: 'dateClick', date: Date): void;
  (e: 'viewChange', view: string): void;
}>();

const calendarRef = ref<InstanceType<typeof FullCalendar>>();
const currentView = ref('timeGridWeek');
const lastEmittedView = ref<string | null>(null);

// Получаем все назначенные цвета из текущих appointments
const assignedColors = computed(() => {
  const colors = new Set<string>()
  props.appointments.forEach((apt) => {
    if (apt.doctor?.color) {
      colors.add(apt.doctor.color)
    }
  })
  return colors
})

// Получаем доступные цвета (неиспользованные назначенными)
const availableColors = computed(() => {
  return doctorColors.filter((color) => !assignedColors.value.has(color))
})

// Получаем цвет для врача: если задан - используем его, иначе выбираем из доступных
const getDoctorColor = (doctorId?: string, doctorColor?: string): string => {
  // Если у врача задан цвет - используем его
  if (doctorColor) {
    return doctorColor
  }

  if (!doctorId) {
    return '#6b7280' // gray для неизвестного врача
  }

  // Получаем доступные цвета
  const available = availableColors.value.length > 0
    ? availableColors.value
    : doctorColors // Если все цвета использованы, используем полную палитру

  // Используем хеш doctorId для детерминированного выбора цвета
  let hash = 0
  for (let i = 0; i < doctorId.length; i++) {
    hash = doctorId.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % available.length
  return available[index] || '#3b82f6' // fallback на синий цвет
}

// Преобразуем предложения в формат FullCalendar
const suggestionEvents = computed<EventInput[]>(() => {
  return props.suggestions
    .filter((s) => s.status === 'pending')
    .map((suggestion) => {
      const patientName = suggestion.patient
        ? `${suggestion.patient.firstName || ''} ${suggestion.patient.lastName || ''}`.trim() || 'Неизвестный пациент'
        : 'Неизвестный пациент'
      const doctorName = suggestion.doctor
        ? `${suggestion.doctor.firstName || ''} ${suggestion.doctor.lastName || ''}`.trim() || 'Неизвестный врач'
        : 'Неизвестный врач'

      const title = `${patientName} (${doctorName}) [Предложение]`
      const startTime = suggestion.startTime ? new Date(suggestion.startTime).toISOString() : new Date().toISOString()
      const endTime = suggestion.endTime ? new Date(suggestion.endTime).toISOString() : new Date().toISOString()

      // Получаем цвет для врача
      const doctorBaseColor = getDoctorColor(suggestion.doctorId, suggestion.doctor?.color || undefined)

      return {
        id: `suggestion-${suggestion.id}`,
        title,
        start: startTime,
        end: endTime,
        extendedProps: {
          suggestionId: suggestion.id,
          patientId: suggestion.patientId,
          doctorId: suggestion.doctorId,
          patientName,
          doctorName,
          notes: suggestion.notes,
          isSuggestion: true,
        },
        backgroundColor: 'transparent', // Прозрачный фон
        borderColor: doctorBaseColor, // Цветной бордер
        borderWidth: 3, // Толстый бордер
        classNames: ['appointment-suggestion', `doctor-${suggestion.doctorId || 'unknown'}`],
        display: 'block',
        allDay: false,
        editable: false, // Предложения нельзя перемещать
      }
    })
})

// Преобразуем appointments в формат FullCalendar
const calendarEvents = computed<EventInput[]>(() => {
  const appointmentEvents = props.appointments.map((apt) => {
    const patientName = apt.patient
      ? `${apt.patient.firstName || ''} ${apt.patient.lastName || ''}`.trim() || 'Неизвестный пациент'
      : 'Неизвестный пациент'
    const doctorName = apt.doctor
      ? `${apt.doctor.firstName || ''} ${apt.doctor.lastName || ''}`.trim() || 'Неизвестный врач'
      : 'Неизвестный врач'

    // Формируем заголовок с информацией о враче
    const title = `${patientName} (${doctorName})`

    // Убеждаемся, что время в правильном формате
    const startTime = apt.startTime ? new Date(apt.startTime).toISOString() : new Date().toISOString()
    const endTime = apt.endTime ? new Date(apt.endTime).toISOString() : new Date().toISOString()

    // Получаем базовый цвет для врача
    // Если у врача задан цвет - используем его, иначе выбираем из доступных
    const doctorBaseColor = getDoctorColor(apt.doctorId, apt.doctor?.color)
    // Применяем модификацию в зависимости от статуса
    const eventColor = getStatusColor(apt.status, doctorBaseColor)

    return {
      id: apt.id,
      title,
      start: startTime,
      end: endTime,
      extendedProps: {
        patientId: apt.patientId,
        doctorId: apt.doctorId,
        patientName,
        doctorName,
        notes: apt.notes,
        status: apt.status,
      },
      backgroundColor: eventColor,
      borderColor: eventColor,
      classNames: [`status-${apt.status || 'scheduled'}`, `doctor-${apt.doctorId || 'unknown'}`],
      display: 'block', // Явно указываем отображение
      allDay: false, // Явно указываем, что это не событие на весь день
    }
  })

  // Объединяем приёмы и предложения
  return [...appointmentEvents, ...suggestionEvents.value]
})

// Палитра цветов для врачей (яркие, контрастные цвета)
const doctorColors = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#a855f7', // violet
  '#ef4444', // red
]


// Применяем модификацию цвета в зависимости от статуса
const getStatusColor = (status?: string, baseColor?: string): string => {
  const color = baseColor || '#3b82f6' // default blue

  switch (status) {
    case 'completed':
      // Для завершённых приёмов делаем цвет более светлым и добавляем зелёный оттенок
      return adjustColorBrightness(color, 0.3, 0.1) // светлее и немного зелёнее
    case 'cancelled':
      // Для отменённых приёмов делаем цвет более тёмным и добавляем красный оттенок
      return adjustColorBrightness(color, -0.4, -0.2) // темнее и краснее
    default:
      // Для запланированных приёмов используем базовый цвет врача
      return color
  }
}

// Функция для изменения яркости и оттенка цвета
const adjustColorBrightness = (hex: string, brightness: number, hueShift: number): string => {
  // Удаляем # если есть
  hex = hex.replace('#', '')

  // Конвертируем hex в RGB
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  // Применяем изменение яркости
  const newR = Math.max(0, Math.min(255, r + brightness * 255))
  const newG = Math.max(0, Math.min(255, g + brightness * 255 + hueShift * 255))
  const newB = Math.max(0, Math.min(255, b + brightness * 255 - hueShift * 255))

  // Конвертируем обратно в hex
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`
}

const handleEventClick = (info: any) => {
  const extendedProps = info.event.extendedProps || {}

  // Если это предложение, отправляем специальное событие
  if (extendedProps.isSuggestion) {
    emit('suggestionClick', { id: extendedProps.suggestionId })
  } else {
    emit('eventClick', { id: info.event.id })
  }
};

const handleEventDrop = (info: any) => {
  emit('eventDrop', {
    id: info.event.id,
    start: info.event.start.toISOString(),
    end: info.event.end?.toISOString() || info.event.start.toISOString(),
  });
};

const handleEventResize = (info: any) => {
  emit('eventResize', {
    id: info.event.id,
    start: info.event.start.toISOString(),
    end: info.event.end?.toISOString() || info.event.start.toISOString(),
  });
};

const handleDateClick = (info: any) => {
  emit('dateClick', info.date);
};

const handleViewChange = () => {
  if (calendarRef.value) {
    const view = calendarRef.value.getApi().view.type;
    // Эмитим событие только если вид действительно изменился
    if (view !== lastEmittedView.value) {
      currentView.value = view;
      lastEmittedView.value = view;
      emit('viewChange', view);
    }
  }
};

const goToToday = () => {
  calendarRef.value?.getApi().today();
};

const prev = () => {
  calendarRef.value?.getApi().prev();
};

const next = () => {
  calendarRef.value?.getApi().next();
};

const changeView = (view: string) => {
  calendarRef.value?.getApi().changeView(view);
};

// Опции календаря
const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'timeGridWeek',
  initialDate: props.initialDate,
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay',
  },
  locale: ruLocale,
  firstDay: 1, // Понедельник
  slotMinTime: '08:00:00',
  slotMaxTime: '22:00:00', // Расширяем до 22:00, чтобы видеть события до 20:30
  scrollTime: '08:00:00', // Время прокрутки по умолчанию
  slotDuration: '00:30:00',
  slotLabelInterval: '01:00:00',
  allDaySlot: false,
  height: 'auto',
  events: calendarEvents.value,
  editable: props.editable,
  droppable: false,
  eventResizableFromStart: props.editable,
  eventClick: handleEventClick,
  eventDrop: handleEventDrop,
  eventResize: handleEventResize,
  dateClick: props.allowDateClick ? handleDateClick : undefined,
  datesSet: () => {
    // datesSet вызывается слишком часто, не используем его для viewChange
  },
  viewDidMount: handleViewChange,
  eventContent: (arg: any) => {
    const event = arg.event
    const extendedProps = event.extendedProps || {}
    const view = arg.view.type
    const isSuggestion = extendedProps.isSuggestion || false

    // Получаем данные из extendedProps или из title
    const patientName = extendedProps.patientName || event.title?.split(' (')[0] || 'Приём'
    const doctorName = extendedProps.doctorName || ''

    // Цвет текста: черный для предложений, белый для обычных приёмов
    const textColor = isSuggestion ? '#000000' : 'white'

    // Для timeGrid видов (день/неделя) используем простое отображение
    if (view === 'timeGridDay' || view === 'timeGridWeek') {
      return {
        html: `<div style="padding: 2px 4px; font-size: 11px; line-height: 1.3; color: ${textColor};">
          <div style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${patientName}</div>
          ${doctorName ? `<div style="font-size: 9px; opacity: 0.9; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${doctorName}</div>` : ''}
        </div>`,
      }
    }

    // Для month вида используем кастомное отображение с дополнительной информацией
    const time = arg.timeText || ''

    return {
      html: `<div class="fc-event-main-frame" style="color: ${textColor};">
        ${time ? `<div class="fc-event-time" style="color: ${textColor};">${time}</div>` : ''}
        <div class="fc-event-title-container">
          <div class="fc-event-title" style="color: ${textColor};">${patientName}</div>
          ${doctorName ? `<div class="fc-event-doctor" style="color: ${textColor};">${doctorName}</div>` : ''}
        </div>
      </div>`,
    }
  },
}));

defineExpose({
  goToToday,
  prev,
  next,
  changeView,
  getApi: () => calendarRef.value?.getApi(),
});
</script>

<template>
  <div class="fullcalendar-wrapper">
    <FullCalendar
      ref="calendarRef"
      :options="calendarOptions"
    />
  </div>
</template>

<style lang="scss" scoped>
.fullcalendar-wrapper {
  @apply p-4;
}

/* Стили для FullCalendar */
.fc {
  @apply font-sans;
}

.fc-header-toolbar {
  @apply mb-4 flex flex-wrap items-center justify-between gap-2;
}

.fc-button {
  @apply rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.fc-button-active {
  @apply bg-blue-600 text-white hover:bg-blue-700;
}

.fc-button-primary:not(:disabled):active,
.fc-button-primary:not(:disabled).fc-button-active {
  @apply bg-blue-600 text-white;
}

.fc-today-button {
  @apply rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50;
}

.fc-toolbar-title {
  @apply text-xl font-semibold text-gray-900;
}

.fc-event {
  @apply cursor-pointer rounded border-none p-1 text-xs;
  min-height: 20px;
}

.fc-timegrid-event {
  min-height: 20px !important;
  padding: 1px 3px !important;
  border-radius: 3px;
  cursor: pointer;
}

.fc-timegrid-event .fc-event-main {
  padding: 0 !important;
}

.fc-timegrid-event .fc-event-title {
  font-size: 11px !important;
  font-weight: 600 !important;
  line-height: 1.2 !important;
  padding: 0 !important;
}

.fc-event-title {
  @apply font-semibold;
}

.fc-event-time {
  @apply mb-1 text-[10px] font-medium opacity-90;
}

.fc-event-doctor {
  @apply mt-0.5 text-[10px] opacity-75;
}

.fc-event-status {
  @apply ml-auto text-xs font-bold;
}

.fc-event.status-scheduled .fc-event-status {
  @apply text-blue-600;
}

.fc-event.status-completed .fc-event-status {
  @apply text-green-600;
}

.fc-event.status-cancelled .fc-event-status {
  @apply text-red-600;
}

/* Стили для отменённых приёмов - пунктирная рамка */
.fc-event.status-cancelled {
  border-style: dashed !important;
  opacity: 0.7;
}

/* Стили для завершённых приёмов - более прозрачные */
.fc-event.status-completed {
  opacity: 0.85;
}

/* Стили для предложений приёмов - прозрачный фон, цветной бордер */
.fc-event.appointment-suggestion {
  background-color: transparent !important;
  border-width: 3px !important;
  border-style: solid !important;
  opacity: 0.9;
  font-weight: 600;
  color: #000000 !important; /* Черный цвет текста */
}

.fc-event.appointment-suggestion:hover {
  opacity: 1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Черный цвет текста для всех элементов внутри предложения */
.fc-event.appointment-suggestion .fc-event-title,
.fc-event.appointment-suggestion .fc-event-main,
.fc-event.appointment-suggestion .fc-event-main-frame,
.fc-event.appointment-suggestion div {
  color: #000000 !important;
}

.fc-timegrid-slot {
  @apply h-12;
}

.fc-daygrid-day {
  @apply min-h-[100px];
}

.fc-col-header-cell {
  @apply bg-gray-50 p-2 text-center text-sm font-medium text-gray-700;
}

.fc-timegrid-col {
  @apply border-r border-gray-200;
}

.fc-day-today {
  @apply bg-blue-50;
}
</style>

