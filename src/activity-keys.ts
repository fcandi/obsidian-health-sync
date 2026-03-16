/**
 * Normalisierung von Provider-spezifischen Activity-Keys auf kanonische Keys.
 *
 * Garmin-typeKeys dienen als Basis-Standard. Nur unnoetig sperrige Keys
 * werden normalisiert. Unbekannte Keys werden lowercase+underscore durchgereicht.
 *
 * Spaetere Provider (Fitbit, Oura, etc.) mappen ihre eigenen Bezeichnungen
 * auf dieselben kanonischen Keys.
 */

/** Cleanup-Mapping: Garmin typeKey → kanonischer Key */
const KEY_CLEANUP: Record<string, string> = {
	e_bike_fitness: "e_bike",
	e_bike_mountain: "e_mtb",
	resort_skiing_snowboarding: "skiing",
	backcountry_skiing_snowboarding: "backcountry_skiing",
	stand_up_paddleboarding: "sup",
	fitness_equipment: "gym_equipment",
};

/** Kategorie-Zuordnung fuer maschinenlesbare Trainings-Daten */
const CATEGORY_MAP: Record<string, string> = {
	// Cycling
	cycling: "cycling",
	e_bike: "cycling",
	e_mtb: "cycling",
	mountain_biking: "cycling",
	indoor_cycling: "cycling",
	road_biking: "cycling",
	gravel_cycling: "cycling",
	cyclocross: "cycling",
	bmx: "cycling",
	bike_commute: "cycling",
	bike_touring: "cycling",

	// Running
	running: "running",
	trail_running: "running",
	treadmill: "running",
	indoor_track: "running",
	track_running: "running",
	ultra_run: "running",
	virtual_run: "running",
	obstacle_racing: "running",

	// Walking
	walking: "walking",
	indoor_walking: "walking",

	// Hiking / Outdoor
	hiking: "outdoor",
	mountaineering: "outdoor",
	rock_climbing: "outdoor",
	bouldering: "outdoor",
	expedition: "outdoor",
	rucking: "outdoor",

	// Swimming
	swimming: "swimming",
	pool_swimming: "swimming",
	open_water_swimming: "swimming",
	lap_swimming: "swimming",

	// Winter Sports
	skiing: "winter",
	backcountry_skiing: "winter",
	cross_country_skiing: "winter",
	skate_skiing: "winter",
	snowboarding: "winter",
	snowshoeing: "winter",
	ice_skating: "winter",

	// Water Sports
	sup: "water",
	rowing: "water",
	indoor_rowing: "water",
	kayaking: "water",
	surfing: "water",
	sailing: "water",
	kiteboarding: "water",
	windsurfing: "water",

	// Gym / Fitness
	strength_training: "gym",
	gym_equipment: "gym",
	elliptical: "gym",
	yoga: "gym",
	pilates: "gym",
	hiit: "gym",
	cardio: "gym",
	boxing: "gym",
	jump_rope: "gym",
	stair_stepper: "gym",
	floor_climbing: "gym",
	indoor_climbing: "gym",

	// Racket Sports
	tennis: "racket",
	badminton: "racket",
	squash: "racket",
	table_tennis: "racket",
	pickleball: "racket",
	padel: "racket",

	// Team Sports
	soccer: "team",
	basketball: "team",
	volleyball: "team",
	rugby: "team",
	baseball: "team",
	softball: "team",
	cricket: "team",
	hockey: "team",
	ice_hockey: "team",
	lacrosse: "team",
	american_football: "team",

	// Other
	golf: "other",
	horseback_riding: "other",
	inline_skating: "other",
	skating: "other",
	meditation: "other",
	breathwork: "other",
	multi_sport: "other",
};

/**
 * Normalisiert einen Provider-Activity-Key auf den kanonischen Key.
 * Unbekannte Keys werden lowercase + underscore normalisiert durchgereicht.
 */
export function normalizeActivityKey(providerKey: string): string {
	const raw = providerKey.toLowerCase().replace(/\s+/g, "_");
	return KEY_CLEANUP[raw] ?? raw;
}

/**
 * Gibt die Kategorie fuer einen (bereits normalisierten) Activity-Key zurueck.
 * Fallback: "other"
 */
export function getActivityCategory(normalizedKey: string): string {
	return CATEGORY_MAP[normalizedKey] ?? "other";
}
