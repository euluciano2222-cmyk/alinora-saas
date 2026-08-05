export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_reviews: {
        Row: {
          confidence: number | null
          created_at: string
          id: string
          model_name: string | null
          organization_id: string
          request_id: string
          requested_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["ai_review_status"]
          suggested_due_at: string | null
          suggested_priority:
            | Database["public"]["Enums"]["request_priority"]
            | null
          suggested_summary: string | null
          suggested_tasks: Json
          updated_at: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          id?: string
          model_name?: string | null
          organization_id: string
          request_id: string
          requested_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["ai_review_status"]
          suggested_due_at?: string | null
          suggested_priority?:
            | Database["public"]["Enums"]["request_priority"]
            | null
          suggested_summary?: string | null
          suggested_tasks?: Json
          updated_at?: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          id?: string
          model_name?: string | null
          organization_id?: string
          request_id?: string
          requested_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["ai_review_status"]
          suggested_due_at?: string | null
          suggested_priority?:
            | Database["public"]["Enums"]["request_priority"]
            | null
          suggested_summary?: string | null
          suggested_tasks?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_reviews_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_reviews_request_same_organization"
            columns: ["request_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      approvals: {
        Row: {
          client_id: string
          created_at: string
          id: string
          message: string | null
          organization_id: string
          request_id: string
          requested_at: string
          requested_by: string
          responded_at: string | null
          response_note: string | null
          status: Database["public"]["Enums"]["approval_status"]
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          message?: string | null
          organization_id: string
          request_id: string
          requested_at?: string
          requested_by: string
          responded_at?: string | null
          response_note?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          message?: string | null
          organization_id?: string
          request_id?: string
          requested_at?: string
          requested_by?: string
          responded_at?: string | null
          response_note?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approvals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_request_client_same_organization"
            columns: ["request_id", "client_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id", "client_id", "organization_id"]
          },
        ]
      }
      clients: {
        Row: {
          company_name: string | null
          created_at: string
          created_by: string
          email: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          status: Database["public"]["Enums"]["client_status"]
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          organization_id: string
          role: Database["public"]["Enums"]["organization_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          organization_id: string
          role?: Database["public"]["Enums"]["organization_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["organization_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          client_id: string
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          name: string
          organization_id: string
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          name: string
          organization_id: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          name?: string
          organization_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_same_organization"
            columns: ["client_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      request_messages: {
        Row: {
          author_client_id: string | null
          author_user_id: string | null
          body: string
          created_at: string
          id: string
          is_internal: boolean
          organization_id: string
          request_id: string
          sender_type: Database["public"]["Enums"]["message_sender_type"]
        }
        Insert: {
          author_client_id?: string | null
          author_user_id?: string | null
          body: string
          created_at?: string
          id?: string
          is_internal?: boolean
          organization_id: string
          request_id: string
          sender_type: Database["public"]["Enums"]["message_sender_type"]
        }
        Update: {
          author_client_id?: string | null
          author_user_id?: string | null
          body?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          organization_id?: string
          request_id?: string
          sender_type?: Database["public"]["Enums"]["message_sender_type"]
        }
        Relationships: [
          {
            foreignKeyName: "request_messages_client_matches_request"
            columns: ["request_id", "author_client_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id", "client_id", "organization_id"]
          },
          {
            foreignKeyName: "request_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_messages_request_same_organization"
            columns: ["request_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      requests: {
        Row: {
          client_id: string
          completed_at: string | null
          created_at: string
          created_by: string
          due_at: string | null
          id: string
          organization_id: string
          original_message: string
          priority: Database["public"]["Enums"]["request_priority"]
          project_id: string | null
          source: Database["public"]["Enums"]["request_source"]
          status: Database["public"]["Enums"]["request_status"]
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          created_at?: string
          created_by: string
          due_at?: string | null
          id?: string
          organization_id: string
          original_message: string
          priority?: Database["public"]["Enums"]["request_priority"]
          project_id?: string | null
          source?: Database["public"]["Enums"]["request_source"]
          status?: Database["public"]["Enums"]["request_status"]
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string
          due_at?: string | null
          id?: string
          organization_id?: string
          original_message?: string
          priority?: Database["public"]["Enums"]["request_priority"]
          project_id?: string | null
          source?: Database["public"]["Enums"]["request_source"]
          status?: Database["public"]["Enums"]["request_status"]
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_client_same_organization"
            columns: ["client_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_project_client_same_organization"
            columns: ["project_id", "client_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id", "client_id", "organization_id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          created_at: string
          created_by: string
          description: string | null
          due_at: string | null
          id: string
          organization_id: string
          priority: Database["public"]["Enums"]["request_priority"]
          request_id: string
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_at?: string | null
          id?: string
          organization_id: string
          priority?: Database["public"]["Enums"]["request_priority"]
          request_id: string
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_at?: string | null
          id?: string
          organization_id?: string
          priority?: Database["public"]["Enums"]["request_priority"]
          request_id?: string
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_request_same_organization"
            columns: ["request_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_organization_role: {
        Args: {
          allowed_roles: Database["public"]["Enums"]["organization_role"][]
          target_organization_id: string
        }
        Returns: boolean
      }
      is_organization_member: {
        Args: { target_organization_id: string }
        Returns: boolean
      }
      shares_organization: {
        Args: { target_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      ai_review_status: "pending" | "approved" | "edited" | "rejected"
      approval_status:
        | "pending"
        | "approved"
        | "changes_requested"
        | "cancelled"
      client_status: "active" | "inactive" | "archived"
      message_sender_type: "team" | "client" | "system"
      organization_role: "owner" | "admin" | "member"
      project_status: "active" | "on_hold" | "completed" | "archived"
      request_priority: "low" | "normal" | "high" | "urgent"
      request_source: "manual" | "email" | "whatsapp" | "portal" | "other"
      request_status:
        | "received"
        | "ai_review"
        | "in_progress"
        | "waiting_client"
        | "completed"
        | "cancelled"
      task_status: "todo" | "in_progress" | "blocked" | "done" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      ai_review_status: ["pending", "approved", "edited", "rejected"],
      approval_status: [
        "pending",
        "approved",
        "changes_requested",
        "cancelled",
      ],
      client_status: ["active", "inactive", "archived"],
      message_sender_type: ["team", "client", "system"],
      organization_role: ["owner", "admin", "member"],
      project_status: ["active", "on_hold", "completed", "archived"],
      request_priority: ["low", "normal", "high", "urgent"],
      request_source: ["manual", "email", "whatsapp", "portal", "other"],
      request_status: [
        "received",
        "ai_review",
        "in_progress",
        "waiting_client",
        "completed",
        "cancelled",
      ],
      task_status: ["todo", "in_progress", "blocked", "done", "cancelled"],
    },
  },
} as const
