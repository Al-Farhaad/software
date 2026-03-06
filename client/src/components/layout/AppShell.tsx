import { HeartHandshake } from "lucide-react";
import type { ReactNode } from "react";
import { SIDEBAR_ITEMS } from "../../data/navigation";

interface AppShellProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  refreshing: boolean;
}

export const AppShell = ({ children, onRefresh, refreshing }: AppShellProps) => (
  <div className="mx-auto flex min-h-screen w-full max-w-[1360px] gap-5 p-4 lg:p-8">
    <aside className="hidden w-[250px] shrink-0 rounded-2xl border border-white/15 bg-white/5 p-5 lg:flex lg:flex-col">
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-xl bg-white/15 p-2">
          <HeartHandshake size={20} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-blue-200">Taba Foundation</p>
          <h1 className="text-lg font-semibold text-white">Donations Admin</h1>
        </div>
      </div>

      <nav className="space-y-2">
        {SIDEBAR_ITEMS.map(({ title, icon: Icon, active }) => (
          <button
            key={title}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm ${
              active
                ? "bg-white/15 text-white"
                : "text-blue-100/70 hover:bg-white/10 hover:text-white"
            }`}
            type="button"
            disabled={!active}
          >
            <Icon size={16} />
            {title}
          </button>
        ))}
      </nav>

      <button
        className="mt-auto rounded-xl border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-70"
        type="button"
        onClick={() => void onRefresh()}
        disabled={refreshing}
      >
        {refreshing ? "Refreshing..." : "Refresh Data"}
      </button>
    </aside>

    <main className="w-full space-y-5">
      <header className="rounded-2xl border border-white/15 bg-white/8 p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-blue-200">Donation Management</p>
        <h2 className="mt-1 text-2xl font-bold text-white lg:text-3xl">
          Taba Foundation Dashboard
        </h2>
      </header>
      {children}
    </main>
  </div>
);
