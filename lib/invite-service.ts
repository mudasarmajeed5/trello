import { SupabaseClient } from "@supabase/supabase-js";
import { BoardType, InviteType } from "./supabase/models";
export const inviteService = {
  async generateInvite(
    supabase: SupabaseClient,
    boardId: string,
    userId: string,
  ): Promise<InviteType> {
    const { data, error } = await supabase
      .from("invites")
      .insert({
        board_id: boardId,
        owner_id: userId,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async getJoinedBoards(
    supabase: SupabaseClient,
    userId: string,
  ): Promise<BoardType[]> {
    const { data, error } = await supabase
      .from("boards")
      .select("*, invites!inner(*)")
      .eq("invites.member_id", userId);
    if (error) throw error;
    return data || [];
  },
};
