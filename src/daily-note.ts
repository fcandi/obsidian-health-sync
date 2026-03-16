import { App, TFile, TFolder, normalizePath } from "obsidian";
import type { HealthData } from "./providers/provider";
import { applyPrefix } from "./metrics";
import { reverseGeocode } from "./geocoding";

/**
 * Sucht eine Daily Note rekursiv im angegebenen Verzeichnis und allen Unterverzeichnissen.
 * Gibt den TFile zurueck falls gefunden, sonst null.
 */
function findDailyNoteRecursive(app: App, fileName: string, basePath: string): TFile | null {
	// 1. Direkt im Hauptverzeichnis pruefen (schneller Pfad)
	const directPath = normalizePath(`${basePath}/${fileName}.md`);
	const directFile = app.vault.getAbstractFileByPath(directPath);
	if (directFile instanceof TFile) return directFile;

	// 2. Rekursiv in Unterverzeichnissen suchen
	const baseFolder = app.vault.getAbstractFileByPath(normalizePath(basePath));
	if (!(baseFolder instanceof TFolder)) return null;

	return findInFolder(baseFolder, `${fileName}.md`);
}

function findInFolder(folder: TFolder, targetName: string): TFile | null {
	for (const child of folder.children) {
		if (child instanceof TFile && child.name === targetName) {
			return child;
		}
		if (child instanceof TFolder) {
			const found = findInFolder(child, targetName);
			if (found) return found;
		}
	}
	return null;
}

/**
 * Prueft ob eine Daily Note bereits Health-Daten im Frontmatter hat.
 * Gibt true zurueck wenn mindestens eine aktivierte Metrik vorhanden ist.
 */
export function hasHealthData(
	app: App,
	date: string,
	options: {
		dailyNotePath: string;
		dailyNoteFormat: string;
		prefix: string;
		enabledMetrics: string[];
	}
): boolean {
	const fileName = formatDate(date, options.dailyNoteFormat);
	const file = findDailyNoteRecursive(app, fileName, options.dailyNotePath);
	if (!file) return false;

	const cache = app.metadataCache.getFileCache(file);
	if (!cache?.frontmatter) return false;

	// Metriken pruefen
	for (const metric of options.enabledMetrics) {
		const key = applyPrefix(metric, options.prefix);
		if (cache.frontmatter[key] !== undefined) return true;
	}

	// Activity-Indikatoren pruefen (zeigen an, dass bereits gesynct wurde)
	for (const key of ["trainings", "workout_location"]) {
		if (cache.frontmatter[applyPrefix(key, options.prefix)] !== undefined) return true;
	}

	return false;
}

/**
 * Schreibt Gesundheitsdaten als Frontmatter-Properties in eine Daily Note.
 * Erstellt die Daily Note falls sie nicht existiert.
 */
export async function writeToDailyNote(
	app: App,
	date: string,
	data: HealthData,
	options: {
		dailyNotePath: string;
		dailyNoteFormat: string;
		prefix: string;
		template: string;
		writeTrainings: boolean;
		writeWorkoutLocation: boolean;
	}
): Promise<void> {
	const fileName = formatDate(date, options.dailyNoteFormat);

	// Rekursiv nach bestehender Daily Note suchen
	let file: TFile | null = findDailyNoteRecursive(app, fileName, options.dailyNotePath);

	if (!file) {
		// Neue Daily Note im Hauptverzeichnis erstellen
		const folder = options.dailyNotePath;
		if (folder) {
			const folderExists = app.vault.getAbstractFileByPath(normalizePath(folder));
			if (!folderExists) {
				await app.vault.createFolder(normalizePath(folder));
			}
		}
		const filePath = normalizePath(`${folder}/${fileName}.md`);
		const initialContent = options.template || "";
		file = await app.vault.create(filePath, initialContent);
	}

	// Properties vorbereiten
	const properties: Record<string, number | string | Record<string, unknown>[]> = {};

	for (const [key, value] of Object.entries(data.metrics)) {
		properties[applyPrefix(key, options.prefix)] = value;
	}

	for (const [key, value] of Object.entries(data.activities)) {
		properties[applyPrefix(key, options.prefix)] = value;
	}

	// Maschinenlesbare Trainings-Daten (optional)
	if (options.writeTrainings && data.trainings && data.trainings.length > 0) {
		properties[applyPrefix("trainings", options.prefix)] = data.trainings as unknown as Record<string, unknown>[];
	}

	// Workout Location via Reverse Geocoding (optional)
	if (options.writeWorkoutLocation && data.startLocation) {
		const locationName = await reverseGeocode(data.startLocation.lat, data.startLocation.lon);
		if (locationName) {
			properties[applyPrefix("workout_location", options.prefix)] = locationName;
		}
	}

	// Frontmatter aktualisieren
	await updateFrontmatter(app, file, properties);
}

/**
 * Aktualisiert oder ergaenzt Frontmatter-Properties in einer Datei.
 * Bestehende Properties werden ueberschrieben, andere bleiben erhalten.
 */
async function updateFrontmatter(
	app: App,
	file: TFile,
	properties: Record<string, number | string | Record<string, unknown>[]>
): Promise<void> {
	await app.fileManager.processFrontMatter(file, (frontmatter: Record<string, unknown>) => {
		for (const [key, value] of Object.entries(properties)) {
			frontmatter[key] = value;
		}
	});
}

/**
 * Einfache Datumsformatierung fuer Daily Note Dateinamen.
 * Unterstuetzt YYYY, MM, DD Platzhalter.
 */
function formatDate(dateStr: string, format: string): string {
	const [year, month, day] = dateStr.split("-");
	if (!year || !month || !day) return dateStr;

	return format
		.replace("YYYY", year)
		.replace("MM", month)
		.replace("DD", day);
}
