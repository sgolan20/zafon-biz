/**
 * Initial seed data for categories and towns.
 *
 * These are loaded into Firestore via scripts/seed-firestore.ts on first
 * setup. They can be edited later from the admin panel (in a future phase)
 * or manually via the Firebase console.
 *
 * Categories use lucide-react icon names. Towns are organized by region.
 */

import type { Category, Town } from "./types";

export const SEED_CATEGORIES: Omit<Category, "id">[] = [
  { name: "מסעדנות וקייטרינג", icon: "utensils-crossed", order: 1 },
  { name: "חקלאות ומזון מקומי", icon: "wheat", order: 2 },
  { name: "תיירות ואירוח", icon: "tent-tree", order: 3 },
  { name: "טיפולים ובריאות", icon: "heart-pulse", order: 4 },
  { name: "יופי וטיפוח", icon: "sparkles", order: 5 },
  { name: "אומנות ועבודת יד", icon: "palette", order: 6 },
  { name: "נגרות ועבודות מתכת", icon: "hammer", order: 7 },
  { name: "חינוך והדרכה", icon: "graduation-cap", order: 8 },
  { name: "קורסים וסדנאות", icon: "book-open", order: 9 },
  { name: "ביגוד והנעלה", icon: "shirt", order: 10 },
  { name: "ספורט ופנאי", icon: "dumbbell", order: 11 },
  { name: "ייעוץ והדרכה עסקית", icon: "briefcase", order: 12 },
  { name: "רכב ושירות", icon: "car", order: 13 },
  { name: "תקשורת ומחשבים", icon: "laptop", order: 14 },
  { name: "שיווק ועיצוב", icon: "pen-tool", order: 15 },
  { name: "בנייה ושיפוצים", icon: "wrench", order: 16 },
  { name: "אירועים וצילום", icon: "camera", order: 17 },
  { name: "מתנות ומזכרות", icon: "gift", order: 18 },
  { name: "מוצרי תינוקות וילדים", icon: "baby", order: 19 },
  { name: "שירותים מקצועיים אחרים", icon: "more-horizontal", order: 20 },
];

export const SEED_TOWNS: Omit<Town, "id">[] = [
  // אצבע הגליל
  { name: "קריית שמונה", region: "אצבע הגליל", isBorderCommunity: true },
  { name: "מטולה", region: "אצבע הגליל", isBorderCommunity: true },
  { name: "מרגליות", region: "אצבע הגליל", isBorderCommunity: true },
  { name: "מנרה", region: "אצבע הגליל", isBorderCommunity: true },
  { name: "מלכיה", region: "אצבע הגליל", isBorderCommunity: true },
  { name: "יראון", region: "אצבע הגליל", isBorderCommunity: true },
  { name: "אבירים", region: "אצבע הגליל", isBorderCommunity: true },
  { name: "כפר גלעדי", region: "אצבע הגליל", isBorderCommunity: false },
  { name: "דפנה", region: "אצבע הגליל", isBorderCommunity: false },
  { name: "דן", region: "אצבע הגליל", isBorderCommunity: false },
  { name: "דישון", region: "אצבע הגליל", isBorderCommunity: false },
  { name: "בית הלל", region: "אצבע הגליל", isBorderCommunity: false },
  { name: "גונן", region: "אצבע הגליל", isBorderCommunity: true },
  { name: "שאר ישוב", region: "אצבע הגליל", isBorderCommunity: false },
  { name: "שניר", region: "אצבע הגליל", isBorderCommunity: false },
  { name: "ראש פינה", region: "אצבע הגליל", isBorderCommunity: false },

  // גליל עליון מערבי
  { name: "אביבים", region: "גליל עליון", isBorderCommunity: true },
  { name: "ברעם", region: "גליל עליון", isBorderCommunity: true },
  { name: "סאסא", region: "גליל עליון", isBorderCommunity: true },
  { name: "יפתח", region: "גליל עליון", isBorderCommunity: false },
  { name: "חורפיש", region: "גליל עליון", isBorderCommunity: false },
  { name: "שתולה", region: "גליל עליון", isBorderCommunity: true },
  { name: "אילון", region: "גליל עליון", isBorderCommunity: true },
  { name: "נווה זיו", region: "גליל עליון", isBorderCommunity: false },
  { name: "שלומי", region: "גליל עליון", isBorderCommunity: true },
  { name: "חצור הגלילית", region: "גליל עליון", isBorderCommunity: false },
  { name: "עמיעד", region: "גליל עליון", isBorderCommunity: false },

  // רמת הגולן הצפונית
  { name: "מסעדה", region: "רמת הגולן", isBorderCommunity: true },
  { name: "מג'דל שמס", region: "רמת הגולן", isBorderCommunity: true },
  { name: "בוקעאתא", region: "רמת הגולן", isBorderCommunity: true },
  { name: "עין קיניה", region: "רמת הגולן", isBorderCommunity: true },
  { name: "מרום גולן", region: "רמת הגולן", isBorderCommunity: false },
  { name: "נווה אטיב", region: "רמת הגולן", isBorderCommunity: true },
];

/**
 * Dummy businesses used for initial testing of the site.
 * After Phase 1 verification, these will be replaced with real submissions.
 */
export const SEED_DUMMY_BUSINESSES = [
  {
    name: "מאפיית הר ארץ",
    description:
      "מאפייה בוטיק במטולה. לחמים מחמצת, חלות וקרואסונים כל בוקר. משלוחים לכל הצפון.",
    shortDescription: "מאפיית בוטיק עם לחם מחמצת ומאפים יומיים",
    category: "מסעדנות וקייטרינג",
    town: "מטולה",
    contactName: "יעל כהן",
    phone: "054-1234567",
    whatsapp: "054-1234567",
    openingHours: "א-ה 06:00-17:00, ו 06:00-14:00",
  },
  {
    name: "חוות הברוש",
    description:
      "חוות זיתים אורגנית בקריית שמונה. שמן זית כתית מעולה, זיתים כבושים ומוצרי בוטיק. משלוחים בכל הארץ.",
    shortDescription: "שמן זית אורגני וזיתים מהגליל העליון",
    category: "חקלאות ומזון מקומי",
    town: "קריית שמונה",
    contactName: "אבי לוי",
    phone: "052-7654321",
    email: "havat.habrosh@example.com",
    website: "https://example.com",
  },
  {
    name: "צימרי שקיעות הגולן",
    description:
      "צימרים יוקרתיים במג'דל שמס עם נוף מרהיב לחרמון. ג'קוזי, ארוחת בוקר טבעית, וקרבה לטבע.",
    shortDescription: "צימרים עם נוף לחרמון וארוחת בוקר",
    category: "תיירות ואירוח",
    town: "מג'דל שמס",
    contactName: "סלים מרעי",
    phone: "050-9876543",
    whatsapp: "050-9876543",
    openingHours: "פתוח כל השנה, צ'ק-אין 15:00, צ'ק-אאוט 11:00",
  },
  {
    name: "סטודיו אורנה - יוגה ופילאטיס",
    description:
      "סטודיו אינטימי לתרגול יוגה, פילאטיס ומיינדפולנס. שיעורים פרונטליים ואונליין לכל הרמות.",
    shortDescription: "שיעורי יוגה ופילאטיס פרונטלי ואונליין",
    category: "טיפולים ובריאות",
    town: "ראש פינה",
    contactName: "אורנה מזרחי",
    phone: "053-4567890",
    instagram: "https://instagram.com/example",
  },
  {
    name: "נגריית הגליל",
    description:
      "נגרייה משפחתית בכפר גלעדי. רהיטים בעיצוב אישי, מטבחים, ארונות, ומוצרי עץ. עבודה אישית עם כל לקוח.",
    shortDescription: "רהיטים ומטבחים בעיצוב אישי מעץ מלא",
    category: "נגרות ועבודות מתכת",
    town: "כפר גלעדי",
    contactName: "דוד שמעוני",
    phone: "054-3216547",
    address: "רחוב התעשייה 5, כפר גלעדי",
  },
  {
    name: "סדנאות קרמיקה - דנה",
    description:
      "סדנאות קרמיקה לקבוצות וליחידים בסטודיו פרטי בקריית שמונה. חוויה יצירתית מהצפון - מתאים גם למתחילים.",
    shortDescription: "סדנאות קרמיקה לקבוצות ויחידים",
    category: "אומנות ועבודת יד",
    town: "קריית שמונה",
    contactName: "דנה ברק",
    phone: "058-2345678",
    instagram: "https://instagram.com/example",
  },
  {
    name: "סטודיו עיצוב גרפי - הצפון",
    description:
      "עיצוב לוגו, מיתוג עסקי, חומרים שיווקיים ואתרי אינטרנט לעסקים מהצפון ומכל הארץ. ניסיון של 12 שנה.",
    shortDescription: "עיצוב לוגו, מיתוג ואתרים לעסקים",
    category: "שיווק ועיצוב",
    town: "קריית שמונה",
    contactName: "תומר אלון",
    phone: "050-1112233",
    email: "tomer@example.com",
    website: "https://example.com",
  },
  {
    name: "מרפאת שיניים ד״ר רחמני",
    description:
      "מרפאת שיניים פרטית במטולה. טיפולי שורש, אסתטיקה, יישור שיניים שקוף וטיפולי ילדים. צוות מקצועי וחם.",
    shortDescription: "טיפולי שיניים מקצועיים לכל המשפחה",
    category: "טיפולים ובריאות",
    town: "מטולה",
    contactName: "ד״ר אורי רחמני",
    phone: "04-6951234",
    address: "רחוב העצמאות 12, מטולה",
    openingHours: "א, ג, ה 08:00-19:00, ב, ד 08:00-14:00",
  },
  {
    name: "חנות הספרים של ענת",
    description:
      "חנות ספרים עצמאית בראש פינה. מבחר ספרי קריאה, ספרי ילדים, ספרי בישול ומתנות ייחודיות. משלוחים בכל הארץ.",
    shortDescription: "חנות ספרים עצמאית עם משלוחים",
    category: "מתנות ומזכרות",
    town: "ראש פינה",
    contactName: "ענת שרון",
    phone: "052-9988776",
    email: "anat.books@example.com",
  },
  {
    name: "צביעת רכב מהיר - עידן",
    description:
      "מוסך צביעה ופחחות בקריית שמונה. עבודה איכותית, מחירים הוגנים, מומחים בתיקון נזקי תאונה ושריטות.",
    shortDescription: "פחחות וצבע - תיקון נזקי תאונה ושריטות",
    category: "רכב ושירות",
    town: "קריית שמונה",
    contactName: "עידן ביטון",
    phone: "054-7773322",
    address: "אזור התעשייה דרומי, קריית שמונה",
    openingHours: "א-ה 07:30-17:00, ו 07:30-13:00",
  },
];
