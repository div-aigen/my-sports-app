export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

export const formatTime = (timeString) => {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

export const formatDateTime = (dateString) => {
  return formatDate(dateString);
};

export const formatEndTimeWithDate = (startTime, endTime, dateString) => {
  if (!endTime) return 'N/A';

  const formattedTime = formatTime(endTime);

  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  if (endMinutes <= startMinutes && startTime) {
    const date = new Date(dateString);
    const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
    const formattedDate = formatDate(nextDate.toISOString());
    return `${formattedTime} (${formattedDate})`;
  }

  return formattedTime;
};
