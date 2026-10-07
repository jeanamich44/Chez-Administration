const FR_MONTHS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre"
];

const EN_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const FR_MONTHS_SHORT = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc."
];
const JOURS_FULL = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"] as const;

function pad(value: number, width = 2) {
  return String(value).padStart(width, "0");
}

function lastWeekday(today: Date, weekday: number) {
  const delta = (today.getDay() === 0 ? 6 : today.getDay() - 1) - weekday;
  const shift = ((delta % 7) + 7) % 7 || 7;
  const date = new Date(today);
  date.setDate(today.getDate() - shift);
  return date;
}

function mondayIndex(date: Date) {
  return date.getDay() === 0 ? 6 : date.getDay() - 1;
}

/* ===================================================================== */

export function adidasInvoice(date = new Date()) {
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

export function adidasDelivery(date = new Date()) {
  return adidasInvoice(date);
}

export function amazonInvoice(date = new Date()) {
  return `${date.getDate()} ${FR_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function amazonOrder(date = new Date()) {
  const yesterday = new Date(date);
  yesterday.setDate(date.getDate() - 1);
  return amazonInvoice(yesterday);
}

export function fnacWeb(date = new Date()) {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear() % 100}`;
}

export function fnacMagasin(date = new Date()) {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function caEdition(date = new Date()) {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function sumupDocument(date = new Date()) {
  return `${pad(date.getDate())} ${EN_MONTHS[date.getMonth()]} ${date.getFullYear()}, ${pad(date.getHours())}:${pad(date.getMinutes())} GMT`;
}

export function sumupDocumentDate(date = new Date()) {
  return `${pad(date.getDate())} ${EN_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function sumupDocumentTime(date = new Date()) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function sumupOpening(date = new Date()) {
  const opened = new Date(date);
  opened.setMonth(date.getMonth() - 6);
  return `${pad(opened.getDate())} ${EN_MONTHS[opened.getMonth()]} ${opened.getFullYear()}`;
}

export function myposEdition(date = new Date()) {
  const month = FR_MONTHS[date.getMonth()];
  return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${pad(date.getDate())} ${date.getFullYear()}`;
}

export function nikeInvoice(date = new Date()) {
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

export function amiInvoice(date = new Date()) {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function burberryOrder(date = new Date()) {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear() % 100}`;
}

export function edfAttestation(date = new Date()) {
  const month = FR_MONTHS[date.getMonth()];
  return `${date.getDate()} ${month.charAt(0).toUpperCase()}${month.slice(1)} ${date.getFullYear()}`;
}

export function conduiteEdition(date = new Date()) {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function conduiteDate(date = new Date()) {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function conduiteTime(date = new Date()) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function conduiteLessons(date = new Date()) {
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const days = [5, 6, 2].map(weekday => lastWeekday(today, weekday)).sort((a, b) => a.getTime() - b.getTime());
  const slots: [string, string][] = [
    ["13:00", "16:00"],
    ["15:00", "18:00"],
    ["10:00", "13:00"]
  ];
  return days.map((day, index) => ({
    jour: JOURS_FULL[mondayIndex(day)],
    date: `${pad(day.getDate())}/${pad(day.getMonth() + 1)}/${date.getFullYear()}`,
    debut: slots[index][0],
    fin: slots[index][1],
    activite: "LECON PLATEAU",
    commentaire: ""
  }));
}

export function slashDate(date = new Date()) {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function isoDate(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function slashDateYY(date = new Date()) {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear() % 100}`;
}

export function parisDate(date = new Date()) {
  const month = FR_MONTHS[date.getMonth()];
  return `${date.getDate()} ${month} ${date.getFullYear()}`;
}

export function ticketDateTime(date = new Date()) {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function diorInvoice(date = new Date()) {
  const month = FR_MONTHS[date.getMonth()];
  const capMonth = (month.charAt(0).toUpperCase() + month.slice(1)).replace("é", "e");
  return `${date.getDate()}-${capMonth}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function diorDate(date = new Date()) {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function diorTime(date = new Date()) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function jacquemusInvoice(date = new Date()) {
  return `${EN_MONTHS[date.getMonth()]} ${date.getDate()},${date.getFullYear()}`;
}

export function jacquemusDate(date = new Date()) {
  return `${date.getDate()} ${FR_MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

export function jacquemusTime(date = new Date()) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function chanelInvoice(date = new Date()) {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function chanelDate(date = new Date()) {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function chanelTime(date = new Date()) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fredDate(date = new Date()) {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function fredDateLieu(date = new Date(), ville = "Neuilly Sur Marne") {
  const jours = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  return `${ville}, ${jours[date.getDay()]} ${date.getDate()} ${FR_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function nocibeDate(date = new Date()) {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}
