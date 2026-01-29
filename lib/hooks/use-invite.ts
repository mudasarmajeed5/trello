import { useUser } from "@clerk/nextjs";
import { inviteService } from "../invite-service";
import { useState } from "react";
import { InviteType } from "../supabase/models";
import { useSupabase } from "../supabase/SupabaseProvider";
export function useInvite() {
  const { user } = useUser();
  const { supabase } = useSupabase();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState<InviteType | null>(null);
  async function generateInviteId(boardId: string) {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const data = await inviteService.generateInvite(
        supabase!,
        boardId,
        user?.id,
      );
      setInvite(data);
      return data;
    } catch (error) {
        const err = error as Error;
        setError(err.message ? err.message : "Failed to generate invite-id")
    } finally {
      setLoading(false);
    }
  }
  return {
    loading,
    error,
    invite,
    generateInviteId,
  };
}
