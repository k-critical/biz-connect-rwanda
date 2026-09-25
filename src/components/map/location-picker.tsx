"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import { LocateFixed, Trash2 } from "lucide-react";
import { RWANDA_BOUNDS } from "@/lib/listing-rules";
import { Button } from "@/components/ui/button";
import { KIGALI, OSM_ATTRIBUTION, OSM_TILES, loadLeaflet, pinIcon } from "./leaflet";

type Point = { lat: number; lng: number };

const insideRwanda = ({ lat, lng }: Point) =>
  lat >= RWANDA_BOUNDS.south &&
  lat <= RWANDA_BOUNDS.north &&
  lng >= RWANDA_BOUNDS.west &&
  lng <= RWANDA_BOUNDS.east;

const round = (value: number) => Math.round(value * 1e6) / 1e6;

const inputClasses =
  "h-11 rounded-lg border border-border-strong bg-surface px-3.5 text-base text-ink";

/**
 * A map to drop a pin on the business's entrance. The pin is sent as the `latitude` and
 * `longitude` form fields; the coordinates can also be typed in by hand.
 */
export function LocationPicker({
  defaultValue,
  error,
}: {
  defaultValue: Point | null;
  error?: string;
}) {
  const [point, setPoint] = useState<Point | null>(defaultValue);
  const [typed, setTyped] = useState({
    lat: defaultValue ? String(defaultValue.lat) : "",
    lng: defaultValue ? String(defaultValue.lng) : "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<{ L: typeof Leaflet; map: Leaflet.Map; marker: Leaflet.Marker | null }>(null);

  function place(next: Point | null, pan = false) {
    if (next && !insideRwanda(next)) {
      setMessage("That spot is outside Rwanda. Place the pin where the business is.");
      return;
    }
    const rounded = next && { lat: round(next.lat), lng: round(next.lng) };
    setMessage(null);
    setPoint(rounded);
    setTyped({ lat: rounded ? String(rounded.lat) : "", lng: rounded ? String(rounded.lng) : "" });
    if (pan && rounded) map.current?.map.setView([rounded.lat, rounded.lng], 17);
  }
  const placeRef = useRef(place);
  useEffect(() => {
    placeRef.current = place;
  });

  // Create the map once; the starting view only matters the first time.
  useEffect(() => {
    let cancelled = false;
    let instance: Leaflet.Map | undefined;
    const start = defaultValue;
    void loadLeaflet().then((L) => {
      if (cancelled || !container.current) return;
      instance = L.map(container.current, { scrollWheelZoom: false }).setView(
        start ? [start.lat, start.lng] : KIGALI,
        start ? 17 : 12,
      );
      L.tileLayer(OSM_TILES, { maxZoom: 19, attribution: OSM_ATTRIBUTION }).addTo(instance);
      instance.on("click", (event: Leaflet.LeafletMouseEvent) => placeRef.current(event.latlng));
      map.current = { L, map: instance, marker: null };
      setMapReady(true);
    });
    return () => {
      cancelled = true;
      instance?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the marker in step with the chosen point.
  useEffect(() => {
    const current = map.current;
    if (!current) return;
    if (!point) {
      current.marker?.remove();
      current.marker = null;
    } else if (current.marker) {
      current.marker.setLatLng([point.lat, point.lng]);
    } else {
      current.marker = current.L.marker([point.lat, point.lng], {
        icon: pinIcon(current.L),
        draggable: true,
        keyboard: false,
      })
        .on("dragend", (event) => placeRef.current((event.target as Leaflet.Marker).getLatLng()))
        .addTo(current.map);
    }
  }, [point, mapReady]);

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setMessage("Your browser can't share its location. Tap the map instead.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        place({ lat: position.coords.latitude, lng: position.coords.longitude }, true);
      },
      () => {
        setLocating(false);
        setMessage("We couldn't get your location. Tap the map where the business is instead.");
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  function applyTyped() {
    const lat = Number(typed.lat);
    const lng = Number(typed.lng);
    if (typed.lat.trim() === "" && typed.lng.trim() === "") return place(null);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !typed.lat || !typed.lng) {
      setMessage("Enter both numbers, e.g. -1.9441 and 30.0619.");
      return;
    }
    place({ lat, lng }, true);
  }

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name="latitude" value={point?.lat ?? ""} />
      <input type="hidden" name="longitude" value={point?.lng ?? ""} />

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={useMyLocation} loading={locating}>
          <LocateFixed aria-hidden /> Use my current location
        </Button>
        {point && (
          <Button variant="ghost" size="sm" onClick={() => place(null)}>
            <Trash2 aria-hidden /> Remove pin
          </Button>
        )}
      </div>

      <div
        ref={container}
        role="application"
        aria-label="Map. Tap where the business is to place a pin, then drag the pin to adjust it."
        className="isolate h-72 w-full overflow-hidden rounded-xl border border-border-strong bg-surface-2 sm:h-80"
      />

      <p className="text-sm text-ink-muted" aria-live="polite">
        {message ??
          (point
            ? `Pin placed at ${point.lat}, ${point.lng}. Drag it to adjust.`
            : "Tap the map where your entrance is. At the business right now? Use your current location.")}
      </p>
      {error && <p className="text-sm font-medium text-danger">{error}</p>}

      <details className="text-sm">
        <summary className="cursor-pointer font-semibold text-ink-muted">
          Type the coordinates instead
        </summary>
        <div className="mt-3 grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <label className="flex flex-col gap-1.5">
            <span className="font-semibold">Latitude</span>
            <input
              inputMode="decimal"
              value={typed.lat}
              onChange={(event) => setTyped((t) => ({ ...t, lat: event.target.value }))}
              placeholder="-1.9441"
              className={inputClasses}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-semibold">Longitude</span>
            <input
              inputMode="decimal"
              value={typed.lng}
              onChange={(event) => setTyped((t) => ({ ...t, lng: event.target.value }))}
              placeholder="30.0619"
              className={inputClasses}
            />
          </label>
          <Button variant="secondary" onClick={applyTyped}>
            Place pin
          </Button>
        </div>
      </details>
    </div>
  );
}
