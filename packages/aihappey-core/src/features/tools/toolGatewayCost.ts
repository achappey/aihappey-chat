/** Gateway costs are optional. Match conversation accounting's numeric/string handling. */
const parseCost = (value: unknown): number | undefined => {
  if (typeof value !== "number" && (typeof value !== "string" || !value.trim())) return undefined;
  const cost = Number(value);
  return Number.isFinite(cost) ? cost : undefined;
};

export const gatewayResponseCost = (response: any): number | undefined =>
  parseCost(response?.providerMetadata?.gateway?.cost)
  ?? parseCost(response?.metadata?.gateway?.cost)
  ?? parseCost(response?._meta?.gateway?.cost);

/** One collector per tool invocation; never share state across concurrent executions. */
export function createToolGatewayCostCollector() {
  let total: number | undefined;
  const recordResponse = (response: unknown) => {
    const cost = gatewayResponseCost(response);
    if (cost !== undefined) total = (total ?? 0) + cost;
  };

  return {
    recordResponse,
    get hasCost() { return total !== undefined && Number.isFinite(total); },
    /** Capture raw non-streaming SDK responses before adapters strip custom metadata.
     * Count each HTTP response once, not both aggregate SDK metadata and its steps.
     */
    wrapFetch: (fetchImpl: typeof fetch = globalThis.fetch): typeof fetch => async (input, init) => {
      const response = await fetchImpl(input, init);
      try {
        recordResponse(await response.clone().json());
      } catch { /* Unpriced/non-JSON responses must not change tool behavior. */ }
      return response;
    },
    withCost: <T extends object>(result: T): T => {
      if (total === undefined || !Number.isFinite(total)) return result;
      const meta = (result as any)._meta;
      return {
        ...result,
        _meta: { ...meta, gateway: { ...meta?.gateway, cost: total } },
      };
    },
  };
}
