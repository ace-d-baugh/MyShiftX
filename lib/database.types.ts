export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type GlobalRole  = 'Guest' | 'User' | 'Admin'
export type BoardRole   = 'User' | 'Mod' | 'Leader'
export type FlagStatus      = 'pending' | 'resolved' | 'dismissed'
export type FlagTargetType  = 'post' | 'user' | 'comment' | 'board'
export type PreferredTime   = 'morning' | 'afternoon' | 'evening' | 'late'
export type CommentPostType = 'shift' | 'request'
export type JoinOutcome     = 'invalid_code' | 'user_declined' | 'success'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          display_name: string | null
          email: string
          email_verified: boolean
          phone_number: string | null
          notify_via_email: boolean
          notify_via_sms: boolean
          role: GlobalRole
          is_active: boolean
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          display_name?: string | null
          email: string
          email_verified?: boolean
          phone_number?: string | null
          notify_via_email?: boolean
          notify_via_sms?: boolean
          role?: GlobalRole
          is_active?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          email?: string
          email_verified?: boolean
          phone_number?: string | null
          notify_via_email?: boolean
          notify_via_sms?: boolean
          role?: GlobalRole
          is_active?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      boards: {
        Row: {
          id: string
          name: string
          invite_code: string
          invite_code_enabled: boolean
          created_by: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          invite_code: string
          invite_code_enabled?: boolean
          created_by?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          invite_code?: string
          invite_code_enabled?: boolean
          created_by?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "boards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_boards: {
        Row: {
          id: string
          user_id: string
          board_id: string
          role: BoardRole
          is_approved: boolean
          approved_by_user_id: string | null
          approved_at: string | null
          requested_at: string
        }
        Insert: {
          id?: string
          user_id: string
          board_id: string
          role: BoardRole
          is_approved?: boolean
          approved_by_user_id?: string | null
          approved_at?: string | null
          requested_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          board_id?: string
          role?: BoardRole
          is_approved?: boolean
          approved_by_user_id?: string | null
          approved_at?: string | null
          requested_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_boards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_boards_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          }
        ]
      }
      board_join_attempts: {
        Row: {
          id: string
          user_id: string
          code_entered: string
          outcome: JoinOutcome
          attempted_at: string
        }
        Insert: {
          id?: string
          user_id: string
          code_entered: string
          outcome: JoinOutcome
          attempted_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          code_entered?: string
          outcome?: JoinOutcome
          attempted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_join_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      shifts: {
        Row: {
          id: string
          created_by: string
          user_id: string | null
          board_id: string | null
          shift_title: string
          start_time: string
          end_time: string
          is_trade: boolean
          is_giveaway: boolean
          is_overtime_approved: boolean
          details: string | null
          is_active: boolean
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          created_by: string
          user_id?: string | null
          board_id?: string | null
          shift_title: string
          start_time: string
          end_time: string
          is_trade?: boolean
          is_giveaway?: boolean
          is_overtime_approved?: boolean
          details?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          created_by?: string
          user_id?: string | null
          board_id?: string | null
          shift_title?: string
          start_time?: string
          end_time?: string
          is_trade?: boolean
          is_giveaway?: boolean
          is_overtime_approved?: boolean
          details?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          }
        ]
      }
      requests: {
        Row: {
          id: string
          created_by: string
          user_id: string | null
          board_id: string | null
          preferred_times: PreferredTime[]
          requested_date: string
          details: string | null
          is_active: boolean
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          created_by: string
          user_id?: string | null
          board_id?: string | null
          preferred_times: PreferredTime[]
          requested_date: string
          details?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          created_by?: string
          user_id?: string | null
          board_id?: string | null
          preferred_times?: PreferredTime[]
          requested_date?: string
          details?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          }
        ]
      }
      flags: {
        Row: {
          id: string
          flagged_by_user_id: string | null
          target_type: FlagTargetType
          target_id: string
          board_id: string | null
          reason: string
          status: FlagStatus
          resolved_by_user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          flagged_by_user_id?: string | null
          target_type: FlagTargetType
          target_id: string
          board_id?: string | null
          reason: string
          status?: FlagStatus
          resolved_by_user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          flagged_by_user_id?: string | null
          target_type?: FlagTargetType
          target_id?: string
          board_id?: string | null
          reason?: string
          status?: FlagStatus
          resolved_by_user_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flags_flagged_by_user_id_fkey"
            columns: ["flagged_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      comments: {
        Row: {
          id: string
          post_type: CommentPostType
          post_id: string
          user_id: string | null
          body: string
          is_interested: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_type: CommentPostType
          post_id: string
          user_id?: string | null
          body: string
          is_interested?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_type?: CommentPostType
          post_id?: string
          user_id?: string | null
          body?: string
          is_interested?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
