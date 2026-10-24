// Calendar utility for Google Calendar URL & .ics file download

function parseEventDate(dateStr, timeStr) {
  const d = new Date(dateStr)
  let hours = 10
  let minutes = 0

  if (timeStr) {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i)
    if (match) {
      hours = parseInt(match[1], 10)
      minutes = parseInt(match[2], 10)
      const period = match[3] ? match[3].toUpperCase() : null
      if (period === 'PM' && hours < 12) hours += 12
      if (period === 'AM' && hours === 12) hours = 0
    }
  }

  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hours, minutes)
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000) // Default 2 hours

  return { start, end }
}

function formatDateToICS(date) {
  return date.toISOString().replace(/-|:|\.\d+/g, '')
}

export function getGoogleCalendarUrl(event, club) {
  const { start, end } = parseEventDate(event.date, event.time)
  const startIso = formatDateToICS(start)
  const endIso = formatDateToICS(end)
  const title = encodeURIComponent(`${event.title} - ${club?.name || 'PICT'}`)
  const details = encodeURIComponent(
    `${event.description || ''}\n\nOrganized by ${club?.name || 'PICT Student Chapter'}\nAccess your digital pass on ClubSync: ${window.location.origin}/#/events/${event.id}`
  )
  const location = encodeURIComponent(event.location || 'Pune Institute of Computer Technology (PICT), Pune')

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`
}

export function downloadICSFile(event, club) {
  const { start, end } = parseEventDate(event.date, event.time)
  const startIso = formatDateToICS(start)
  const endIso = formatDateToICS(end)
  const stampIso = formatDateToICS(new Date())

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ClubSync//PICT Pune Campus Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id || 'event'}@clubsync.app`,
    `DTSTAMP:${stampIso}`,
    `DTSTART:${startIso}`,
    `DTEND:${endIso}`,
    `SUMMARY:${(event.title || 'Event').replace(/,/g, '\\,')}`,
    `DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n').replace(/,/g, '\\,')}`,
    `LOCATION:${(event.location || 'PICT Pune').replace(/,/g, '\\,')}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'DESCRIPTION:Event Reminder: Starting in 1 hour',
    'ACTION:DISPLAY',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ]

  const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `${(event.title || 'event').replace(/[^a-zA-Z0-9_-]/g, '_')}.ics`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
