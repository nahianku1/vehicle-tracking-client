import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";


type Driver = {
  id: string;
  lat: number;
  lng: number;
}[];

function App() {
  const [drivers, setDrivers] = useState<Driver>([]);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_SERVER_URL, {
      withCredentials: true,
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [])

  useEffect(() => {
    // Listen for location updates
    socketRef.current!.on("driver:update", (data: Driver) => {
      console.log(data);
      setDrivers(data);
    });

    // Start sending location using navigator.geolocation
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          socketRef.current!.emit("driver:location", {
            lat: latitude,
            lng: longitude,
          });
          setLat(latitude);
          setLng(longitude);
        },
        (err) => console.error("Geolocation error:", err),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 1000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      console.error("Geolocation not supported");
    }
  }, []);

  useEffect(() => {
    if (lat !== null && lng !== null && !mapRef.current) {
      mapRef.current = L.map("map").setView([lat, lng], 16);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(mapRef.current);
    }
  }, [lat, lng]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old markers
    Object.values(markersRef.current).forEach((marker) => {
      mapRef.current?.removeLayer(marker);
    });
    markersRef.current = {};

    // Add new markers
    drivers.forEach((driver) => {
      if (driver.lat && driver.lng) {
        const marker = L.marker([driver.lat, driver.lng], {
          icon: L.icon({
            iconUrl:
              "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
          }),
        }).addTo(mapRef.current!);
        markersRef.current[driver.id] = marker;
      }
    });
  }, [drivers]);

  return <div id="map" style={{ width: "100vw", height: "100vh" }} />;
}

export default App;
