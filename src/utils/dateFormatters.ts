
export function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${day}/${month}/${year}`;
}

export function breakTitle(title: string, limit = 35) {
  if (!title) return "";
  let result = "";
  for (let i = 0; i < title.length; i += limit) {
    result += title.substr(i, limit) + "\n";
  }
  return result.trim();
}
