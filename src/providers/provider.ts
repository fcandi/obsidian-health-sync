/** Strukturierte Trainingsdaten fuer maschinenlesbare Ausgabe */
export interface TrainingEntry {
	type: string;
	category: string;
	distance_km?: number;
	duration_min?: number;
	avg_hr?: number;
	calories?: number;
}

/** Normalisierte Gesundheitsdaten — provider-unabhaengig */
export interface HealthData {
	/** Metriken als Key-Value (normalisierte Keys) */
	metrics: Record<string, number | string>;
	/** Aktivitaeten/Trainings als Key-Value (human-readable) */
	activities: Record<string, string>;
	/** Strukturierte Trainingsdaten (maschinenlesbar, optional) */
	trainings?: TrainingEntry[];
	/** Startkoordinaten der ersten Activity mit GPS */
	startLocation?: { lat: number; lon: number };
}

/** Interface das jeder Health-Provider implementiert */
export interface HealthProvider {
	/** Eindeutiger Name des Providers */
	readonly id: string;
	/** Anzeigename */
	readonly name: string;

	/** Prueft ob gueltige Credentials vorhanden sind */
	isConfigured(): boolean;

	/** Login durchfuehren, gibt true bei Erfolg zurueck */
	authenticate(): Promise<boolean>;

	/** Prueft ob die aktuelle Session noch gueltig ist */
	isSessionValid(): boolean;

	/** Gesundheitsdaten fuer ein bestimmtes Datum abrufen */
	fetchData(date: string, enabledMetrics: string[]): Promise<HealthData>;

	/** Empfohlene Pause zwischen Daten bei Batch-Operationen (ms) — optional */
	getRecommendedBatchDelay?(enabledMetrics: string[]): number;
}
