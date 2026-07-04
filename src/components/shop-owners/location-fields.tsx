"use client";

import { useEffect, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchOsm, type OsmAddressFill, type OsmPlace } from "@/lib/osm";

/**
 * Shared business-location field helpers used by both the full shop-owner setup
 * form ({@link ShopOwnerForm}) and the Master Admin inline location editor
 * ({@link BusinessLocationInlineForm}). Kept in one place so the OpenStreetMap
 * search + live-map behaviour never drifts between the two.
 */

export const WORKING_DAYS_OPTIONS = [
  "Monday – Saturday",
  "Monday – Friday",
  "Monday – Sunday",
  "All Days",
  "Weekends Only",
];

/** Parse a free-text lat/lng string into a number, or undefined if invalid. */
export function toCoord(v: string): number | undefined {
  const t = v.trim();
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Live map preview that re-centers on the current lat/lng. The embed URL is
 * keyed off the coordinates, so it updates the moment they change (typing, an
 * OSM pick, or "Get Current Location"). No API key required.
 */
export function LiveLocationMap({ lat, lon }: { lat: string; lon: string }) {
  const la = Number(lat);
  const lo = Number(lon);
  const hasCoords =
    lat.trim() !== "" && lon.trim() !== "" && Number.isFinite(la) && Number.isFinite(lo);

  if (!hasCoords) {
    return (
      <div className="mt-3 flex h-48 items-center justify-center rounded-md border border-dashed bg-muted/30 text-center text-xs text-muted-foreground">
        <span className="px-4">
          Enter a latitude &amp; longitude, pick an OpenStreetMap result, or use
          “Get Current Location” to preview the shop on a live map.
        </span>
      </div>
    );
  }

  // Google Maps embed via the no-API-key `output=embed` endpoint.
  const embedSrc = `https://maps.google.com/maps?q=${la},${lo}&z=16&hl=en&output=embed`;
  const fullMap = `https://www.google.com/maps/search/?api=1&query=${la},${lo}`;

  return (
    <div className="mt-3 space-y-1">
      <iframe
        // key forces a fresh load when coords change so the marker re-centers
        key={`${la},${lo}`}
        title="Shop location on Google Maps"
        src={embedSrc}
        className="h-48 w-full rounded-md border"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          📍 {la.toFixed(5)}, {lo.toFixed(5)}
        </span>
        <a
          href={fullMap}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline"
        >
          View larger map
        </a>
      </div>
    </div>
  );
}

/**
 * Shop-name input doubling as an OpenStreetMap (Nominatim) search box. Typing 3+
 * characters debounces a forward-geocode; picking a suggestion calls onPick with
 * the resolved address + coordinates.
 */
export function ShopNameOsmSearch({
  value,
  onValueChange,
  onPick,
}: {
  value: string;
  onValueChange: (v: string) => void;
  onPick: (fill: OsmAddressFill) => void;
}) {
  const [results, setResults] = useState<OsmPlace[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 3) {
      setResults([]);
      setLoading(false);
      setSearched(false);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(() => {
      searchOsm(q, ctrl.signal)
        .then((places) => {
          setResults(places);
          setSearched(true);
          setOpen(true);
        })
        .catch((e) => {
          if (!(e instanceof DOMException && e.name === "AbortError")) {
            setResults([]);
            setSearched(true);
          }
        })
        .finally(() => setLoading(false));
    }, 500);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [value]);

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Type shop name or address (e.g. Globo Green Cuddalore)"
        autoComplete="off"
      />
      {loading && (
        <Loader2 className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      )}
      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-md border bg-popover py-1 text-sm shadow-md">
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-muted"
                onMouseDown={(e) => {
                  // mousedown (not click) so it fires before the input blur closes the list
                  e.preventDefault();
                  onPick(r.fill);
                  setOpen(false);
                }}
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="line-clamp-2">{r.displayName}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && !loading && searched && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover px-3 py-2 text-xs text-muted-foreground shadow-md">
          No OpenStreetMap match. OSM doesn’t index most small businesses — try a
          street/area (e.g. “Imperial Road Cuddalore”), or use{" "}
          <span className="font-medium text-foreground">Find on Google Maps</span> to
          read the coordinates.
        </div>
      )}
    </div>
  );
}
