import { useEffect, useMemo, useState } from "react";
import Auth from "./Auth";

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem("token")
  );

  const [topology, setTopology] = useState(null);
  const [error, setError] = useState("");

  const [showAddDevice, setShowAddDevice] = useState(false);
  const [addingDevice, setAddingDevice] = useState(false);

  const [showEditDevice, setShowEditDevice] = useState(false);
  const [editingDevice, setEditingDevice] = useState(false);
  const [editDeviceId, setEditDeviceId] = useState(null);

  const [editForm, setEditForm] = useState({
    name: "",
    ip_address: "",
    device_type: "router",
  });

  const [stats, setStats] = useState({
    total_devices: 0,
    online_devices: 0,
    offline_devices: 0,
    total_connections: 0,
    active_connections: 0,
    down_connections: 0,
  });

  const [form, setForm] = useState({
    name: "",
    ip_address: "",
    device_type: "router",
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const loadTopology = async () => {
    try {
      const response = await fetch(`${API_URL}/topology`);

      if (!response.ok) {
        throw new Error("Backend returned an error");
      }

      const data = await response.json();

      setTopology(data);
      setError("");
    } catch (err) {
      console.error("Topology error:", err);
      setError("Unable to connect to the backend.");
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(
        `${API_URL}/dashboard/stats`
      );

      if (!response.ok) {
        throw new Error("Failed to load dashboard stats");
      }

      const data = await response.json();

      setStats(data);
    } catch (err) {
      console.error("Stats error:", err);
    }
  };

  const checkDevice = async (deviceId) => {
    try {
      const response = await fetch(
        API_URL + "/devices/" + deviceId + "/check",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.detail || "Failed to check device"
        );
      }
      await response.json();

      await loadTopology();
      await loadStats();
    } catch (err) {
      console.error("Check device error:", err);
      alert(err.message || "Failed to check device.");
    }
  };

  const simulateDevice = async (deviceId, status) => {
    try {
      const response = await fetch(
        API_URL + "/devices/" + deviceId + "/simulate?status=" + status,
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.detail || "Failed to simulate device"
        );
      }

      await response.json();

      await loadTopology();
      await loadStats();
    } catch (err) {
      console.error("Simulation error:", err);
      alert(err.message || "Failed to change device status.");
    }
  };

  const deleteDevice = async (deviceId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this device? Any connections linked to it will be deleted too."
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/devices/${deviceId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.detail || "Failed to delete device"
        );
      }

      await loadTopology();
      await loadStats();
    } catch (err) {
      console.error("Delete device error:", err);
      alert(err.message || "Failed to delete device.");
    }
  };

  const handleEditInputChange = (event) => {
    const { name, value } = event.target;

    setEditForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openEditDevice = (device) => {
    setEditDeviceId(device.id);

    setEditForm({
      name: device.name,
      ip_address: device.ip_address,
      device_type: device.device_type,
    });

    setShowEditDevice(true);
  };

  const handleEditDevice = async (event) => {
    event.preventDefault();

    setEditingDevice(true);

    try {
      const currentDevice = topology.devices.find(
        (device) => device.id === editDeviceId
      );

      const params = new URLSearchParams({
        name: editForm.name,
        ip_address: editForm.ip_address,
        device_type: editForm.device_type,
        status: currentDevice ? currentDevice.status : "offline",
      });

      const response = await fetch(
        `${API_URL}/devices/${editDeviceId}?${params.toString()}`,
        {
          method: "PUT",
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.detail || "Failed to update device"
        );
      }

      setShowEditDevice(false);
      setEditDeviceId(null);

      await loadTopology();
      await loadStats();
    } catch (err) {
      console.error("Edit device error:", err);
      alert(err.message || "Failed to update device.");
    } finally {
      setEditingDevice(false);
    }
  };

  const [showAddConnection, setShowAddConnection] = useState(false);
  const [addingConnection, setAddingConnection] = useState(false);

  const [connectionForm, setConnectionForm] = useState({
    source_device_id: "",
    target_device_id: "",
    connection_type: "ethernet",
  });

  const handleConnectionInputChange = (event) => {
    const { name, value } = event.target;

    setConnectionForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleAddConnection = async (event) => {
    event.preventDefault();

    setAddingConnection(true);

    try {
      const params = new URLSearchParams({
        source_device_id: connectionForm.source_device_id,
        target_device_id: connectionForm.target_device_id,
        connection_type: connectionForm.connection_type,
      });

      const response = await fetch(
        `${API_URL}/connections?${params.toString()}`,
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.detail || "Failed to add connection"
        );
      }

      setConnectionForm({
        source_device_id: "",
        target_device_id: "",
        connection_type: "ethernet",
      });

      setShowAddConnection(false);

      await loadTopology();
      await loadStats();
    } catch (err) {
      console.error("Add connection error:", err);
      alert(err.message || "Failed to add connection.");
    } finally {
      setAddingConnection(false);
    }
  };

  const deleteConnection = async (connectionId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this connection?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/connections/${connectionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.detail || "Failed to delete connection"
        );
      }
      await loadTopology();
      await loadStats();
    } catch (err) {
      console.error("Delete connection error:", err);
      alert(err.message || "Failed to delete connection.");
    }
  };

  const handleAddDevice = async (event) => {
    event.preventDefault();

    setAddingDevice(true);

    try {
      const params = new URLSearchParams({
        name: form.name,
        ip_address: form.ip_address,
        device_type: form.device_type,
      });

      const response = await fetch(
        `${API_URL}/devices?${params.toString()}`,
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.detail || "Failed to add device"
        );
      }

      setForm({
        name: "",
        ip_address: "",
        device_type: "router",
      });

      setShowAddDevice(false);

      await loadTopology();
      await loadStats();
    } catch (err) {
      console.error("Add device error:", err);
      alert(err.message || "Failed to add device.");
    } finally {
      setAddingDevice(false);
    }
  };

  useEffect(() => {
    loadTopology();
    loadStats();

    const interval = setInterval(() => {
      loadTopology();
      loadStats();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const structureKey = useMemo(() => {
    if (!topology) {
      return "";
    }

    const deviceIds = topology.devices
      .map((device) => device.id)
      .sort((a, b) => a - b)
      .join(",");

    const connectionKeys = topology.connections
      .map((connection) => `${connection.source_device_id}-${connection.target_device_id}`)
      .sort()
      .join(",");

    return deviceIds + "|" + connectionKeys;
  }, [topology]);

  const reachableIds = useMemo(() => {
    if (!topology) {
      return new Set();
    }

    const adjacency = new Map();

    topology.devices.forEach((device) => {
      adjacency.set(device.id, []);
    });

    topology.connections.forEach((connection) => {
      if (connection.status !== "up") {
        return;
      }

      if (adjacency.has(connection.source_device_id)) {
        adjacency
          .get(connection.source_device_id)
          .push(connection.target_device_id);
      }

      if (adjacency.has(connection.target_device_id)) {
        adjacency
          .get(connection.target_device_id)
          .push(connection.source_device_id);
      }
    });

    const onlineIds = new Set(
      topology.devices
        .filter((device) => device.status === "online")
        .map((device) => device.id)
    );

    const hasRouter = topology.devices.some(
      (device) => device.device_type === "router"
    );

    if (!hasRouter) {
      return onlineIds;
    }

    const onlineRoutersIds = topology.devices
      .filter(
        (device) =>
          device.device_type === "router" &&
          device.status === "online"
      )
      .map((device) => device.id);

    const visited = new Set();
    const queue = [...onlineRoutersIds];

    onlineRoutersIds.forEach((id) => visited.add(id));

    while (queue.length > 0) {
      const currentId = queue.shift();

      (adjacency.get(currentId) || []).forEach((neighborId) => {
        if (visited.has(neighborId)) {
          return;
        }

        if (!onlineIds.has(neighborId)) {
          return;
        }

        visited.add(neighborId);
        queue.push(neighborId);
      });
    }

    return visited;
  }, [topology]);

  const positionById = useMemo(() => {
    if (!topology) {
      return new Map();
    }

    const adjacency = new Map();

    topology.devices.forEach((device) => {
      adjacency.set(device.id, []);
    });

    topology.connections.forEach((connection) => {
      if (adjacency.has(connection.source_device_id)) {
        adjacency
          .get(connection.source_device_id)
          .push(connection.target_device_id);
      }

      if (adjacency.has(connection.target_device_id)) {
        adjacency
          .get(connection.target_device_id)
          .push(connection.source_device_id);
      }
    });

    const targetIds = new Set(
      topology.connections.map(
        (connection) => connection.target_device_id
      )
    );

    const roots = topology.devices.filter(
      (device) =>
        device.device_type === "router" ||
        !targetIds.has(device.id)
    );

    const rootIds =
      roots.length > 0
        ? roots.map((device) => device.id)
        : topology.devices.slice(0, 1).map((device) => device.id);

    const levelOf = new Map();
    const queue = [];

    rootIds.forEach((id) => {
      levelOf.set(id, 0);
      queue.push(id);
    });

    while (queue.length > 0) {
      const currentId = queue.shift();
      const currentLevel = levelOf.get(currentId);

      (adjacency.get(currentId) || []).forEach((neighborId) => {
        if (!levelOf.has(neighborId)) {
          levelOf.set(neighborId, currentLevel + 1);
          queue.push(neighborId);
        }
      });
    }

    let maxLevel = 0;

    levelOf.forEach((level) => {
      if (level > maxLevel) {
        maxLevel = level;
      }
    });

    topology.devices.forEach((device) => {
      if (!levelOf.has(device.id)) {
        maxLevel += 1;
        levelOf.set(device.id, maxLevel);
      }
    });

    const devicesByLevel = new Map();

    topology.devices.forEach((device) => {
      const level = levelOf.get(device.id);

      if (!devicesByLevel.has(level)) {
        devicesByLevel.set(level, []);
      }

      devicesByLevel.get(level).push(device);
    });

    const LEVEL_HEIGHT = 340;
    const NODE_WIDTH = 300;

    const result = new Map();

    Array.from(devicesByLevel.keys())
      .sort((a, b) => a - b)
      .forEach((level) => {
        const devicesInLevel = devicesByLevel.get(level);
        const rowWidth = devicesInLevel.length * NODE_WIDTH;
        const startX = 500 - rowWidth / 2;

        devicesInLevel.forEach((device, index) => {
          result.set(device.id, {
            x: startX + index * NODE_WIDTH,
            y: level * LEVEL_HEIGHT + 50,
          });
        });
      });

    return result;
  }, [structureKey]);

  const nodes = useMemo(() => {
    if (!topology) {
      return [];
    }

    const hasRouterInTopology = topology.devices.some(
      (d) => d.device_type === "router"
    );

    return topology.devices.map((device) => {
      const position = positionById.get(device.id) || {
        x: 100,
        y: 100,
      };

      const isUnreachable =
        device.status === "online" &&
        hasRouterInTopology &&
        !reachableIds.has(device.id);

      let icon = "💻";

      if (device.device_type === "router") {
        icon = "🌐";
      } else if (device.device_type === "switch") {
        icon = "🔀";
      } else if (device.device_type === "server") {
        icon = "🗄️";
      }

      return {
        id: String(device.id),

        position,

        data: {
          label: (
            <div className="device-node">
              <div className="node-icon">
                {icon}
              </div>

              <strong>{device.name}</strong>

              <div className="node-buttons">
                <button
                  className="edit-device-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    openEditDevice(device);
                  }}
                >
                  Edit
                </button>

                <button
                  className="check-device-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    checkDevice(device.id);
                  }}
                >
                  Check
                </button>

                <button
                  className="simulate-online-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    simulateDevice(device.id, "online");
                  }}
                >
                  Set Online
                </button>

                <button
                  className="simulate-offline-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    simulateDevice(device.id, "offline");
                  }}
                >
                  Set Offline
                </button>

                <button
                  className="delete-device-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteDevice(device.id);
                  }}
                >
                  Delete
                </button>
              </div>

              <span>{device.ip_address}</span>

              <span
                className={
                  "device-status " +
                  (isUnreachable ? "unreachable" : device.status)
                }
              >
                {isUnreachable ? "unreachable" : device.status}
              </span>
            </div>
          ),
        },

        style: {
          minWidth: "180px",
          padding: "0",
          borderRadius: "14px",
          border: isUnreachable
            ? "2px dashed #94a3b8"
            : device.status === "online"
              ? "2px solid #22c55e"
              : "2px solid #ef4444",

          background: isUnreachable
            ? "#1e293b"
            : device.status === "online"
              ? "#0f2418"
              : "#2a1515",

          color: "#ffffff",

          boxShadow: isUnreachable
            ? "0 0 15px rgba(148,163,184,0.15)"
            : device.status === "online"
              ? "0 0 20px rgba(34,197,94,0.15)"
              : "0 0 20px rgba(239,68,68,0.12)",
        },
      };
    });
  }, [topology, positionById, reachableIds]);

  const edges = useMemo(() => {
    if (!topology) {
      return [];
    }

    return topology.connections.map((connection) => ({
      id: String(connection.id),

      source: String(
        connection.source_device_id
      ),

      target: String(
        connection.target_device_id
      ),

      label: connection.connection_type,

      animated:
        connection.status === "up",

      markerEnd: {
        type: "arrowclosed",
        color:
          connection.status === "up"
            ? "#38bdf8"
            : "#ef4444",
      },

      style: {
        stroke:
          connection.status === "up"
            ? "#38bdf8"
            : "#ef4444",

        strokeWidth: 3,
      },
    }));
  }, [topology]);

  if (!token) {
    return (
      <Auth
        apiUrl={API_URL}
        onAuthSuccess={(newToken) => setToken(newToken)}
      />
    );
  }

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

        <p>
          Loading network topology...
        </p>
      </div>
    );
  }

  return (
    <div className="app">

      <header className="header">

        <div>
          <h1>
            Network Digital Twin
          </h1>

          <p>
            Real-time network topology monitoring
          </p>
        </div>

        <div className="header-status">
          <span className="live-dot"></span>
          API Connected
        </div>

        <button
          className="add-device-button"
          onClick={() =>
            setShowAddDevice(true)
          }
        >
          + Add Device
        </button>

        <button
          className="add-connection-button"
          onClick={() =>
            setShowAddConnection(true)
          }
        >
          + Add Connection
        </button>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>

      </header>

      <section className="stats">

        <div className="stat-card">
          <span>Devices</span>
          <strong>
            {stats.total_devices}
          </strong>
        </div>

        <div className="stat-card">
          <span>Connections</span>
          <strong>
            {stats.total_connections}
          </strong>
        </div>

        <div className="stat-card">
          <span>Online</span>
          <strong>
            {stats.online_devices}
          </strong>
        </div>

        <div className="stat-card">
          <span>Offline</span>
          <strong>
            {stats.offline_devices}
          </strong>
        </div>

        <div className="stat-card">
          <span>Active Connections</span>
          <strong>
            {stats.active_connections}
          </strong>
        </div>

        <div className="stat-card">
          <span>Down Connections</span>
          <strong>
            {stats.down_connections}
          </strong>
        </div>

      </section>

      <section className="topology-container">

        <div className="section-header">

          <h2>
            Network Topology
          </h2>

          <span>
            {topology.devices.length} devices
            {" - "}
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

        <h2>
          Connections
        </h2>
        {topology.connections.length === 0 ? (
          <p>
            No connections found.
          </p>
        ) : (
          topology.connections.map(
            (connection) => {
              const source =
                topology.devices.find(
                  (device) =>
                    device.id ===
                    connection.source_device_id
                );

              const target =
                topology.devices.find(
                  (device) =>
                    device.id ===
                    connection.target_device_id
                );

              return (
                <div
                  className="connection"
                  key={connection.id}
                >
                  <strong>
                    {source
                      ? source.name
                      : "Unknown"}
                  </strong>

                  <span>
                    →
                  </span>

                  <strong>
                    {target
                      ? target.name
                      : "Unknown"}
                  </strong>

                  <small>
                    {connection.connection_type}
                    {" - "}
                    {connection.status}
                  </small>

                  <button
                    className="delete-connection-button"
                    onClick={() =>
                      deleteConnection(connection.id)
                    }
                  >
                    Delete
                  </button>
                </div>
              );
            }
          )
        )}

      </section>
      {showAddDevice && (
        <div className="modal-overlay">

          <div className="modal">

            <div className="modal-header">

              <h2>
                Add Device
              </h2>

              <button
                className="close-button"
                onClick={() =>
                  setShowAddDevice(false)
                }
              >
                X
              </button>

            </div>

            <form
              onSubmit={handleAddDevice}
            >

              <label>
                Device Name

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={
                    handleInputChange
                  }
                  placeholder="Router-02"
                  required
                />
              </label>

              <label>
                IP Address

                <input
                  type="text"
                  name="ip_address"
                  value={form.ip_address}
                  onChange={
                    handleInputChange
                  }
                  placeholder="192.168.1.20"
                  required
                />
              </label>

              <label>
                Device Type

                <select
                  name="device_type"
                  value={form.device_type}
                  onChange={
                    handleInputChange
                  }
                >
                  <option value="router">
                    Router
                  </option>

                  <option value="switch">
                    Switch
                  </option>

                  <option value="server">
                    Server
                  </option>
                </select>
              </label>

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={() =>
                    setShowAddDevice(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-button"
                  disabled={addingDevice}
                >
                  {addingDevice
                    ? "Adding..."
                    : "Add Device"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}
      {showEditDevice && (
        <div className="modal-overlay">

          <div className="modal">

            <div className="modal-header">

              <h2>
                Edit Device
              </h2>

              <button
                className="close-button"
                onClick={() =>
                  setShowEditDevice(false)
                }
              >
                X
              </button>

            </div>

            <form
              onSubmit={handleEditDevice}
            >

              <label>
                Device Name

                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={
                    handleEditInputChange
                  }
                  required
                />
              </label>

              <label>
                IP Address

                <input
                  type="text"
                  name="ip_address"
                  value={editForm.ip_address}
                  onChange={
                    handleEditInputChange
                  }
                  required
                />
              </label>

              <label>
                Device Type

                <select
                  name="device_type"
                  value={editForm.device_type}
                  onChange={
                    handleEditInputChange
                  }
                >
                  <option value="router">
                    Router
                  </option>

                  <option value="switch">
                    Switch
                  </option>

                  <option value="server">
                    Server
                  </option>
                </select>
              </label>

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={() =>
                    setShowEditDevice(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-button"
                  disabled={editingDevice}
                >
                  {editingDevice
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}
      {showAddConnection && (
        <div className="modal-overlay">

          <div className="modal">

            <div className="modal-header">

              <h2>
                Add Connection
              </h2>

              <button
                className="close-button"
                onClick={() =>
                  setShowAddConnection(false)
                }
              >
                X
              </button>

            </div>

            <form
              onSubmit={handleAddConnection}
            >

              <label>
                Source Device

                <select
                  name="source_device_id"
                  value={connectionForm.source_device_id}
                  onChange={
                    handleConnectionInputChange
                  }
                  required
                >
                  <option value="">
                    Select a device
                  </option>

                  {topology.devices.map((device) => (
                    <option
                      key={device.id}
                      value={device.id}
                    >
                      {device.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Target Device

                <select
                  name="target_device_id"
                  value={connectionForm.target_device_id}
                  onChange={
                    handleConnectionInputChange
                  }
                  required
                >
                  <option value="">
                    Select a device
                  </option>

                  {topology.devices.map((device) => (
                    <option
                      key={device.id}
                      value={device.id}
                    >
                      {device.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Connection Type

                <select
                  name="connection_type"
                  value={connectionForm.connection_type}
                  onChange={
                    handleConnectionInputChange
                  }
                >
                  <option value="ethernet">
                    Ethernet
                  </option>

                  <option value="fiber">
                    Fiber
                  </option>

                  <option value="wireless">
                    Wireless
                  </option>
                </select>
              </label>

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={() =>
                    setShowAddConnection(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-button"
                  disabled={addingConnection}
                >
                  {addingConnection
                    ? "Adding..."
                    : "Add Connection"}
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