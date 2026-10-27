// ============================================================================
// ZENFOCUS BACKEND CLIENT SERVICE
// Interfaces with Backend API Gateway / Supabase with Offline-First Local Cache
// Derived from Section 11 of ZENFOCUS Master Implementation Specification
// ============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserAccount,
  RestrictionPolicy,
  CommandReceipt,
  ApprovalRequest,
  CompletedSession,
  Schedule,
  ChildDevice,
  AuditEvent,
} from '../types';

export interface BackendResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
  fromCache?: boolean;
}

export class BackendClientService {
  private apiBaseUrl: string = process.env.EXPO_PUBLIC_API_URL || 'https://api.zenfocus.app/v1';
  private authToken: string | null = null;

  public setAuthToken(token: string | null) {
    this.authToken = token;
  }

  public getAuthToken(): string | null {
    return this.authToken;
  }

  /**
   * Safe fetch with authentication headers, timeout, and offline fallback
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    cacheKey?: string
  ): Promise<BackendResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        return { data: null, error: `HTTP ${response.status}: ${errorText}`, status: response.status };
      }

      const data = (await response.json()) as T;
      if (cacheKey) {
        await AsyncStorage.setItem(`zenfocus_cache_${cacheKey}`, JSON.stringify(data));
      }
      return { data, error: null, status: response.status };
    } catch (err: any) {
      // Offline fallback: if network request fails, return cached data if available
      if (cacheKey) {
        try {
          const cached = await AsyncStorage.getItem(`zenfocus_cache_${cacheKey}`);
          if (cached) {
            return {
              data: JSON.parse(cached) as T,
              error: null,
              status: 200,
              fromCache: true,
            };
          }
        } catch (ignored: any) {}
      }

      return {
        data: null,
        error: err?.name === 'AbortError' ? 'NETWORK_TIMEOUT' : (err?.message || 'OFFLINE'),
        status: 0,
      };
    }
  }

  // ===========================================================================
  // PAIRING & DEVICE REGISTRATION
  // ===========================================================================

  async createPairingInvitation(parentUserId: string): Promise<BackendResponse<{ code: string; expiresAt: string }>> {
    return this.request<{ code: string; expiresAt: string }>(
      '/pairing/invite',
      {
        method: 'POST',
        body: JSON.stringify({ parentUserId }),
      }
    );
  }

  async redeemPairingInvitation(
    code: string,
    childName: string,
    platform: string
  ): Promise<BackendResponse<{ familyRelationshipId: string; parentName: string; childDeviceId: string }>> {
    return this.request<{ familyRelationshipId: string; parentName: string; childDeviceId: string }>(
      '/pairing/redeem',
      {
        method: 'POST',
        body: JSON.stringify({ code, childName, platform }),
      }
    );
  }

  // ===========================================================================
  // POLICIES & COMMANDS
  // ===========================================================================

  async getPoliciesForDevice(deviceId: string): Promise<BackendResponse<RestrictionPolicy[]>> {
    return this.request<RestrictionPolicy[]>(
      `/devices/${deviceId}/policies`,
      { method: 'GET' },
      `policies_${deviceId}`
    );
  }

  async submitPolicyUpdate(
    policy: Partial<RestrictionPolicy> & { targetDeviceId: string; targetPackage: string }
  ): Promise<BackendResponse<{ policy: RestrictionPolicy; commandId: string; version: number }>> {
    return this.request<{ policy: RestrictionPolicy; commandId: string; version: number }>(
      '/policies/update',
      {
        method: 'POST',
        body: JSON.stringify(policy),
      }
    );
  }

  async submitCommandReceipt(receipt: CommandReceipt): Promise<BackendResponse<{ acknowledged: boolean }>> {
    return this.request<{ acknowledged: boolean }>(
      '/policies/receipt',
      {
        method: 'POST',
        body: JSON.stringify(receipt),
      }
    );
  }

  // ===========================================================================
  // FOCUS SESSIONS & ANALYTICS
  // ===========================================================================

  async recordSessionCompleted(session: CompletedSession): Promise<BackendResponse<{ recorded: boolean; streak: number }>> {
    return this.request<{ recorded: boolean; streak: number }>(
      '/sessions/complete',
      {
        method: 'POST',
        body: JSON.stringify(session),
      }
    );
  }
}

export const BackendClient = new BackendClientService();
