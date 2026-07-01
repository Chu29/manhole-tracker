// Cross-package constants — import these, do not redefine them locally
// in apps/mobile or apps/backend, so client and server always agree.

/** Client re-fetches GET /manholes/nearby once it has moved this far (meters)
 *  from the location of its last successful fetch. */
export const REFETCH_THRESHOLD_METERS = 15;

/** Minimum GPS movement (meters) that triggers a client-side re-sort of the
 *  already-cached manhole list (passed as `distanceInterval` to
 *  watchPositionAsync). */
export const LOCAL_RESORT_INTERVAL_METERS = 5;

/** Default search radius (meters) used by GET /manholes/nearby when the
 *  client does not supply one explicitly. */
export const DEFAULT_RADIUS_METERS = 500;

/** Max radius (meters) the backend will accept for a single nearby query,
 *  to keep the geospatial query bounded. */
export const MAX_RADIUS_METERS = 5000;

export const UTILITY_TYPES = ["sewer", "electrical", "telecom", "water"];

export const MANHOLE_STATUSES = ["active", "inactive", "buried", "damaged"];
