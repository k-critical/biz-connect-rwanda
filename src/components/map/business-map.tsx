"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type * as Leaflet from "leaflet";
import { OSM_ATTRIBUTION, OSM_TILES, loadLeaflet, pinIcon } from "./leaflet";

/**
 * A small map with the business's pin. The map library and tiles only load once the map
 * scrolls near the screen, so the page stays light on mobile data.
 */
export function BusinessMap({
  latitude,
  longitude,
  name,
}: {
  latitude: number;
  longitude: number;
  name: string;
}) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    let cancelled = false;
    let map: Leaflet.Map | undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        void loadLeaflet().then((L) => {
          if (cancelled) return;
          map = L.map(element, { scrollWheelZoom: false, dragging: !L.Browser.mobile }).setView(
            [latitude, longitude],
            16,
          );
          L.tileLayer(OSM_TILES, { maxZoom: 19, attribution: OSM_ATTRIBUTION }).addTo(map);
          L.marker([latitude, longitude], {
            icon: pinIcon(L),
            keyboard: false,
            title: name,
          }).addTo(map);
        });
      },
      { rootMargin: "300px" },
    );
    observer.observe(element);

    return () => {
      cancelled = true;
      observer.disconnect();
      map?.remove();
    };
  }, [latitude, longitude, name]);

  return (
    <div
      ref={container}
      role="img"
      aria-label={`Map showing where ${name} is`}
      className="isolate h-64 w-full overflow-hidden rounded-xl border border-border bg-surface-2 sm:h-72"
    />
  );
}
