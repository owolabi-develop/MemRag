

import { useQuery } from "@tanstack/react-query";
import { getTenant } from "../api/tenant.api";

export function useTenantQuery() {
  return useQuery({
    queryKey: ["tenant"],
    queryFn: getTenant,
  });
}