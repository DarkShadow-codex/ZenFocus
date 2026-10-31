// ============================================================================
// ZENFOCUS SUPABASE CLIENT & DATA ACCESS LAYER
// Authoritative Supabase REST client with offline resilience
// ============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserAccount,
  RestrictionPolicy,
  CommandReceipt,
  ChildDevice,
  AuditEvent,
} from '../types';

export interface DatabaseHealthStatus {
  database_name: string;
  connected_user: string;
  server_time: string;
  postgres_version: string;
}

export interface SupabaseResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

export class SupabaseClientService {
  private supabaseUrl: string = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  private supabaseKey: string = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
  private authToken: string | null = null;

  public setAuthToken(token: string | null) {
    this.authToken = token;
  }

  public getAuthToken(): string | null {
    return this.authToken;
  }

  public getProjectUrl(): string {
    return this.supabaseUrl;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'apikey': this.supabaseKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': this.authToken ? `Bearer ${this.authToken}` : `Bearer ${this.supabaseKey}`,
    };
    return headers;
  }

  /**
   * Safe fetch with 8s timeout and structured error handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<SupabaseResponse<T>> {
    const headers = {
      ...this.getHeaders(),
      ...(options.headers as Record<string, string> || {}),
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`${this.supabaseUrl}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let message = `Supabase HTTP ${response.status}`;
        try {
          const parsed = JSON.parse(errorText);
          message = parsed.message || parsed.error_description || message;
        } catch {
          if (errorText) message = errorText;
        }
        return { data: null, error: message, status: response.status };
      }

      const text = await response.text();
      const data = text ? (JSON.parse(text) as T) : null;
      return { data, error: null, status: response.status };
    } catch (err: any) {
      const isTimeout = err?.name === 'AbortError';
      const message = isTimeout
        ? 'Supabase connection timed out (8000ms)'
        : (err?.message || 'Network request failed');

      return { data: null, error: message, status: isTimeout ? 408 : 0 };
    }
  }

  // ===========================================================================
  // HEALTH & CONNECTIVITY
  // ===========================================================================

  async checkDatabaseHealth(): Promise<SupabaseResponse<DatabaseHealthStatus[]>> {
    return this.request<DatabaseHealthStatus[]>(
      '/rest/v1/rpc/check_connection',
      { method: 'POST' }
    );
  }

  // ===========================================================================
  // USER PROFILES & RELATIONSHIPS
  // ===========================================================================

  async getCurrentUser(userId: string): Promise<SupabaseResponse<UserAccount>> {
    const res = await this.request<any[]>(
      `/rest/v1/users?id=eq.${encodeURIComponent(userId)}&select=*`
    );
    if (res.data && res.data.length > 0) {
      const u = res.data[0];
      return {
        data: {
          id: u.id,
          name: u.display_name,
          email: u.email,
          role: u.role,
          createdAt: u.created_at,
        },
        error: null,
        status: res.status,
      };
    }
    return { data: null, error: res.error || 'User not found', status: res.status };
  }

  // ===========================================================================
  // DEVICES
  // ===========================================================================

  async getDevicesForUser(userId: string): Promise<SupabaseResponse<ChildDevice[]>> {
    return this.request<ChildDevice[]>(
      `/rest/v1/devices?user_id=eq.${encodeURIComponent(userId)}&select=*`
    );
  }

  // ===========================================================================
  // RESTRICTION POLICIES
  // ===========================================================================

  async getRestrictionPolicies(deviceId: string): Promise<SupabaseResponse<RestrictionPolicy[]>> {
    const cacheKey = `@zenfocus_policies_${deviceId}`;
    const res = await this.request<any[]>(
      `/rest/v1/restriction_policies?target_device_id=eq.${encodeURIComponent(deviceId)}&select=*`
    );

    if (res.data) {
      // Map database schema to frontend types
      const policies: RestrictionPolicy[] = res.data.map((row) => ({
        id: row.id,
        familyRelationshipId: 'rel_default',
        targetDeviceId: row.target_device_id,
        ownerType: row.owner_type,
        policyType: row.policy_type,
        targetPackage: row.target_package,
        appName: row.app_name,
        appCategory: row.app_category,
        appIcon: row.app_icon || 'apps-outline',
        iconBg: row.icon_bg || '#6366F1',
        desiredState: row.desired_state,
        version: row.version,
        scheduleDescription: row.schedule_description,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      // Cache locally for offline resilience
      await AsyncStorage.setItem(cacheKey, JSON.stringify(policies)).catch(() => {});
      return { data: policies, error: null, status: res.status };
    }

    // Try offline cache fallback
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        return { data: JSON.parse(cached), error: null, status: 200 };
      }
    } catch {}

    return { data: null, error: res.error, status: res.status };
  }

  // ===========================================================================
  // POLICY RECEIPTS
  // ===========================================================================

  async submitReceipt(receipt: CommandReceipt): Promise<SupabaseResponse<void>> {
    return this.request<void>(
      '/rest/v1/policy_receipts',
      {
        method: 'POST',
        headers: { 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          command_id: receipt.commandId,
          target_device_id: receipt.targetDeviceId,
          policy_id: receipt.policyId,
          policy_version: receipt.policyVersion,
          status: receipt.status,
          platform_code: receipt.platformCode,
          platform_error_code: receipt.platformErrorCode,
          safe_diagnostic: receipt.safeDiagnostic,
          reported_at: new Date(receipt.reportedAt).toISOString(),
        }),
      }
    );
  }
}

export const SupabaseClient = new SupabaseClientService();
export default SupabaseClient;

