import ExclusionSelector from "@/components/ExclusionSelector";
import {
  type AdGuardService,
  getExclusionDomains,
  getExclusionServices,
} from "@/lib/adguard";

export default async function Home() {
  let services: AdGuardService[] = [];
  let domainsMap: Record<string, string[]> = {};
  let errorMsg = "";

  try {
    // Both calls are parallelized and cached inside the server module
    const [fetchedServices, fetchedDomainsMap] = await Promise.all([
      getExclusionServices(),
      getExclusionDomains(),
    ]);

    // Sort services alphabetically by name
    services = fetchedServices.sort((a, b) =>
      a.service_name.localeCompare(b.service_name),
    );
    domainsMap = fetchedDomainsMap;
  } catch (error) {
    console.error("Failed to load AdGuard exclusion data:", error);
    errorMsg =
      "Failed to load exclusions catalog from AdGuard. Please refresh or try again later.";
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#070708] text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors duration-200">
      {/* Header */}
      <header className="border-b border-zinc-200/60 dark:border-zinc-850/60 bg-white/70 dark:bg-zinc-950/60 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-500/10">
              🛡️
            </div>
            <div>
              <span className="font-bold text-zinc-900 dark:text-zinc-50 tracking-tight block leading-none">
                GL.iNet VPN Exclusions
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                Generator
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://docs.gl-inet.com/router/en/4/tutorials/how_to_configure_domain_and_ip_filtering_rules_for_glinet_routers_via_an_online_text_file/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-zinc-650 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition"
            >
              GL.iNet Docs
            </a>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800"></div>
            <a
              href="https://github.com/javascripter/gl-inet-vpn-exclusions-generator"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 p-2 transition text-zinc-700 dark:text-zinc-300"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <title>GitHub Repository</title>
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"
                />
              </svg>
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto space-y-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-white bg-clip-text">
            GL.iNet VPN Exclusions Generator
          </h1>
          <p className="text-base sm:text-lg text-zinc-550 dark:text-zinc-400 leading-relaxed">
            Select the services below to generate a subscription link for your
            GL.iNet router to exclude them from the VPN.
          </p>
        </section>

        {/* Dynamic Selector Box */}
        {errorMsg ? (
          <div className="rounded-3xl border border-red-200 bg-red-500/5 p-8 text-center text-red-600 dark:border-red-900/30 dark:text-red-400">
            <span className="text-4xl block mb-3">⚠️</span>
            <p className="font-semibold text-lg">{errorMsg}</p>
            <p className="text-sm mt-1 opacity-80">
              Please ensure you have an active internet connection and try
              reloading the page.
            </p>
          </div>
        ) : (
          <ExclusionSelector services={services} domainsMap={domainsMap} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/50 dark:border-zinc-850/60 py-8 bg-zinc-50 dark:bg-zinc-950/20 text-center text-xs text-zinc-400 dark:text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>
            This is an unofficial open-source utility and is not affiliated
            with, authorized, maintained, sponsored, or endorsed by AdGuard,
            AdGuard VPN, or GL.iNet. Use at your own risk.
          </p>
        </div>
      </footer>
    </div>
  );
}
