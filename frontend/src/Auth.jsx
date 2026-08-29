import { useState } from "react";

function Auth({ apiUrl, onAuthSuccess }) {
    const [mode, setMode] = useState("login"); // "login" | "register" | "verify"
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [toast, setToast] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);

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

    const passwordChecks = {
        length: password.length >= 8,
        letter: /[A-Za-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password),
    };

    const passwordScore = Object.values(passwordChecks).filter(Boolean).length;

    const passwordStrengthLabel = () => {
        if (password.length === 0) return "";
        if (passwordScore <= 1) return "Weak";
        if (passwordScore <= 3) return "Medium";
        return "Strong";
    };

    const passwordStrengthColor = () => {
        if (passwordScore <= 1) return "#ef4444";
        if (passwordScore <= 3) return "#f59e0b";
        return "#22c55e";
    };

    const validatePasswordStrength = (value) => {
        if (value.length < 8) {
            return "Password must be at least 8 characters long";
        }
        if (!/[A-Za-z]/.test(value)) {
            return "Password must contain at least one letter";
        }
        if (!/[0-9]/.test(value)) {
            return "Password must contain at least one number";
        }
        if (!/[^A-Za-z0-9]/.test(value)) {
            return "Password must contain at least one special character (e.g. ! @ # $ %)";
        }
        return null;
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

        const passwordError = validatePasswordStrength(password);

        if (passwordError) {
            setMessage({ type: "error", text: passwordError });
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: email,
                    email: email,
                    full_name: fullName,
                    password: password,
                }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(data?.detail || "Registration failed");
            }

            showToast("Verification code sent to your email 📧", "success");
            setMode("verify");
        } catch (err) {
            setMessage({
                type: "error",
                text: err.message || "Registration failed. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifySubmit = async (event) => {
        event.preventDefault();

        setLoading(true);
        setMessage(null);

        try {
            const response = await fetch(`${apiUrl}/verify-email`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: email,
                    code: code,
                }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(data?.detail || "Verification failed");
            }

            showToast("Account verified! Welcome aboard 🎉", "success");

            localStorage.setItem("token", data.access_token);

            setTimeout(() => {
                onAuthSuccess(data.access_token);
            }, 900);
        } catch (err) {
            setMessage({
                type: "error",
                text: err.message || "Invalid or expired code.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        setLoading(true);
        setMessage(null);

        try {
            const response = await fetch(`${apiUrl}/resend-verification-code`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email: email }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(data?.detail || "Failed to resend code");
            }

            showToast("A new code has been sent 📧", "success");
        } catch (err) {
            setMessage({
                type: "error",
                text: err.message || "Failed to resend code.",
            });
        } finally {
            setLoading(false);
        }
    };
    const handleForgotPasswordSubmit = async (event) => {
        event.preventDefault();

        setLoading(true);
        setMessage(null);

        try {
            const response = await fetch(`${apiUrl}/forgot-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email: email }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(data?.detail || "Failed to send reset code");
            }

            showToast("If this email exists, a reset code was sent 📧", "success");
            setMode("reset");
        } catch (err) {
            setMessage({
                type: "error",
                text: err.message || "Failed to send reset code.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleResetPasswordSubmit = async (event) => {
        event.preventDefault();

        setLoading(true);
        setMessage(null);

        const passwordError = validatePasswordStrength(newPassword);

        if (passwordError) {
            setMessage({ type: "error", text: passwordError });
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/reset-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: email,
                    code: code,
                    new_password: newPassword,
                }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(data?.detail || "Failed to reset password");
            }

            showToast("Password reset successful! Signing you in...", "success");

            localStorage.setItem("token", data.access_token);

            setTimeout(() => {
                onAuthSuccess(data.access_token);
            }, 900);
        } catch (err) {
            setMessage({
                type: "error",
                text: err.message || "Invalid or expired code.",
            });
        } finally {
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

                {mode !== "verify" && mode !== "forgot" && mode !== "reset" && (
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
                )}

                {message && (
                    <div className={`net-auth-message ${message.type}`}>
                        {message.text}
                    </div>
                )}

                {mode === "login" && (
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
                            <div className="net-auth-password-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    className="net-auth-eye-button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? "🙈" : "👁"}
                                </button>
                            </div>
                        </label>

                        <button type="submit" className="net-auth-submit" disabled={loading}>
                            {loading ? "Signing in..." : "Sign In"}
                        </button>

                        <button
                            type="button"
                            className="net-auth-resend"
                            onClick={() => switchMode("forgot")}
                        >
                            Forgot password?
                        </button>
                    </form>
                )}

                {mode === "register" && (
                    <form onSubmit={handleRegisterSubmit} className="net-auth-form">
                        <label>
                            Full Name
                            <input
                                type="text"
                                value={fullName}
                                onChange={(event) => setFullName(event.target.value)}
                                placeholder="Enter your full name"
                                required
                            />
                        </label>

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
                            <div className="net-auth-password-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    placeholder="Letters, numbers & symbols"
                                    required
                                />
                                <button
                                    type="button"
                                    className="net-auth-eye-button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? "🙈" : "👁"}
                                </button>
                            </div>
                        </label>

                        {password.length > 0 && (
                            <div className="net-auth-strength">
                                <div className="net-auth-strength-bar-track">
                                    <div
                                        className="net-auth-strength-bar-fill"
                                        style={{
                                            width: `${(passwordScore / 4) * 100}%`,
                                            background: passwordStrengthColor(),
                                        }}
                                    />
                                </div>

                                <span
                                    className="net-auth-strength-label"
                                    style={{ color: passwordStrengthColor() }}
                                >
                                    {passwordStrengthLabel()}
                                </span>

                                <ul className="net-auth-checklist">
                                    <li className={passwordChecks.length ? "met" : ""}>
                                        {passwordChecks.length ? "✓" : "○"} 8+ characters
                                    </li>
                                    <li className={passwordChecks.letter ? "met" : ""}>
                                        {passwordChecks.letter ? "✓" : "○"} Letter
                                    </li>
                                    <li className={passwordChecks.number ? "met" : ""}>
                                        {passwordChecks.number ? "✓" : "○"} Number
                                    </li>
                                    <li className={passwordChecks.special ? "met" : ""}>
                                        {passwordChecks.special ? "✓" : "○"} Special character
                                    </li>
                                </ul>
                            </div>
                        )}

                        <button type="submit" className="net-auth-submit" disabled={loading}>
                            {loading ? "Creating account..." : "Create Account"}
                        </button>
                    </form>
                )}

                {mode === "verify" && (
                    <form onSubmit={handleVerifySubmit} className="net-auth-form">
                        <p className="net-auth-hint">
                            We sent a 6-digit code to <strong>{email}</strong>. Enter it below to activate your account.
                        </p>

                        <label>
                            Verification Code
                            <input
                                type="text"
                                value={code}
                                onChange={(event) => setCode(event.target.value)}
                                placeholder="123456"
                                maxLength={6}
                                required
                                className="net-auth-code-input"
                            />
                        </label>

                        <button type="submit" className="net-auth-submit" disabled={loading}>
                            {loading ? "Verifying..." : "Verify Account"}
                        </button>
                        <button
                            type="button"
                            className="net-auth-resend"
                            onClick={handleResendCode}
                            disabled={loading}
                        >
                            Didn't get a code? Resend
                        </button>
                    </form>
                )}

                {mode === "forgot" && (
                    <form onSubmit={handleForgotPasswordSubmit} className="net-auth-form">
                        <p className="net-auth-hint">
                            Enter your email and we'll send you a code to reset your password.
                        </p>

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

                        <button type="submit" className="net-auth-submit" disabled={loading}>
                            {loading ? "Sending..." : "Send Reset Code"}
                        </button>

                        <button
                            type="button"
                            className="net-auth-resend"
                            onClick={() => switchMode("login")}
                        >
                            Back to Sign In
                        </button>
                    </form>
                )}

                {mode === "reset" && (
                    <form onSubmit={handleResetPasswordSubmit} className="net-auth-form">
                        <p className="net-auth-hint">
                            Enter the code sent to <strong>{email}</strong> and choose a new password.
                        </p>

                        <label>
                            Reset Code
                            <input
                                type="text"
                                value={code}
                                onChange={(event) => setCode(event.target.value)}
                                placeholder="123456"
                                maxLength={6}
                                required
                                className="net-auth-code-input"
                            />
                        </label>

                        <label>
                            New Password
                            <div className="net-auth-password-wrapper">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(event) => setNewPassword(event.target.value)}
                                    placeholder="Letters, numbers & symbols"
                                    required
                                />
                                <button
                                    type="button"
                                    className="net-auth-eye-button"
                                    onClick={() => setShowNewPassword((prev) => !prev)}
                                    tabIndex={-1}
                                >
                                    {showNewPassword ? "🙈" : "👁"}
                                </button>
                            </div>
                        </label>

                        <button type="submit" className="net-auth-submit" disabled={loading}>
                            {loading ? "Resetting..." : "Reset Password"}
                        </button>

                        <button
                            type="button"
                            className="net-auth-resend"
                            onClick={handleForgotPasswordSubmit}
                            disabled={loading}
                        >
                            Didn't get a code? Resend
                        </button>
                    </form>
                )}

            </div>

        </div>
    );
}
export default Auth;