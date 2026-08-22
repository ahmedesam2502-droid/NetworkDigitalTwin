import { useState } from "react";

function Auth({ apiUrl, onAuthSuccess }) {
    const [mode, setMode] = useState("login"); // "login" or "register"
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const [loginForm, setLoginForm] = useState({
        username: "",
        password: "",
    });

    const [registerForm, setRegisterForm] = useState({
        username: "",
        email: "",
        password: "",
    });

    const handleLoginChange = (event) => {
        const { name, value } = event.target;

        setLoginForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleRegisterChange = (event) => {
        const { name, value } = event.target;

        setRegisterForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleLoginSubmit = async (event) => {
        event.preventDefault();

        setLoading(true);
        setErrorMessage("");

        try {
            const response = await fetch(`${apiUrl}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(loginForm),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(data?.detail || "Login failed");
            }

            localStorage.setItem("token", data.access_token);
            onAuthSuccess(data.access_token);
        } catch (err) {
            setErrorMessage(err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterSubmit = async (event) => {
        event.preventDefault();

        setLoading(true);
        setErrorMessage("");

        try {
            const response = await fetch(`${apiUrl}/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(registerForm),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(data?.detail || "Registration failed");
            }

            localStorage.setItem("token", data.access_token);
            onAuthSuccess(data.access_token);
        } catch (err) {
            setErrorMessage(err.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">

            <div className="auth-box">

                <h1>Network Digital Twin</h1>

                <div className="auth-tabs">
                    <button
                        className={mode === "login" ? "active" : ""}
                        onClick={() => {
                            setMode("login");
                            setErrorMessage("");
                        }}
                    >
                        Login
                    </button>

                    <button
                        className={mode === "register" ? "active" : ""}
                        onClick={() => {
                            setMode("register");
                            setErrorMessage("");
                        }}
                    >
                        Register
                    </button>
                </div>

                {errorMessage && (
                    <p className="auth-error">
                        {errorMessage}
                    </p>
                )}

                {mode === "login" ? (
                    <form onSubmit={handleLoginSubmit}>

                        <label>
                            Username

                            <input
                                type="text"
                                name="username"
                                value={loginForm.username}
                                onChange={handleLoginChange}
                                required
                            />
                        </label>

                        <label>
                            Password

                            <input
                                type="password"
                                name="password"
                                value={loginForm.password}
                                onChange={handleLoginChange}
                                required
                            />
                        </label>

                        <button type="submit" disabled={loading}>
                            {loading ? "Logging in..." : "Login"}
                        </button>

                    </form>
                ) : (
                    <form onSubmit={handleRegisterSubmit}>

                        <label>
                            Username

                            <input
                                type="text"
                                name="username"
                                value={registerForm.username}
                                onChange={handleRegisterChange}
                                required
                            />
                        </label>

                        <label>
                            Email

                            <input
                                type="email"
                                name="email"
                                value={registerForm.email}
                                onChange={handleRegisterChange}
                                required
                            />
                        </label>

                        <label>
                            Password

                            <input
                                type="password"
                                name="password"
                                value={registerForm.password}
                                onChange={handleRegisterChange}
                                required
                                minLength={8}
                            />
                        </label>

                        <button type="submit" disabled={loading}>
                            {loading ? "Creating account..." : "Register"}
                        </button>

                    </form>
                )}

            </div>

        </div>
    );
}

export default Auth;