import { useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [topology, setTopology] = useState(null);
  const [error, setError] = useState("");

  const [showAddDevice, setShowAddDevice] = useState(false);
  const [addingDevice, setAddingDevice] = useState(false);

  const [form, setForm] = useState({
    name: "",
    ip_address: "",
    device_type: "router",
  });

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };
  const loadTopology = () => {
    fetch(API_URL + "/topology")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Backend returned an error");
        }

        return response.json();
      })
      .then((data) => {
        setTopology(data);
        setError("");
      })
      .catch((err) => {
        setError(err.message);
      });
  };
  const handleAddDevice = async (event) => {
    event.preventDefault();

    if (!form.name || !form.ip_address) {
      alert("Enter device name and IP address.");
      return;
    }

    try {
      setAddingDevice(true);

      const url =
        API_URL +
        "/devices?name=" +
        encodeURIComponent(form.name) +
        "&ip_address=" +
        encodeURIComponent(form.ip_address) +
        "&device_type=" +
        encodeURIComponent(form.device_type);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message);
      }

      setForm({
        name: "",
        ip_address: "",
        device_type: "router",
      });

      setShowAddDevice(false);

      loadTopology();
    } catch (err) {
      alert("Failed to add device: " + err.message);
    } finally {
      setAddingDevice(false);
    }
  };



  useEffect(() => {
    loadTopology();

    const interval = setInterval(loadTopology, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const nodes = useMemo(() => {
    if (!topology) {
      return [];
    }

    return topology.devices.map((device, index) => ({
      id: String(device.id),

      position: {
        x: 100 + index * 300,
        y: 150,
      },

      data: {
        label: (
          <div className="network-node">
            <div className="node-icon">
              {device.device_type === "router" && "🌐"}
              {device.device_type === "switch" && "🔀"}
              {device.device_type === "server" && "🖥️"}
            </div>

            <strong>{device.name}</strong>

            <span>{device.device_type}</span>

            <span>{device.ip_address}</span>

            <small className={device.status}>
              {device.status}
            </small>
          </div>
        ),
      },

      style: {
        width: 220,
        borderRadius: 12,
        border:
          device.status === "online"
            ? "2px solid #22c55e"
            : "2px solid #ef4444",
        background: "#ffffff",
        padding: 10,
      },
    }));
  }, [topology]);

  const edges = useMemo(() => {
    if (!topology) {
      return [];
    }

    return topology.connections.map((connection) => ({
      id: String(connection.id),
      source: String(connection.source_device_id),
      target: String(connection.target_device_id),
      label: connection.connection_type,
      animated: connection.status === "up",

      style: {
        strokeWidth: 3,
      },
    }));
  }, [topology]);

  if (error) {
    return (
      <div className="app">
        <h1>Network Digital Twin</h1>

        <div className="error">
          <h2>Connection Error</h2>
          <p>{error}</p>

          <button onClick={loadTopology}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!topology) {
    return (
      <div className="app">
        <h1>Network Digital Twin</h1>
        <p>Loading network topology...</p>
      </div>
    );
  }

  const onlineDevices = topology.devices.filter(
    (device) => device.status === "online"
  ).length;

  const offlineDevices = topology.devices.filter(
    (device) => device.status === "offline"
  ).length;

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Network Digital Twin</h1>
          <p>Real-time network topology monitoring</p>
        </div>

        <div className="header-status">
          <span className="live-dot"></span>
          API Connected
        </div>
        <button
          className="add-device-button"
          onClick={() => setShowAddDevice(true)}
        >
          + Add Device
        </button>
      </header>

      <section className="stats">
        <div className="stat-card">
          <span>Devices</span>
          <strong>{topology.devices.length}</strong>
        </div>

        <div className="stat-card">
          <span>Connections</span>
          <strong>{topology.connections.length}</strong>
        </div>

        <div className="stat-card">
          <span>Online</span>
          <strong>{onlineDevices}</strong>
        </div>

        <div className="stat-card">
          <span>Offline</span>
          <strong>{offlineDevices}</strong>
        </div>
      </section>

      <section className="topology-container">
        <div className="section-header">
          <h2>Network Topology</h2>

          <span>
            {topology.devices.length} devices -{" "}
            {topology.connections.length} connections
          </span>
        </div>

        <div className="flow-container">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
      </section>

      <section className="connections">
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
              <strong>
                {source ? source.name : "Unknown"}
              </strong>

              <span>→</span>

              <strong>
                {target ? target.name : "Unknown"}
              </strong>

              <small>
                {connection.connection_type} -{" "}
                {connection.status}
              </small>
            </div>
          );
        })}
      </section>
      {showAddDevice && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add Device</h2>

              <button
                className="close-button"
                onClick={() => setShowAddDevice(false)}
              >
                X
              </button>
            </div>

            <form onSubmit={handleAddDevice}>
              <label>
                Device Name

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  placeholder="Router-02"
                />
              </label>

              <label>
                IP Address

                <input
                  type="text"
                  name="ip_address"
                  value={form.ip_address}
                  onChange={handleInputChange}
                  placeholder="192.168.1.20"
                />
              </label>

              <label>
                Device Type

                <select
                  name="device_type"
                  value={form.device_type}
                  onChange={handleInputChange}
                >
                  <option value="router">Router</option>
                  <option value="switch">Switch</option>
                  <option value="server">Server</option>
                </select>
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowAddDevice(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-button"
                  disabled={addingDevice}
                >
                  {addingDevice ? "Adding..." : "Add Device"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;