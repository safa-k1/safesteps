"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from "react-leaflet";
import { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

type MarkerType = {
  lat: number;
  lng: number;
  category: "dark_area" | "dangerous_traffic" | "harassment";
};

function Heatmap({ markers }: { markers: MarkerType[] }) {

  const map = useMap();

  useEffect(() => {

    if (!markers.length) return;

    const heatPoints = markers.map((m) => {

      let weight = 0.3;

      if (m.category === "dangerous_traffic") weight = 0.6;
      if (m.category === "harassment") weight = 1;

      return [m.lat, m.lng, weight];

    });

    const heat = (L as any).heatLayer(heatPoints, {
      radius: 30,
      blur: 25,
    });

    heat.addTo(map);

    return () => {
      map.removeLayer(heat);
    };

  }, [markers, map]);

  return null;

}

export default function MapInner() {

  const [markers, setMarkers] = useState<MarkerType[]>([]);
  const [start, setStart] = useState("");
  const [dest, setDest] = useState("");

  const [safeRoute, setSafeRoute] = useState<[number, number][]>([]);
  const [normalRoute, setNormalRoute] = useState<[number, number][]>([]);

  const ORS_KEY =
    "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImZkYzA5M2E2NzViMDQxOTc5OWZhZTc0MTI2ZTZhNDQ0IiwiaCI6Im11cm11cjY0In0=";

  function MapClickHandler() {

    useMapEvents({
      click(e: any) {

        setMarkers((prev) => [
          ...prev,
          {
            lat: e.latlng.lat,
            lng: e.latlng.lng,
            category: "dark_area",
          },
        ]);

      },
    });

    return null;
  }

  function markerIcon(category: string) {

    let color = "black";

    if (category === "dangerous_traffic") color = "orange";
    if (category === "harassment") color = "red";

    return L.divIcon({
      className: "",
      html: `<div style="
        width:18px;
        height:18px;
        border-radius:50%;
        border:2px solid white;
        background:${color};
      "></div>`,
    });

  }

  async function geocode(address: string) {

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address + " Toronto Canada")}&format=json`,
      { headers: { "User-Agent": "SafeSteps-App" } }
    );

    const data = await res.json();

    if (!data.length) throw new Error("Address not found");

    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];

  }

  async function calculateRoutes(startC: any, destC: any) {

    const avoidPolygons = markers.map((m) => {

      const buffer = 0.0005;

      return [[
        [m.lng - buffer, m.lat - buffer],
        [m.lng + buffer, m.lat - buffer],
        [m.lng + buffer, m.lat + buffer],
        [m.lng - buffer, m.lat + buffer],
        [m.lng - buffer, m.lat - buffer],
      ]];

    });

    const res = await fetch(
      "https://api.openrouteservice.org/v2/directions/foot-walking/geojson",
      {
        method: "POST",
        headers: {
          Authorization: ORS_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coordinates: [
            [startC[1], startC[0]],
            [destC[1], destC[0]],
          ],
          alternative_routes: {
            target_count: 2,
            share_factor: 0.6,
          },
          options: {
            avoid_polygons: {
              type: "MultiPolygon",
              coordinates: avoidPolygons,
            },
          },
        }),
      }
    );

    const data = await res.json();

    const routes = data.features.map((r: any) =>
      r.geometry.coordinates.map(([lng, lat]: any) => [lat, lng])
    );

    setSafeRoute(routes[0]);
    setNormalRoute(routes[1]);

  }

  async function findRoute() {

    try {

      const startCoords: any = await geocode(start);
      const destCoords: any = await geocode(dest);

      await calculateRoutes(startCoords, destCoords);

    }

    catch {

      alert("Error calculating route");

    }

  }

  return (

    <div style={{ position: "relative" }}>

      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 1000,
          background: "white",
          padding: "15px",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          width: "300px"
        }}
      >

        <input
          placeholder="Start location"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            marginBottom: "8px",
            borderRadius: "6px",
            border: "1px solid #ccc"
          }}
        />

        <input
          placeholder="Destination"
          value={dest}
          onChange={(e) => setDest(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            marginBottom: "10px",
            borderRadius: "6px",
            border: "1px solid #ccc"
          }}
        />

        <button
          onClick={findRoute}
          style={{
            width: "100%",
            padding: "10px",
            background: "#2ecc71",
            border: "none",
            color: "white",
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          Find Safest Route
        </button>

      </div>

      <MapContainer
        center={[43.6532, -79.3832]}
        zoom={13}
        style={{ height: "100vh", width: "100%" }}
      >

        <TileLayer
          attribution="OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Heatmap markers={markers} />

        <MapClickHandler />

        {markers.map((m, i) => (

          <Marker
            key={i}
            position={[m.lat, m.lng]}
            icon={markerIcon(m.category)}
          >

            <Popup>

              <b>Report Safety Issue</b>

              <br /><br />

              <select
                value={m.category}
                onChange={(e) => {

                  const newCat = e.target.value as MarkerType["category"];

                  setMarkers((prev) =>
                    prev.map((mark, index) =>
                      index === i ? { ...mark, category: newCat } : mark
                    )
                  );

                }}
              >

                <option value="dark_area">Dark Area</option>
                <option value="dangerous_traffic">Dangerous Traffic</option>
                <option value="harassment">Harassment</option>

              </select>

            </Popup>

          </Marker>

        ))}

        {normalRoute.length > 0 && (
          <Polyline positions={normalRoute} color="yellow" weight={4} />
        )}

        {safeRoute.length > 0 && (
          <Polyline positions={safeRoute} color="green" weight={6} />
        )}

      </MapContainer>

    </div>

  );
}