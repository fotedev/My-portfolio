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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          added_at: string
          note: string | null
          user_id: string
        }
        Insert: {
          added_at?: string
          note?: string | null
          user_id: string
        }
        Update: {
          added_at?: string
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      contribution_translations: {
        Row: {
          contribution_id: string
          created_at: string
          locale: string
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          contribution_id: string
          created_at?: string
          locale: string
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          contribution_id?: string
          created_at?: string
          locale?: string
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contribution_translations_contribution_id_fkey"
            columns: ["contribution_id"]
            isOneToOne: false
            referencedRelation: "contributions"
            referencedColumns: ["id"]
          },
        ]
      }
      contributions: {
        Row: {
          created_at: string
          event_date: string | null
          id: string
          is_published: boolean
          kind: Database["public"]["Enums"]["contribution_kind"]
          number: number
          proof_url: string
          related_number: number | null
          repo: string
          sort_order: number
          status: Database["public"]["Enums"]["contribution_status"]
          updated_at: string
          verification_date: string
          your_role: string
        }
        Insert: {
          created_at?: string
          event_date?: string | null
          id?: string
          is_published?: boolean
          kind: Database["public"]["Enums"]["contribution_kind"]
          number: number
          proof_url: string
          related_number?: number | null
          repo: string
          sort_order?: number
          status: Database["public"]["Enums"]["contribution_status"]
          updated_at?: string
          verification_date: string
          your_role: string
        }
        Update: {
          created_at?: string
          event_date?: string | null
          id?: string
          is_published?: boolean
          kind?: Database["public"]["Enums"]["contribution_kind"]
          number?: number
          proof_url?: string
          related_number?: number | null
          repo?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["contribution_status"]
          updated_at?: string
          verification_date?: string
          your_role?: string
        }
        Relationships: []
      }
      credential_translations: {
        Row: {
          created_at: string
          credential_id: string
          issuer_display: string
          locale: string
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          credential_id: string
          issuer_display: string
          locale: string
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          credential_id?: string
          issuer_display?: string
          locale?: string
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credential_translations_credential_id_fkey"
            columns: ["credential_id"]
            isOneToOne: false
            referencedRelation: "credentials"
            referencedColumns: ["id"]
          },
        ]
      }
      credentials: {
        Row: {
          asset_media_id: string | null
          asset_url: string | null
          created_at: string
          credential_id: string | null
          en_only: boolean
          id: string
          issued_at: string | null
          kind: string
          proof_url: string
          published_at: string | null
          recipient_name: string
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
          verification_url: string | null
        }
        Insert: {
          asset_media_id?: string | null
          asset_url?: string | null
          created_at?: string
          credential_id?: string | null
          en_only?: boolean
          id?: string
          issued_at?: string | null
          kind?: string
          proof_url: string
          published_at?: string | null
          recipient_name: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          verification_url?: string | null
        }
        Update: {
          asset_media_id?: string | null
          asset_url?: string | null
          created_at?: string
          credential_id?: string | null
          en_only?: boolean
          id?: string
          issued_at?: string | null
          kind?: string
          proof_url?: string
          published_at?: string | null
          recipient_name?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          verification_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credentials_asset_media_id_fkey"
            columns: ["asset_media_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          budget: string | null
          created_at: string
          email: string
          id: string
          ip_hash: string
          message: string
          name: string
          service_interest: string | null
          status: Database["public"]["Enums"]["inquiry_status"]
          submission_token: string | null
          timeline: string | null
          updated_at: string
        }
        Insert: {
          budget?: string | null
          created_at?: string
          email: string
          id?: string
          ip_hash: string
          message: string
          name: string
          service_interest?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          submission_token?: string | null
          timeline?: string | null
          updated_at?: string
        }
        Update: {
          budget?: string | null
          created_at?: string
          email?: string
          id?: string
          ip_hash?: string
          message?: string
          name?: string
          service_interest?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          submission_token?: string | null
          timeline?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_service_interest_fkey"
            columns: ["service_interest"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["key"]
          },
        ]
      }
      media_assets: {
        Row: {
          alt_ar: string
          alt_en: string
          bucket: string
          created_at: string
          id: string
          is_private: boolean
          media_kind: Database["public"]["Enums"]["media_kind"]
          mime_type: string
          size_bytes: number
          storage_path: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          alt_ar: string
          alt_en: string
          bucket: string
          created_at?: string
          id?: string
          is_private?: boolean
          media_kind?: Database["public"]["Enums"]["media_kind"]
          mime_type: string
          size_bytes: number
          storage_path: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          alt_ar?: string
          alt_en?: string
          bucket?: string
          created_at?: string
          id?: string
          is_private?: boolean
          media_kind?: Database["public"]["Enums"]["media_kind"]
          mime_type?: string
          size_bytes?: number
          storage_path?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          created_at: string
          en_only: boolean
          id: string
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          en_only?: boolean
          id?: string
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          en_only?: boolean
          id?: string
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Relationships: []
      }
      posts_translations: {
        Row: {
          body: string | null
          created_at: string
          excerpt: string | null
          locale: string
          post_id: string
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          excerpt?: string | null
          locale: string
          post_id: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          excerpt?: string | null
          locale?: string
          post_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_translations_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      project_translations: {
        Row: {
          created_at: string
          locale: string
          problem: string
          project_id: string
          results: string | null
          solution: string
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          locale: string
          problem: string
          project_id: string
          results?: string | null
          solution: string
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          locale?: string
          problem?: string
          project_id?: string
          results?: string | null
          solution?: string
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_translations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          cover_asset_id: string | null
          cover_image_url: string | null
          created_at: string
          en_only: boolean
          gallery: Json | null
          id: string
          is_featured: boolean
          live_url: string | null
          published_at: string | null
          repo_url: string | null
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          tech_stack: string[]
          updated_at: string
        }
        Insert: {
          cover_asset_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          en_only?: boolean
          gallery?: Json | null
          id?: string
          is_featured?: boolean
          live_url?: string | null
          published_at?: string | null
          repo_url?: string | null
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          tech_stack?: string[]
          updated_at?: string
        }
        Update: {
          cover_asset_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          en_only?: boolean
          gallery?: Json | null
          id?: string
          is_featured?: boolean
          live_url?: string | null
          published_at?: string | null
          repo_url?: string | null
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          tech_stack?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_cover_asset_id_fkey"
            columns: ["cover_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_counters: {
        Row: {
          count: number
          key: string
          window_start: string
        }
        Insert: {
          count?: number
          key: string
          window_start: string
        }
        Update: {
          count?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      schema_migrations: {
        Row: {
          applied_at: string
          name: string
          version: string
        }
        Insert: {
          applied_at?: string
          name: string
          version: string
        }
        Update: {
          applied_at?: string
          name?: string
          version?: string
        }
        Relationships: []
      }
      service_translations: {
        Row: {
          created_at: string
          deliverables: string[]
          locale: string
          service_id: string
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deliverables?: string[]
          locale: string
          service_id: string
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deliverables?: string[]
          locale?: string
          service_id?: string
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_translations_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          key: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          key: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          key?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          availability_status: Database["public"]["Enums"]["availability"]
          contact_email: string
          created_at: string
          cv_url: string | null
          id: number
          socials: Json
          updated_at: string
        }
        Insert: {
          availability_status?: Database["public"]["Enums"]["availability"]
          contact_email: string
          created_at?: string
          cv_url?: string | null
          id?: number
          socials?: Json
          updated_at?: string
        }
        Update: {
          availability_status?: Database["public"]["Enums"]["availability"]
          contact_email?: string
          created_at?: string
          cv_url?: string | null
          id?: number
          socials?: Json
          updated_at?: string
        }
        Relationships: []
      }
      site_settings_translations: {
        Row: {
          availability_text: string
          created_at: string
          hero_name: string
          hero_offer: string
          hero_role: string
          locale: string
          site_settings_id: number
          updated_at: string
        }
        Insert: {
          availability_text: string
          created_at?: string
          hero_name: string
          hero_offer: string
          hero_role: string
          locale: string
          site_settings_id: number
          updated_at?: string
        }
        Update: {
          availability_text?: string
          created_at?: string
          hero_name?: string
          hero_offer?: string
          hero_role?: string
          locale?: string
          site_settings_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_translations_site_settings_id_fkey"
            columns: ["site_settings_id"]
            isOneToOne: false
            referencedRelation: "site_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      slug_redirects: {
        Row: {
          created_at: string
          from_slug: string
          to_slug: string
        }
        Insert: {
          created_at?: string
          from_slug: string
          to_slug: string
        }
        Update: {
          created_at?: string
          from_slug?: string
          to_slug?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_and_increment_rate_limit: {
        Args: { p_key: string; p_max: number; p_window_seconds: number }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      availability: "available" | "unavailable"
      content_status: "draft" | "published"
      contribution_kind: "pr" | "issue"
      contribution_status: "merged" | "open" | "acknowledged"
      inquiry_status: "unread" | "read" | "replied" | "archived"
      media_kind: "image" | "document" | "other"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      availability: ["available", "unavailable"],
      content_status: ["draft", "published"],
      contribution_kind: ["pr", "issue"],
      contribution_status: ["merged", "open", "acknowledged"],
      inquiry_status: ["unread", "read", "replied", "archived"],
      media_kind: ["image", "document", "other"],
    },
  },
} as const
