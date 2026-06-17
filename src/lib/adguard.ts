export interface AdGuardService {
  service_id: string;
  service_name: string;
  icon_url: string;
  categories: string[];
  modified_time: string;
}

export interface AdGuardServiceDomains {
  service_id: string;
  domains: string[];
}

export interface AdGuardCatalogResponse {
  services: AdGuardService[];
}

export interface AdGuardDomainsResponse {
  services: AdGuardServiceDomains[];
}

export async function getExclusionServices(): Promise<AdGuardService[]> {
  try {
    // We use the Next.js fetch options to cache the request in the filesystem cache
    const response = await fetch(
      "https://api.adguard.io/api/v2/exclusion_services?locale=en",
      {
        next: { revalidate: 86400 }, // 24 hours
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch AdGuard services catalog: ${response.statusText}`,
      );
    }

    const data: AdGuardCatalogResponse = await response.json();
    return data.services || [];
  } catch (error) {
    console.error("Error fetching AdGuard services:", error);
    throw error;
  }
}

export async function getExclusionDomains(): Promise<Record<string, string[]>> {
  try {
    // Fetch domains for all services in one shot (~15 KB)
    const response = await fetch(
      "https://api.adguard.io/api/v1/exclusion_services/domains?service_id=",
      {
        next: { revalidate: 86400 }, // 24 hours
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch AdGuard exclusion domains: ${response.statusText}`,
      );
    }

    const data: AdGuardDomainsResponse = await response.json();
    const servicesList = data.services || [];

    // Map service_id to domains
    const domainsMap: Record<string, string[]> = {};
    for (const service of servicesList) {
      domainsMap[service.service_id] = service.domains || [];
    }

    return domainsMap;
  } catch (error) {
    console.error("Error fetching AdGuard domains:", error);
    throw error;
  }
}
