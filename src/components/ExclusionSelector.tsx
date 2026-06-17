"use client";

import { useEffect, useMemo, useState } from "react";
import type { AdGuardService } from "@/lib/adguard";

interface ExclusionSelectorProps {
  services: AdGuardService[];
  domainsMap: Record<string, string[]>;
}

const CATEGORY_MAP: Record<
  string,
  { label: string; icon: string; color: string }
> = {
  VIDEO: {
    label: "Video Streaming",
    icon: "🎥",
    color: "bg-red-500/10 text-red-500 border-red-500/20",
  },
  SOCIAL_NETWORKS: {
    label: "Social Media",
    icon: "📱",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  MESSENGERS: {
    label: "Messengers & Chat",
    icon: "💬",
    color: "bg-green-500/10 text-green-500 border-green-500/20",
  },
  MUSIC: {
    label: "Music & Audio",
    icon: "🎵",
    color: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  },
  GAMES: {
    label: "Gaming",
    icon: "🎮",
    color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  },
  SEARCH: {
    label: "Search Engines",
    icon: "🔍",
    color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  WORK: {
    label: "Productivity & Work",
    icon: "💼",
    color: "bg-teal-500/10 text-teal-500 border-teal-500/20",
  },
  SHOP: {
    label: "Shopping",
    icon: "🛍️",
    color: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  },
};

export default function ExclusionSelector({
  services,
  domainsMap,
}: ExclusionSelectorProps) {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [customExclusions, setCustomExclusions] = useState("");

  // Initialize baseUrl and load selection from localStorage
  useEffect(() => {
    setBaseUrl(window.location.origin);
    const saved = localStorage.getItem("glinet_vpn_exclusions");
    if (saved) {
      try {
        setSelectedServices(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved exclusions", e);
      }
    }
    const savedCustom = localStorage.getItem("glinet_vpn_custom_exclusions");
    if (savedCustom) {
      setCustomExclusions(savedCustom);
    }
  }, []);

  const handleCustomExclusionsChange = (val: string) => {
    setCustomExclusions(val);
    localStorage.setItem("glinet_vpn_custom_exclusions", val);
  };

  // Save selections to localStorage
  const saveToStorage = (newSelection: string[]) => {
    setSelectedServices(newSelection);
    localStorage.setItem("glinet_vpn_exclusions", JSON.stringify(newSelection));
  };

  // Toggle individual service
  const handleToggleService = (serviceId: string) => {
    const nextSelection = selectedServices.includes(serviceId)
      ? selectedServices.filter((id) => id !== serviceId)
      : [...selectedServices, serviceId];
    saveToStorage(nextSelection);
  };

  // Get dynamic categories list with service count
  const categoriesList = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const service of services) {
      for (const cat of service.categories) {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    }

    return Object.entries(counts).map(([id, count]) => ({
      id,
      count,
      ...(CATEGORY_MAP[id] || {
        label: id,
        icon: "🌐",
        color: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
      }),
    }));
  }, [services]);

  // Filtered services list
  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesSearch =
        service.service_name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        service.service_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (domainsMap[service.service_id] &&
          domainsMap[service.service_id].some((d) =>
            d.toLowerCase().includes(searchQuery.toLowerCase()),
          ));

      const matchesCategory =
        !selectedCategory || service.categories.includes(selectedCategory);

      return matchesSearch && matchesCategory;
    });
  }, [services, searchQuery, selectedCategory, domainsMap]);

  const parsedCustomExclusions = useMemo(() => {
    return customExclusions
      .split(/[\n,]/)
      .map((s) => s.trim().toLowerCase())
      .filter((s) => {
        if (!s) return false;
        const parts = s.split(".");
        const tld = parts[parts.length - 1];
        const isIpOrCidr =
          /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(\/\d{1,2})?$/.test(s);
        const isDomainWithAlphaTld =
          parts.length > 1 && /^[a-zA-Z]+$/.test(tld);
        return isIpOrCidr || isDomainWithAlphaTld;
      });
  }, [customExclusions]);

  // Selected unique domains computed in real-time
  const selectedDomainsList = useMemo(() => {
    const unique = new Set<string>();
    for (const serviceId of selectedServices) {
      const domains = domainsMap[serviceId];
      if (domains) {
        for (const d of domains) {
          const trimmed = d.trim();
          if (trimmed) {
            const parts = trimmed.split(".");
            const tld = parts[parts.length - 1];
            const isIpOrCidr =
              /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(\/\d{1,2})?$/.test(trimmed);
            const isDomainWithAlphaTld =
              parts.length > 1 && /^[a-zA-Z]+$/.test(tld);
            if (isIpOrCidr || isDomainWithAlphaTld) {
              unique.add(trimmed);
            }
          }
        }
      }
    }
    for (const item of parsedCustomExclusions) {
      unique.add(item);
    }
    return Array.from(unique).sort();
  }, [selectedServices, domainsMap, parsedCustomExclusions]);

  // Select all visible services
  const handleSelectAllVisible = () => {
    const visibleIds = filteredServices.map((s) => s.service_id);
    const newSelection = Array.from(
      new Set([...selectedServices, ...visibleIds]),
    );
    saveToStorage(newSelection);
  };

  // Deselect all visible services
  const handleDeselectAllVisible = () => {
    const visibleIds = filteredServices.map((s) => s.service_id);
    const newSelection = selectedServices.filter(
      (id) => !visibleIds.includes(id),
    );
    saveToStorage(newSelection);
  };

  // Preset selectors
  const applyPreset = (presetName: string) => {
    let presetIds: string[] = [];
    if (presetName === "streaming") {
      presetIds = services
        .filter(
          (s) =>
            s.categories.includes("VIDEO") || s.categories.includes("MUSIC"),
        )
        .map((s) => s.service_id);
    } else if (presetName === "social") {
      presetIds = services
        .filter(
          (s) =>
            s.categories.includes("SOCIAL_NETWORKS") ||
            s.categories.includes("MESSENGERS"),
        )
        .map((s) => s.service_id);
    } else if (presetName === "gaming") {
      presetIds = services
        .filter((s) => s.categories.includes("GAMES"))
        .map((s) => s.service_id);
    }

    const newSelection = Array.from(
      new Set([...selectedServices, ...presetIds]),
    );
    saveToStorage(newSelection);
  };

  const clearAll = () => {
    saveToStorage([]);
  };

  // Subscription URL generator
  const subscriptionUrl = useMemo(() => {
    if (selectedServices.length === 0 && parsedCustomExclusions.length === 0)
      return "";
    const params = new URLSearchParams();
    if (selectedServices.length > 0) {
      params.set("services", selectedServices.join(","));
    }
    if (parsedCustomExclusions.length > 0) {
      params.set("custom", parsedCustomExclusions.join(","));
    }
    return `${baseUrl}/api/exclusions?${params.toString()}`;
  }, [selectedServices, parsedCustomExclusions, baseUrl]);

  const handleCopyLink = () => {
    if (!subscriptionUrl) return;
    navigator.clipboard.writeText(subscriptionUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (selectedDomainsList.length === 0) return;
    const blob = new Blob([selectedDomainsList.join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "glinet-vpn-exclusions.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Fallback image helper if AdGuard icon fails
  const renderIcon = (service: AdGuardService) => {
    const firstChar = service.service_name.charAt(0).toUpperCase();
    return (
      <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold border border-zinc-200/55 dark:border-zinc-700/55 overflow-hidden shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={service.icon_url}
          alt=""
          className="h-7 w-7 object-contain relative z-10"
          onError={(e) => {
            (e.target as HTMLElement).style.display = "none";
          }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-sm z-0">
          {firstChar}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-10">
      {/* Top Banner Dashboard Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/40 p-6 backdrop-blur transition hover:border-zinc-300 dark:hover:border-zinc-700">
          <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Exclusions Selected
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {selectedServices.length}
            </span>
            <span className="text-sm text-zinc-400 dark:text-zinc-500">
              services
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/40 p-6 backdrop-blur transition hover:border-zinc-300 dark:hover:border-zinc-700">
          <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Total Excluded Domains
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {selectedDomainsList.length}
            </span>
            <span className="text-sm text-zinc-400 dark:text-zinc-500">
              unique domains
            </span>
          </div>
        </div>
      </div>

      {/* Main Control Panel and Lists */}
      <div className="rounded-3xl border border-zinc-200/60 dark:border-zinc-850 bg-white/60 dark:bg-zinc-900/60 p-6 shadow-sm backdrop-blur sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Search bar */}
          <div className="relative flex-1 max-w-lg">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-400 dark:text-zinc-500">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <title>Search Icon</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search services (e.g. Netflix, YouTube, netflix.com)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-950/30 py-3 pl-11 pr-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-emerald-500 focus:bg-white focus:outline-none dark:focus:bg-zinc-950 dark:focus:border-emerald-400 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <span className="text-xs bg-zinc-200/60 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                  Clear
                </span>
              </button>
            )}
          </div>

          {/* Quick presets / visibility selectors */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-zinc-500 mr-1 font-medium">Presets:</span>
            <button
              type="button"
              onClick={() => applyPreset("streaming")}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition cursor-pointer"
            >
              🎬 Media Streaming
            </button>
            <button
              type="button"
              onClick={() => applyPreset("social")}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition cursor-pointer"
            >
              📱 Social & Chat
            </button>
            <button
              type="button"
              onClick={() => applyPreset("gaming")}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition cursor-pointer"
            >
              🎮 Gaming
            </button>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-850 mx-1"></div>
            <button
              type="button"
              onClick={clearAll}
              disabled={selectedServices.length === 0}
              className="rounded-lg border border-red-200 dark:border-red-900/30 bg-red-500/5 px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-500/10 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
            >
              Reset Selection
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="mt-8 flex flex-wrap gap-2 border-b border-zinc-100 dark:border-zinc-850 pb-4">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`rounded-lg px-3.5 py-2 text-sm font-medium transition cursor-pointer ${
              selectedCategory === null
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-850 dark:hover:text-zinc-100"
            }`}
          >
            📂 All ({services.length})
          </button>
          {categoriesList.map((cat) => (
            <button
              type="button"
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-lg px-3.5 py-2 text-sm font-medium transition flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-850 dark:hover:text-zinc-100"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              <span className="text-xs opacity-60">({cat.count})</span>
            </button>
          ))}
        </div>

        {/* Multi-select quick buttons */}
        <div className="mt-6 flex items-center justify-between text-xs text-zinc-500">
          <div>
            Showing{" "}
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {filteredServices.length}
            </span>{" "}
            of {services.length} services
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleSelectAllVisible}
              className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-450 dark:hover:text-emerald-350 font-medium transition cursor-pointer"
            >
              ✓ Select All Visible
            </button>
            <button
              type="button"
              onClick={handleDeselectAllVisible}
              className="text-zinc-550 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300 font-medium transition cursor-pointer"
            >
              ✗ Deselect All Visible
            </button>
          </div>
        </div>

        {/* Services Grid */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-h-[550px] overflow-y-auto pr-2">
          {filteredServices.length === 0 ? (
            <div className="col-span-full py-16 text-center text-zinc-400 dark:text-zinc-500">
              <span className="text-3xl block mb-2">🔍</span>
              No exclusion services found matching search or category
            </div>
          ) : (
            filteredServices.map((service) => {
              const isSelected = selectedServices.includes(service.service_id);
              const domainCount = domainsMap[service.service_id]?.length || 0;
              const mainCategory = service.categories[0];
              const categoryDetails = CATEGORY_MAP[mainCategory] || {
                label: mainCategory,
                icon: "🌐",
                color: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
              };

              return (
                <button
                  type="button"
                  key={service.service_id}
                  onClick={() => handleToggleService(service.service_id)}
                  className={`group relative flex items-center w-full text-left gap-4 rounded-2xl border p-4 transition duration-200 cursor-pointer ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-500/5 shadow-sm shadow-emerald-500/5 dark:border-emerald-500/60 dark:bg-emerald-500/5"
                      : "border-zinc-200/70 bg-zinc-50/20 dark:border-zinc-800/60 dark:bg-zinc-950/10 hover:bg-zinc-55/40 hover:border-zinc-300 dark:hover:bg-zinc-850/30 dark:hover:border-zinc-750"
                  }`}
                >
                  {/* Service Icon */}
                  {renderIcon(service)}

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-50 truncate group-hover:text-zinc-950 dark:group-hover:text-white transition">
                      {service.service_name}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md border font-medium ${categoryDetails.color}`}
                      >
                        {categoryDetails.label}
                      </span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                        • {domainCount}{" "}
                        {domainCount === 1 ? "domain" : "domains"}
                      </span>
                    </div>
                  </div>

                  {/* Checkbox */}
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 group-hover:border-zinc-400 dark:group-hover:border-zinc-650"
                    }`}
                  >
                    {isSelected && (
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <title>Checkmark Icon</title>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Custom Exclusions Block */}
      <div className="rounded-3xl border border-zinc-200/60 dark:border-zinc-850 bg-white/60 dark:bg-zinc-900/60 p-6 shadow-sm backdrop-blur sm:p-8 space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <span>📝</span> Custom Exclusions (IPs & Domains)
        </h2>
        <p className="text-sm text-zinc-550 dark:text-zinc-400">
          Enter custom domain names (e.g. <code>custom.mywebsite.com</code>) or
          IP addresses/CIDRs (e.g. <code>1.1.1.1</code> or{" "}
          <code>192.168.1.0/24</code>) to exclude, one per line or separated by
          commas.
        </p>
        <textarea
          rows={3}
          value={customExclusions}
          onChange={(e) => handleCustomExclusionsChange(e.target.value)}
          placeholder={"example.com\n192.168.1.50\n1.1.1.1/32"}
          className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-950/30 p-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400/70 focus:border-emerald-500 focus:bg-white focus:outline-none dark:focus:bg-zinc-950 dark:focus:border-emerald-400 transition font-mono resize-y min-h-[90px]"
        />
      </div>

      {/* Subscription Section */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        {/* URL Generator Column */}
        <div className="lg:col-span-7 rounded-3xl border border-zinc-250/50 dark:border-zinc-850 bg-gradient-to-br from-zinc-50/50 to-white/70 dark:from-zinc-950/20 dark:to-zinc-900/40 p-6 backdrop-blur sm:p-8 space-y-6">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <span className="text-emerald-500">🔗</span> Generated Subscription
            Link
          </h2>

          <p className="text-sm text-zinc-550 dark:text-zinc-400 leading-relaxed">
            Copy this URL and paste it into your GL.iNet router.
          </p>

          {selectedServices.length === 0 &&
          parsedCustomExclusions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-850 p-8 text-center text-sm text-zinc-400 dark:text-zinc-500">
              Select one or more services above or enter custom exclusions to
              generate your subscription URL
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-xl border border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-950/50 p-4 font-mono text-xs text-zinc-800 dark:text-zinc-300 break-all select-all flex items-center justify-between gap-4">
                <span className="overflow-x-auto whitespace-nowrap block pr-8 select-all max-w-[85%] scrollbar-none">
                  {subscriptionUrl}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`absolute right-3 top-3 shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition flex items-center gap-1.5 cursor-pointer ${
                    copied
                      ? "bg-emerald-500 text-white"
                      : "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200"
                  }`}
                >
                  {copied ? (
                    <>
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <title>Copied Icon</title>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <title>Copy Icon</title>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3"
                        />
                      </svg>
                      Copy Link
                    </>
                  )}
                </button>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  className="rounded-xl border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-850 shadow-sm transition flex items-center gap-2 cursor-pointer"
                >
                  📥 Download Plain Text (.txt)
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="rounded-xl border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-zinc-850 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-850 shadow-sm transition flex items-center gap-2 cursor-pointer"
                >
                  📋{" "}
                  {showPreview
                    ? "Hide Domains Preview"
                    : "Show Domains Preview"}
                </button>
              </div>

              {showPreview && (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-950/20 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-zinc-500 border-b border-zinc-200/50 dark:border-zinc-850/50 pb-2">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      File Output Preview
                    </span>
                    <span>{selectedDomainsList.length} total domains</span>
                  </div>
                  <pre className="font-mono text-xs text-zinc-700 dark:text-zinc-400 max-h-48 overflow-y-auto pr-2 leading-relaxed">
                    {selectedDomainsList.slice(0, 50).join("\n")}
                    {selectedDomainsList.length > 50 &&
                      `\n... and ${selectedDomainsList.length - 50} more domains.`}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Setup Instructions Column */}
        <div className="lg:col-span-5 rounded-3xl border border-zinc-250/50 dark:border-zinc-850 bg-gradient-to-br from-zinc-50/50 to-white/70 dark:from-zinc-950/20 dark:to-zinc-900/40 p-6 backdrop-blur sm:p-8 space-y-6">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <span className="text-emerald-500">⚙️</span> GL.iNet Router Setup
          </h2>

          <div className="space-y-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-xs mt-0.5">
                1
              </span>
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Copy the Exclusions Link
                </p>
                <p className="text-zinc-550 dark:text-zinc-400 text-xs">
                  Select your desired services above and copy the generated
                  subscription link.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-xs mt-0.5">
                2
              </span>
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Open VPN Dashboard
                </p>
                <p className="text-zinc-555 dark:text-zinc-400 text-xs">
                  Log into your GL.iNet admin panel and navigate to{" "}
                  <strong className="text-zinc-800 dark:text-zinc-200">
                    VPN
                  </strong>{" "}
                  →{" "}
                  <strong className="text-zinc-800 dark:text-zinc-200">
                    VPN Dashboard
                  </strong>
                  .
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-xs mt-0.5">
                3
              </span>
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Select Primary Tunnel
                </p>
                <p className="text-zinc-555 dark:text-zinc-400 text-xs">
                  Under your active VPN client profile, locate the{" "}
                  <strong className="text-zinc-800 dark:text-zinc-200">
                    Primary Tunnel
                  </strong>{" "}
                  settings.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-xs mt-0.5">
                4
              </span>
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Configure Routing Policy
                </p>
                <p className="text-zinc-555 dark:text-zinc-400 text-xs">
                  Click the{" "}
                  <strong className="text-zinc-800 dark:text-zinc-200">
                    "To"
                  </strong>{" "}
                  dropdown and change it from{" "}
                  <strong className="text-zinc-800 dark:text-zinc-200">
                    "All targets"
                  </strong>{" "}
                  to{" "}
                  <strong className="text-zinc-800 dark:text-zinc-200">
                    "Exclude specified Domain / IP List"
                  </strong>
                  .
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-xs mt-0.5">
                5
              </span>
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Input Subscription URL
                </p>
                <p className="text-zinc-555 dark:text-zinc-400 text-xs">
                  Set the Mode to{" "}
                  <strong className="text-zinc-800 dark:text-zinc-200">
                    "Subscription URL"
                  </strong>
                  , paste your copied subscription link in the{" "}
                  <strong className="text-zinc-800 dark:text-zinc-200">
                    "Input URL Link"
                  </strong>{" "}
                  input, and click{" "}
                  <strong className="text-zinc-800 dark:text-zinc-200">
                    Apply
                  </strong>
                  .
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-xs mt-0.5">
                6
              </span>
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Enable Primary Tunnel
                </p>
                <p className="text-zinc-555 dark:text-zinc-400 text-xs">
                  Make sure the switch for{" "}
                  <strong className="text-zinc-800 dark:text-zinc-200">
                    Primary Tunnel
                  </strong>{" "}
                  is toggled to{" "}
                  <strong className="text-zinc-800 dark:text-zinc-200">
                    "On"
                  </strong>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
