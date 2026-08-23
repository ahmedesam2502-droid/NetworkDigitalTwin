import { useState } from "react";

function Auth({ apiUrl, onAuthSuccess }) {
    const [mode, setMode] = useState("login");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [toast, setToast] = useState(null);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const showToast = (text, type = "success") => {
        setToast({ text, type });

        setTimeout(() => {
            setToast(null);
        }, 3000);
    };

    const switchMode = (newMode) => {
        setMode(newMode);
        setMessage(null);
    };

    const handleLoginSubmit = async (event) => {
        event.preventDefault();

        setLoading(true);
        setMessage(null);

        try {
            const response = await fetch(`${apiUrl}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: email,
                    password: password,
                }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(data?.detail || "Login failed");
            }

            localStorage.setItem("token", data.access_token);
            onAuthSuccess(data.access_token);
        } catch (err) {
            setMessage({
                type: "error",
                text: err.message || "Login failed. Check your email and password.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterSubmit = async (event) => {
        event.preventDefault();

        setLoading(true);
        setMessage(null);

        try {
            const response = await fetch(`${apiUrl}/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: email,
                    email: email,
                    password: password,
                }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(data?.detail || "Registration failed");
            }

            showToast("Account created successfully! Welcome aboard 🎉", "success");

            localStorage.setItem("token", data.access_token);

            setTimeout(() => {
                onAuthSuccess(data.access_token);
            }, 1200);
        } catch (err) {
            setMessage({
                type: "error",
                text: err.message || "Registration failed. Please try again.",
            });
            setLoading(false);
        }
    };

    return (
        <div className="net-auth-page">

            {toast && (
                <div className={`net-toast ${toast.type}`}>
                    {toast.text}
                </div>
            )}

            <svg className="net-auth-bg" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
                <line x1="120" y1="150" x2="380" y2="260" className="net-line" />
                <line x1="380" y1="260" x2="700" y2="180" className="net-line" />
                <line x1="380" y1="260" x2="320" y2="520" className="net-line" />
                <line x1="700" y1="180" x2="860" y2="380" className="net-line" />
                <line x1="320" y1="520" x2="620" y2="600" className="net-line" />
                <line x1="620" y1="600" x2="860" y2="380" className="net-line" />
                <line x1="620" y1="600" x2="500" y2="850" className="net-line" />
                <line x1="320" y1="520" x2="140" y2="720" className="net-line" />
                <line x1="140" y1="720" x2="500" y2="850" className="net-line" />
                <line x1="860" y1="380" x2="900" y2="700" className="net-line" />
                <line x1="900" y1="700" x2="500" y2="850" className="net-line" />

                {[
                    [120, 150], [380, 260], [700, 180], [860, 380],
                    [320, 520], [620, 600], [140, 720], [500, 850], [900, 700],
                ].map(([cx, cy], index) => (
                    <circle
                        key={index}
                        cx={cx}
                        cy={cy}
                        r="7"
                        className="net-node"
                        style={{ animationDelay: `${index * 0.35}s` }}
                    />
                ))}
            </svg>

            <div className="net-auth-card">

                <div className="net-auth-brand">
                    <div className="net-auth-logo">🌐</div>
                    <h1>Network Digital Twin</h1>
                    <p>Real-time network topology monitoring</p>
                </div>

                <div className="net-auth-toggle">
                    <button
                        className={mode === "login" ? "active" : ""}
                        onClick={() => switchMode("login")}
                        type="button"
                    >
                        Sign In
                    </button>

                    <button
                        className={mode === "register" ? "active" : ""}
                        onClick={() => switchMode("register")}
                        type="button"
                    >
                        Create Account
                    </button>
                </div>

                {message && (
                    <div className={`net-auth-message ${message.type}`}>
                        {message.text}
                    </div>
                )}

                {mode === "login" ? (
                    <form onSubmit={handleLoginSubmit} className="net-auth-form">
                        <label>
                            Email
                            <input
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="you@example.com"
                                required
                            />
                        </label>

                        <label>
                            Password
                            <input
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </label>

                        <button type="submit" className="net-auth-submit" disabled={loading}>
                            {loading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleRegisterSubmit} className="net-auth-form">
                        <label>
                            Email
                            <input
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="you@example.com"
                                required
                            />
                        </label>

                        <label>
                            Password
                            <input
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder="At least 8 characters"
                                required
                                minLength={8}
                            />
                        </label>

                        <button type="submit" className="net-auth-submit" disabled={loading}>
                            {loading ? "Creating account..." : "Create Account"}
                        </button>
                    </form>
                )}

            </div>

        </div>
    );
}

export default Auth;