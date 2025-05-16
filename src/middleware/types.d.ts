import type { SupabaseClient } from '@supabase/supabase-js';

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
      user: {
        id: string;
        email?: string;
      } | null;
    }
  }
}
