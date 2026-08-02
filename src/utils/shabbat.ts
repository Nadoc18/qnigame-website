/**
 * Shabbat Detection & Times Utility
 * Fetches Shabbat times from Hebcal API based on user location/IP,
 * with fallback calculations for offline/no-network usage.
 */

export interface ShabbatInfo {
  isShabbat: boolean;
  parasha: string;
  candleLightingStr: string;
  havdalahStr: string;
  candleLightingDate: Date | null;
  havdalahDate: Date | null;
  locationName: string;
}

// Fallback Shabbat Times & Parasha
const DEFAULT_SHABBAT_INFO: ShabbatInfo = {
  isShabbat: false,
  parasha: 'פרשת השבוע',
  candleLightingStr: '19:18',
  havdalahStr: '20:22',
  candleLightingDate: null,
  havdalahDate: null,
  locationName: 'ירושלים',
};

/**
 * Helper to translate common city names to Hebrew for cleaner UI display
 */
export function translateCityToHebrew(cityName: string): string {
  if (!cityName) return 'ירושלים';
  const lower = cityName.toLowerCase();
  if (lower.includes('jerusalem') || lower.includes('yerushalayim')) return 'ירושלים';
  if (lower.includes('harish') || lower.includes('חריש')) return 'חריש';
  if (lower.includes('tel aviv') || lower.includes('tlv')) return 'תל אביב';
  if (lower.includes('haifa')) return 'חיפה';
  if (lower.includes('beer sheva') || lower.includes('beersheba')) return 'באר שבע';
  if (lower.includes('bnei brak')) return 'בני ברק';
  if (lower.includes('ashdod')) return 'אשדוד';
  if (lower.includes('netanya')) return 'נתניה';
  if (lower.includes('petah tikva')) return 'פתח תקווה';
  if (lower.includes('rishon lezion')) return 'ראשון לציון';
  if (lower.includes('paris')) return 'פריז';
  if (lower.includes('london')) return 'לונדון';
  if (lower.includes('new york')) return 'ניו יורק';
  if (lower.includes('miami')) return 'מיאמי';
  if (lower.includes('los angeles')) return 'לוס אנג׳לס';
  return cityName;
}

/**
 * Checks if current time is within Shabbat bounds (Friday evening to Saturday night)
 */
export function checkIsShabbatFallback(now: Date = new Date()): boolean {
  const day = now.getDay(); // 0 = Sun, 5 = Fri, 6 = Sat
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  // Friday: Shabbat starts ~18:30 (1110 mins)
  if (day === 5 && timeInMinutes >= 18 * 60 + 30) {
    return true;
  }
  // Saturday: Shabbat continues until ~20:30 (1230 mins)
  if (day === 6 && timeInMinutes <= 20 * 60 + 30) {
    return true;
  }

  return false;
}

/**
 * Async fetch Shabbat times from Hebcal API using GPS or IP geolocation
 */
export async function getShabbatTimes(): Promise<ShabbatInfo> {
  const now = new Date();

  // Check browser timezone to prevent defaulting to US/New York for users in Israel
  const userTZ = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : '';
  const isIsraelTZ = userTZ === 'Asia/Jerusalem' || userTZ === 'Israel';

  // Default to Jerusalem, Israel (geonameid=281184) if in Israel, else IP lookup
  let url = isIsraelTZ
    ? 'https://www.hebcal.com/shabbat?cfg=json&geonameid=281184&M=on&b=18'
    : 'https://www.hebcal.com/shabbat?cfg=json&geo=ip&M=on&b=18';

  // Try retrieving browser GPS coordinates if permission is granted (e.g. Harish, Tel Aviv, etc.)
  if (typeof window !== 'undefined' && 'geolocation' in navigator) {
    try {
      const pos = await new Promise<GeolocationPosition | null>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (p) => resolve(p),
          () => resolve(null),
          { timeout: 3000 }
        );
      });
      if (pos) {
        const { latitude, longitude } = pos.coords;
        url = `https://www.hebcal.com/shabbat?cfg=json&geo=pos&lat=${latitude}&lon=${longitude}&M=on&b=18`;
      }
    } catch {
      // Fallback
    }
  }

  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!res.ok) throw new Error('Hebcal API request failed');
    
    const data = await res.json();
    const items = data.items || [];
    
    let parasha = 'פרשת השבוע';
    let candleItem = items.find((i: any) => i.category === 'candles');
    let havdalahItem = items.find((i: any) => i.category === 'havdalah');
    let parashatItem = items.find((i: any) => i.category === 'parashat');

    if (parashatItem) {
      parasha = parashatItem.hebrew || parashatItem.title || 'פרשת השבוע';
    }

    const candleLightingDate = candleItem ? new Date(candleItem.date) : null;
    const havdalahDate = havdalahItem ? new Date(havdalahItem.date) : null;

    let isShabbat = false;
    if (candleLightingDate && havdalahDate) {
      isShabbat = now >= candleLightingDate && now <= havdalahDate;
    } else {
      isShabbat = checkIsShabbatFallback(now);
    }

    const formatTime = (d: Date | null, fallback: string) => {
      if (!d) return fallback;
      return d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    };

    let rawCity = data.location?.title || data.location?.city || (isIsraelTZ ? 'ירושלים' : 'ישראל');
    
    // Safety check: if in Israel timezone but Hebcal IP return New York, override to Jerusalem
    if (isIsraelTZ && (rawCity.toLowerCase().includes('new york') || rawCity.toLowerCase().includes('united states'))) {
      rawCity = 'ירושלים';
    }

    const hebrewCity = translateCityToHebrew(rawCity);

    return {
      isShabbat,
      parasha,
      candleLightingStr: formatTime(candleLightingDate, '19:18'),
      havdalahStr: formatTime(havdalahDate, '20:22'),
      candleLightingDate,
      havdalahDate,
      locationName: hebrewCity,
    };
  } catch (err) {
    console.warn('Using fallback Shabbat calculation:', err);
    return {
      ...DEFAULT_SHABBAT_INFO,
      isShabbat: checkIsShabbatFallback(now),
    };
  }
}
