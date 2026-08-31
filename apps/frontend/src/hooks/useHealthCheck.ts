import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../services/apiClient";

export function useHealthCheck() {
  return useQuery({
    queryKey: ["health"],
    queryFn: apiClient.getHealth,
  });
}
