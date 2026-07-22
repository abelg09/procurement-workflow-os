import { createClient, SupabaseClient } from "@supabase/supabase-js";

type ProcurementDatabase = {
  public: {
    Tables: {
      procurement_app_state: {
        Row: {
          id: string;
          state: unknown;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          state: unknown;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          state?: unknown;
          updated_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

let browserClient: SupabaseClient<ProcurementDatabase> | null = null;

const SUPABASE_FETCH_TIMEOUT_MS = 45000;

function createSupabaseFetch(timeoutMs = SUPABASE_FETCH_TIMEOUT_MS): typeof fetch {
  return async (...args: Parameters<typeof fetch>) => {
    const [input, init] = args;
    const controller = new AbortController();
    const upstreamSignal = init?.signal;
    const abortFromUpstream = () => controller.abort();

    if (upstreamSignal?.aborted) {
      controller.abort();
    } else {
      upstreamSignal?.addEventListener("abort", abortFromUpstream, { once: true });
    }

    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await globalThis.fetch(input, {
        ...init,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
      upstreamSignal?.removeEventListener("abort", abortFromUpstream);
    }
  };
}

export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  if (!browserClient) {
    browserClient = createClient<ProcurementDatabase>(url, anonKey, {
      global: {
        fetch: createSupabaseFetch(),
      },
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    });
  }

  return browserClient;
}

export function getSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    global: {
      fetch: createSupabaseFetch(),
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
