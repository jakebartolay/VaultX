import { ArrowDownRight, ArrowUpRight, BarChart3, CreditCard, PiggyBank, WalletCards } from "lucide-react";

export function AuthCover({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#f8f7fb] text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <div className="grid min-h-screen lg:grid-cols-[1fr_460px]">
        <section className="relative hidden overflow-hidden bg-[#f3f0ff] px-10 py-8 dark:bg-slate-900 lg:flex lg:flex-col">
          <BrandMark />

          <div className="flex flex-1 items-center justify-center">
            <div className="relative w-full max-w-3xl">
              <div className="absolute left-8 top-8 h-40 w-40 rounded-full bg-violet-200/50 blur-3xl dark:bg-violet-900/30" />
              <div className="absolute bottom-6 right-6 h-52 w-52 rounded-full bg-cyan-200/50 blur-3xl dark:bg-cyan-900/30" />

              <div className="relative rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-2xl shadow-violet-200/60 backdrop-blur dark:border-white/10 dark:bg-slate-950/80 dark:shadow-black/30">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">VaultX Analytics</p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-tight">Money dashboard</h2>
                  </div>
                  <div className="rounded-xl bg-violet-600 px-3 py-2 text-sm font-medium text-white">
                    PHP
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <CoverMetric
                    icon={WalletCards}
                    label="Net Worth"
                    value="₱482k"
                    tone="violet"
                    trend="+12.4%"
                  />
                  <CoverMetric
                    icon={CreditCard}
                    label="Expenses"
                    value="₱18.2k"
                    tone="rose"
                    trend="-4.8%"
                  />
                  <CoverMetric
                    icon={PiggyBank}
                    label="Savings"
                    value="₱64k"
                    tone="cyan"
                    trend="+8.1%"
                  />
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-2xl border bg-white p-5 dark:border-white/10 dark:bg-slate-900">
                    <div className="mb-5 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Cash flow</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Last 8 months</p>
                      </div>
                      <BarChart3 className="h-5 w-5 text-violet-600" />
                    </div>
                    <div className="flex h-44 items-end gap-3">
                      {[42, 68, 51, 76, 58, 88, 62, 96].map((height, index) => (
                        <div key={index} className="flex flex-1 flex-col justify-end gap-2">
                          <div
                            className="rounded-t-lg bg-violet-500/90"
                            style={{ height: `${height}%` }}
                          />
                          <div
                            className="rounded-t-lg bg-cyan-400/80"
                            style={{ height: `${Math.max(18, 105 - height)}%` }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border bg-white p-5 dark:border-white/10 dark:bg-slate-900">
                      <p className="text-sm font-medium">Budget health</p>
                      <div className="mt-5 flex items-center justify-center">
                        <div className="grid h-36 w-36 place-items-center rounded-full border-[14px] border-violet-500 border-r-violet-100 border-t-cyan-400 text-center dark:border-r-slate-800">
                          <div>
                            <p className="text-2xl font-semibold">72%</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">safe</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border bg-white p-5 dark:border-white/10 dark:bg-slate-900">
                      <p className="text-sm font-medium">Database sync</p>
                      <p className="mt-2 text-2xl font-semibold text-violet-600">Live</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        MySQL-backed records per user
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen flex-col bg-white px-6 py-7 dark:bg-slate-950 sm:px-10 lg:px-12">
          <div className="lg:hidden">
            <BrandMark />
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-sm py-8">
              <div className="mb-7">
                <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {description}
                </p>
              </div>
              {children}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-300/60 dark:shadow-violet-950">
        <WalletCards className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xl font-semibold tracking-tight">VaultX</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Finance admin</p>
      </div>
    </div>
  );
}

function CoverMetric({
  icon: Icon,
  label,
  value,
  trend,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  trend: string;
  tone: "violet" | "rose" | "cyan";
}) {
  const classes = {
    violet: "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
    cyan: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300",
  }[tone];
  const TrendIcon = trend.startsWith("-") ? ArrowDownRight : ArrowUpRight;

  return (
    <div className="rounded-2xl border bg-white p-4 dark:border-white/10 dark:bg-slate-900">
      <div className="flex items-start justify-between">
        <div className={`rounded-xl p-2 ${classes}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
          <TrendIcon className="h-3.5 w-3.5" />
          {trend}
        </span>
      </div>
      <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
