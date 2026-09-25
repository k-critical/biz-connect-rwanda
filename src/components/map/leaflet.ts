import type * as Leaflet from "leaflet";

/** Leaflet touches `window` when it loads, so it's only ever imported in the browser. */
export async function loadLeaflet(): Promise<typeof Leaflet> {
  const leaflet = await import("leaflet");
  return (leaflet as unknown as { default?: typeof Leaflet }).default ?? leaflet;
}

export const KIGALI: [number, number] = [-1.9441, 30.0619];

export const OSM_TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** The brand-coloured pin (styled in globals.css) instead of Leaflet's image marker. */
export function pinIcon(L: typeof Leaflet) {
  return L.divIcon({
    className: "map-pin",
    html:
      '<svg viewBox="0 0 30 42" width="30" height="42" aria-hidden="true">' +
      '<path d="M15 1C7.3 1 1 7.2 1 14.9 1 25.3 15 41 15 41s14-15.7 14-26.1C29 7.2 22.7 1 15 1z"/>' +
      '<circle cx="15" cy="15" r="5"/></svg>',
    iconSize: [30, 42],
    iconAnchor: [15, 41],
  });
}
