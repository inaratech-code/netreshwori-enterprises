"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { OFFICE_LOCATIONS } from "@/data/officeLocations";

// Red pin icon for exact locations
function createRedIcon() {
    return L.divIcon({
        className: "custom-red-pin border-0 bg-transparent",
        html: `<div style="
          width: 28px;
          height: 28px;
          background: #dc2626;
          border: 3px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        "></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
    });
}

function FitBounds() {
    const map = useMap();
    const done = useRef(false);
    const mounted = useRef(true);
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);
    useEffect(() => {
        if (done.current || OFFICE_LOCATIONS.length < 2) return;
        done.current = true;
        const bounds = L.latLngBounds(
            OFFICE_LOCATIONS.map((o) => [o.lat, o.lng] as [number, number])
        );
        const id = setTimeout(() => {
            if (!mounted.current) return;
            try {
                if (map.getContainer()?.parentElement == null) return;
                map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
            } catch {
                // map may be destroyed
            }
        }, 150);
        return () => clearTimeout(id);
    }, [map]);
    return null;
}

export default function OfficeMap() {
    const mapKey = useId();
    const redIcon = createRedIcon();
    const [ready, setReady] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setReady(true), 100);
        return () => clearTimeout(t);
    }, []);

    if (!ready) {
        return (
            <div className="w-full min-h-[280px] md:min-h-[340px] rounded-2xl bg-slate-200 animate-pulse flex items-center justify-center text-slate-500 text-sm">
                Loading map…
            </div>
        );
    }

    return (
        <div className="w-full h-full min-h-[280px] md:min-h-[340px] rounded-2xl overflow-hidden [&_.leaflet-container]:rounded-2xl [&_.leaflet-container]:z-0" style={{ minHeight: 280 }}>
            <MapContainer
                key={mapKey}
                center={[28.705, 80.6005]}
                zoom={13}
                scrollWheelZoom
                className="w-full h-full min-h-[280px] md:min-h-[340px]"
                style={{ height: "100%", minHeight: 280, background: "#e2e8f0" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FitBounds />
                {OFFICE_LOCATIONS.map((office) => (
                    <Marker
                        key={office.name}
                        position={[office.lat, office.lng]}
                        icon={redIcon}
                    >
                        <Popup>
                            <div className="text-center min-w-[140px]">
                                <p className="font-semibold text-slate-900">{office.name}</p>
                                <a
                                    href={office.mapsUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary text-sm font-medium hover:underline mt-1 inline-block"
                                >
                                    Open in Google Maps &rarr;
                                </a>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
