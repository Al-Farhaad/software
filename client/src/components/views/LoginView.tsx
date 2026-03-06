import { useState } from "react";

interface LoginViewProps {
  onLogin: (email: string, password: string) => boolean;
}

export const LoginView = ({ onLogin }: LoginViewProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const isValid = onLogin(email, password);
    if (!isValid) {
      setError("Wrong password or email");
      return;
    }
    setError("");
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

          <form className="grid gap-3" onSubmit={handleSubmit}>
            <input
              className="tf-input"
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <input
              className="tf-input"
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            {error && <p className="text-sm font-medium text-red-600">{error}</p>}

            <button className="tf-btn-purple mt-1 w-full justify-center" type="submit">
              Login
            </button>
          </form>
        </section>
      </div>
    </main>
  );
};
