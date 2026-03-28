import { useState } from "react";

interface LoginViewProps {
  onLogin: (email: string, password: string) => Promise<void>;
}

export const LoginView = ({ onLogin }: LoginViewProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      await onLogin(email, password);
      setError("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Wrong password or email");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center">
        <section className="w-full rounded-2xl border border-[var(--tf-border)] bg-white p-5 shadow-lg sm:p-6">
          <div className="mb-5 flex flex-col items-center text-center">
            <img
              src="/taba-foundation-logo.jpg"
              alt="Taba Foundation"
              className="h-20 w-20 rounded-full border border-slate-200 object-cover"
            />
            <h1 className="mt-3 text-2xl font-bold text-[var(--tf-navy)]">Taba Foundation</h1>
            <p className="text-sm text-slate-500">Sign in to continue</p>
          </div>

          <form className="grid gap-3" onSubmit={(event) => void handleSubmit(event)}>
            <input
              className="tf-input"
              type="email"
              placeholder="Email"
              required
              disabled={submitting}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <input
              className="tf-input"
              type="password"
              placeholder="Password"
              required
              disabled={submitting}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            {error && <p className="text-sm font-medium text-red-600">{error}</p>}

            <button className="tf-btn-purple mt-1 w-full justify-center" type="submit" disabled={submitting}>
              {submitting ? "Logging in..." : "Login"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
};
