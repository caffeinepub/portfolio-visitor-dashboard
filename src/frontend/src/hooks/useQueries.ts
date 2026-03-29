import { useQuery } from "@tanstack/react-query";
import type { Visit } from "../backend.d";
import { useActor } from "./useActor";

export function useAllVisits() {
  const { actor, isFetching } = useActor();
  return useQuery<Visit[]>({
    queryKey: ["visits"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor.getAllVisits as () => Promise<Visit[]>)();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

export function useTotalVisitCount() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["totalVisits"],
    queryFn: async () => {
      if (!actor) return 0n;
      return actor.getTotalVisitCount();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}
