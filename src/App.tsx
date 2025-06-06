import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Map, Marker } from "react-map-gl/maplibre";

const socket = io(import.meta.env.VITE_SERVER_URL);

function App() {
  const [drivers, setDrivers] = useState({});
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const driverId = crypto.randomUUID().split("-")[0];

  useEffect(() => {
    // Listen for location updates
    socket.on("driver:update", (data) => {
      console.log(data);
      setDrivers((prev) => ({ ...prev, [data.driverId]: data }));
    });

    // Start sending location using navigator.geolocation
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          socket.emit("driver:location", {
            driverId,
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

  return (
    <Map
      mapLib={maplibregl}
      initialViewState={{
        longitude: lat as number,
        latitude: lng as number,
      }}
      style={{ width: "100vw", height: "100vh" }}
      mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
    >
      {Object.values(drivers).map((driver) => (
        <Marker
          key={driver?.driverId}
          longitude={driver?.lng}
          latitude={driver?.lat}
          color="red"
        />
      ))}
    </Map>
  );
}

export default App;
