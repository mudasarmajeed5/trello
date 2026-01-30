"use client"
import { useUser } from "@clerk/nextjs";
import { inviteService } from "../invite-service";
import { useEffect, useState } from "react";
import { BoardType, InviteType } from "../supabase/models";
import { useSupabase } from "../supabase/SupabaseProvider";
export function useInvite() {
  const { user } = useUser();
  const { supabase } = useSupabase();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinedBoards, setJoinedBoards] = useState<BoardType[]>([]);
  useEffect(() => {
    if (!user) return;
    getJoinedBoards();
  }, [user]);
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
      return data;
    } catch (error) {
      const err = error as Error;
      setError(err.message ? err.message : "Failed to generate invite-id");
    } finally {
      setLoading(false);
    }
  }
  async function getJoinedBoards() {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const data = await inviteService.getJoinedBoards(supabase!, user?.id);
      setJoinedBoards(data);
    } catch (err) {
      const error = err as Error;
      setError(error.message ? error.message : "Failed to Get Joined boards");
    } finally {
      setLoading(false);
    }
  }
  async function acceptUserInvite(inviteId: string) {
    if (!user || !inviteId) {
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await inviteService.acceptInvite(supabase!, inviteId, user.id);
      console.log(data);
    } catch (err) {
      const error = err as Error;
      setError(error.message ? error.message : "Failed to Get Joined boards");
    } finally {
      setLoading(false);
    }
  }
  return {
    loading,
    error,
    generateInviteId,
    joinedBoards,
    acceptUserInvite
  };
}
