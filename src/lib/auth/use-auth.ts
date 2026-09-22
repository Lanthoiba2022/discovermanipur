"use client";

import { useSyncExternalStore } from "react";

import { getServerSnapshot, getSnapshot, subscribe, type AuthState } from "./session-store";

export interface UseAuth extends AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  displayName: string;
  initials: string;
}

export function useAuth(): UseAuth {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { user } = state;

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.email?.split("@")[0] ||
    "Traveller";

  const initials =
    displayName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "Y";

  return {
    ...state,
    isLoading: state.status === "loading",
    isAuthenticated: Boolean(user),
    displayName,
    initials,
  };
}
