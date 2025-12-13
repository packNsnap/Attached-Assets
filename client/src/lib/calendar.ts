// Calendar event URL generators for multi-service support

interface CalendarEvent {
  title: string;
  description?: string;
  startDate: Date;
  duration: number; // in minutes
  location?: string;
}

/**
 * Generate Google Calendar URL
 */
export function getGoogleCalendarUrl(event: CalendarEvent): string {
  const startTime = event.startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const endDate = new Date(event.startDate.getTime() + event.duration * 60000);
  const endTime = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    details: event.description || '',
    location: event.location || '',
    dates: `${startTime}/${endTime}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate Outlook Calendar URL
 */
export function getOutlookCalendarUrl(event: CalendarEvent): string {
  const endDate = new Date(event.startDate.getTime() + event.duration * 60000);
  
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    startdt: event.startDate.toISOString(),
    enddt: endDate.toISOString(),
    subject: event.title,
    body: event.description || '',
    location: event.location || '',
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Generate iCal format for download
 */
export function getICalContent(event: CalendarEvent): string {
  const endDate = new Date(event.startDate.getTime() + event.duration * 60000);
  
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const uid = `${event.title.replace(/\s/g, '')}-${event.startDate.getTime()}`;
  
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Resume Logik//Interview Calendar//EN
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(event.startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${event.title}
DESCRIPTION:${event.description || ''}
LOCATION:${event.location || ''}
END:VEVENT
END:VCALENDAR`;
}

/**
 * Download calendar event as .ics file
 */
export function downloadCalendarFile(event: CalendarEvent, filename: string = 'interview.ics'): void {
  const icalContent = getICalContent(event);
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
