import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  connectConnector,
  disconnectConnector,
  getConnectorStatus,
  syncDocuments,
  type ConnectorId,
  type ConnectorStatusResponse,
  type SyncPayload,
} from "../../shared/api/connectors.api";

function statusKey(connectorId: ConnectorId) {
  return ["connector-status", connectorId] as const;
}

/** Fetches whether this connector is already connected, and its current file list. */
export function useConnectorStatusQuery(connectorId: ConnectorId) {
  return useQuery({
    queryKey: statusKey(connectorId),
    queryFn: () => getConnectorStatus(connectorId),
    staleTime: Infinity, // only changes via the mutations below
  });
}

/** Submits credentials (access token + folder path, etc.) and caches the returned file list. */
export function useConnectMutation(connectorId: ConnectorId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: Record<string, string>) =>
      connectConnector(connectorId, credentials),
    onSuccess: (data: ConnectorStatusResponse) => {
      queryClient.setQueryData(statusKey(connectorId), data);
    },
  });
}

export function useDisconnectMutation(connectorId: ConnectorId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => disconnectConnector(connectorId),
    onSuccess: () => {
      queryClient.setQueryData(statusKey(connectorId), {
        status: "disconnected",
        items: [],
      } satisfies ConnectorStatusResponse);
    },
  });
}

/** Sends department_id + selected file paths to the backend for fetch-and-upload. */
export function useSyncDocumentsMutation() {
  return useMutation({
    mutationFn: (payload: SyncPayload) => syncDocuments(payload),
  });
}