/**
 * Reverse Geocoding via Nominatim (OpenStreetMap).
 * Kostenfrei, kein API-Key noetig. Rate Limit: 1 req/s pro IP.
 */

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";
const USER_AGENT = "ObsidianHealthSync/1.0";

/**
 * Entfernt nicht-lateinische Schriftzeichen aus einem String.
 * Nominatim liefert bei manchen Laendern Multiscript-Antworten
 * (z.B. "Oualidia ⵍⵡⴰⵍⵉⴷⵢⵢⴰ الوليدية"), wir wollen nur den lateinischen Teil.
 */
function cleanMultiscript(text: string): string {
	// Worte behalten, die nur aus Latin-Zeichen + gaengigen Sonderzeichen bestehen
	const words = text.split(/\s+/);
	const latin = words.filter(w => !/[\u0250-\uFFFF]/.test(w));
	return latin.length > 0 ? latin.join(" ").trim() : text.trim();
}

/**
 * Wandelt Koordinaten in einen lesbaren Ortsnamen um.
 * Nutzt die Obsidian-Sprache fuer lokalisierte Ergebnisse.
 * Gibt z.B. "Bad Honnef, Deutschland" zurueck, oder null bei Fehler.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
	try {
		const lang = document.documentElement.lang?.slice(0, 2) || "en";
		const url = `${NOMINATIM_URL}?lat=${lat}&lon=${lon}&format=json&zoom=14&accept-language=${lang}`;
		const response = await fetch(url, {
			headers: { "User-Agent": USER_AGENT },
		});

		if (!response.ok) return null;

		const data = await response.json() as {
			address?: {
				city?: string;
				town?: string;
				village?: string;
				municipality?: string;
				residential?: string;
				county?: string;
				state?: string;
				country?: string;
			};
		};

		if (!data.address) return null;

		const a = data.address;
		const rawPlace = a.city || a.town || a.village || a.municipality || a.residential || a.county || a.state;
		const place = rawPlace ? cleanMultiscript(rawPlace) : null;
		const country = a.country;

		if (place && country) return `${place}, ${country}`;
		if (place) return place;
		if (country) return country;
		return null;
	} catch {
		return null;
	}
}
