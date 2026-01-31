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
  async acceptInvite(
    supabase: SupabaseClient,
    inviteCode: string,
    userId: string,
  ): Promise<InviteType> {
    const { data: invite, error } = await supabase
      .from("invites")
      .select("*")
      .eq("invite_code", inviteCode)
      .maybeSingle();
    if (error) throw error;
    if (!invite) {
      throw new Error("Invalid Invite or Invite Expired.");
    }
    if (invite.owner_id == userId) {
      throw new Error("You can not join your own board");
    }
    if (invite.member_id == userId) {
      // Already joined - return the invite data
      return invite;
    }
    const { data, error: updateError } = await supabase
      .from("invites")
      .update({
        member_id: userId,
      })
      .eq("invite_code", inviteCode)
      .select()
      .maybeSingle();
    if (updateError) throw updateError;
    return data;
  },
};
