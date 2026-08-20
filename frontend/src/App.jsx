import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [topology, setTopology] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/topology")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Backend returned an error");
        }

        return response.json();
      })
      .then((data) => {
        setTopology(data);
      })
      .catch((err) => {
        setError(err.message);
      });
  }, []);

  if (error) {
    return (
      <div className="app">
        <h1>Network Digital Twin</h1>
        <h2>Connection Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!topology) {
    return (
      <div className="app">
        <h1>Network Digital Twin</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <h1>Network Digital Twin</h1>

      <p>
        Devices: {topology.devices.length}
      </p>

      <p>
        Connections: {topology.connections.length}
      </p>

      <hr />

      <h2>Devices</h2>

      {topology.devices.map((device) => (
        <div className="device" key={device.id}>
          <h3>{device.name}</h3>

          <p>
            Type: {device.device_type}
          </p>

          <p>
            IP: {device.ip_address}
          </p>

          <p>
            Status: {device.status}
          </p>
        </div>
      ))}

      <h2>Connections</h2>

      {topology.connections.map((connection) => {
        const source = topology.devices.find(
          (device) =>
            device.id === connection.source_device_id
        );

        const target = topology.devices.find(
          (device) =>
            device.id === connection.target_device_id
        );

        return (
          <div
            className="connection"
            key={connection.id}
          >
            {source?.name} → {target?.name}

            <span>
              {" "}
              ({connection.connection_type})
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default App;