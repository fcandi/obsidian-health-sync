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

/** Erstellt einen Ordner inkl. aller Eltern-Verzeichnisse */
async function ensureFolderExists(app: App, folderPath: string): Promise<void> {
	const normalized = normalizePath(folderPath);
	if (app.vault.getAbstractFileByPath(normalized)) return;
	const parts = normalized.split("/");
	let current = "";
	for (const part of parts) {
		current = current ? `${current}/${part}` : part;
		if (!app.vault.getAbstractFileByPath(current)) {
			await app.vault.createFolder(current);
		}
	}
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
		// Neue Daily Note erstellen (ggf. mit Unterverzeichnissen aus dem Format)
		const filePath = normalizePath(`${options.dailyNotePath}/${fileName}.md`);
		const fileDir = filePath.substring(0, filePath.lastIndexOf("/"));
		if (fileDir) {
			await ensureFolderExists(app, fileDir);
		}
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
	const applyProperties = (frontmatter: Record<string, unknown>): void => {
		for (const [key, value] of Object.entries(properties)) {
			frontmatter[key] = value;
		}
	};

	// A: Praeventiv doppelte Frontmatter-Keys bereinigen
	await deduplicateFrontmatter(app, file);

	try {
		await app.fileManager.processFrontMatter(file, applyProperties);
	} catch (e) {
		// B: Falls YAML trotzdem fehlschlaegt, aggressiver bereinigen und nochmal versuchen
		if (e instanceof Error && e.message.includes("Map keys must be unique")) {
			console.warn("Health Sync: Fixing corrupt frontmatter in", file.path);
			await deduplicateFrontmatter(app, file);
			await app.fileManager.processFrontMatter(file, applyProperties);
		} else {
			throw e;
		}
	}
}

/**
 * Bereinigt doppelte Top-Level-Keys im Frontmatter einer Datei.
 * Behaelt jeweils den letzten Wert (neueste Daten).
 */
async function deduplicateFrontmatter(app: App, file: TFile): Promise<void> {
	const content = await app.vault.read(file);
	const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (!fmMatch) return;

	const fmContent = fmMatch[1]!;
	const lines = fmContent.split("\n");

	// Top-Level-Keys und ihre Zeilenbereiche identifizieren
	const entries: { key: string; start: number; end: number }[] = [];
	for (let i = 0; i < lines.length; i++) {
		const keyMatch = lines[i]!.match(/^([a-zA-Z_][\w]*)\s*:/);
		if (keyMatch) {
			if (entries.length > 0) entries[entries.length - 1]!.end = i - 1;
			entries.push({ key: keyMatch[1]!, start: i, end: i });
		} else if (entries.length > 0) {
			// Continuation-Zeile (z.B. YAML-Array) → gehoert zum letzten Key
			entries[entries.length - 1]!.end = i;
		}
	}

	// Duplikate finden — letztes Vorkommen jedes Keys behalten
	const lastIndex = new Map<string, number>();
	let hasDuplicates = false;
	for (let i = 0; i < entries.length; i++) {
		if (lastIndex.has(entries[i]!.key)) hasDuplicates = true;
		lastIndex.set(entries[i]!.key, i);
	}
	if (!hasDuplicates) return;

	const keep = new Set(lastIndex.values());
	const newLines: string[] = [];
	for (let i = 0; i < entries.length; i++) {
		if (keep.has(i)) {
			for (let j = entries[i]!.start; j <= entries[i]!.end; j++) {
				newLines.push(lines[j]!);
			}
		}
	}

	const newContent = content.replace(/^---\r?\n[\s\S]*?\r?\n---/, `---\n${newLines.join("\n")}\n---`);
	if (newContent !== content) {
		await app.vault.modify(file, newContent);
		console.debug("Health Sync: Deduplicated frontmatter in", file.path);
	}
}

/**
 * Einfache Datumsformatierung fuer Daily Note Dateinamen.
 * Unterstuetzt YYYY, MM, DD Platzhalter.
 */
function formatDate(dateStr: string, format: string): string {
	const [year, month, day] = dateStr.split("-");
	if (!year || !month || !day) return dateStr;

	return format
		.replace(/YYYY/g, year)
		.replace(/MM/g, month)
		.replace(/DD/g, day);
}
