import type { NextRequest } from "next/server";
import { getExclusionDomains } from "@/lib/adguard";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const servicesParam = searchParams.get("services");
    const customParam = searchParams.get("custom");

    if (!servicesParam && !customParam) {
      // If no parameters are provided, return a header indicating how to use the API
      // and an empty domain list so the router doesn't crash or filter everything.
      return new Response(
        "# GL.iNet VPN Exclusions Generator\n" +
          "# Usage: Add ?services=netflix,youtube or ?custom=mywebsite.com to the URL\n" +
          "# Go to the website to select services and generate this link.\n",
        {
          status: 200,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=300", // Short cache for empty requests
          },
        },
      );
    }

    // Parse the comma-separated list of service IDs
    const selectedServices = servicesParam
      ? servicesParam
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter((s) => s.length > 0)
      : [];

    const customExclusions = customParam
      ? customParam
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter((s) => s.length > 0)
      : [];

    if (selectedServices.length === 0 && customExclusions.length === 0) {
      return new Response("", {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=300",
        },
      });
    }

    // Fetch the domains cache (internally cached for 24h)
    const domainsMap = await getExclusionDomains();

    // Collect and deduplicate domains for all selected services and custom items
    const uniqueDomains = new Set<string>();

    for (const serviceId of selectedServices) {
      const domains = domainsMap[serviceId];
      if (domains && Array.isArray(domains)) {
        for (const domain of domains) {
          const trimmed = domain.trim();
          if (trimmed) {
            const parts = trimmed.split(".");
            const tld = parts[parts.length - 1];
            const isIpOrCidr =
              /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(\/\d{1,2})?$/.test(trimmed);
            const isDomainWithAlphaTld =
              parts.length > 1 && /^[a-zA-Z]+$/.test(tld);

            if (isIpOrCidr || isDomainWithAlphaTld) {
              uniqueDomains.add(trimmed);
            }
          }
        }
      }
    }

    for (const item of customExclusions) {
      const parts = item.split(".");
      const tld = parts[parts.length - 1];
      const isIpOrCidr =
        /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(\/\d{1,2})?$/.test(item);
      const isDomainWithAlphaTld = parts.length > 1 && /^[a-zA-Z]+$/.test(tld);

      if (isIpOrCidr || isDomainWithAlphaTld) {
        uniqueDomains.add(item);
      }
    }

    // Convert to sorted array for stability/readability
    const sortedDomains = Array.from(uniqueDomains).sort();

    // Join with newlines as required by GL.iNet domain filtering rules (one filter per line)
    const fileContent = sortedDomains.join("\n");

    return new Response(fileContent, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        // Instruct downstream clients/routers to cache the result for up to 1 hour
        // while the server itself caches AdGuard fetches for 24 hours
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error generating exclusion list:", error);
    return new Response(
      `# Error generating domain exclusion list\n# Please check your server logs.\n`,
      {
        status: 500,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      },
    );
  }
}
