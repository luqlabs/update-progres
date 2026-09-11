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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          details: Json | null
          id: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      analytics_summary: {
        Row: {
          ai_overview: string | null
          ai_overview_generated_at: string | null
          app_id: string
          avg_score: number | null
          common_mistakes: Json | null
          completion_rate: number | null
          id: string
          last_updated: string
          open_ended_summary: Json | null
          poll_results: Json | null
          total_plays: number | null
          word_cloud_data: Json | null
        }
        Insert: {
          ai_overview?: string | null
          ai_overview_generated_at?: string | null
          app_id: string
          avg_score?: number | null
          common_mistakes?: Json | null
          completion_rate?: number | null
          id?: string
          last_updated?: string
          open_ended_summary?: Json | null
          poll_results?: Json | null
          total_plays?: number | null
          word_cloud_data?: Json | null
        }
        Update: {
          ai_overview?: string | null
          ai_overview_generated_at?: string | null
          app_id?: string
          avg_score?: number | null
          common_mistakes?: Json | null
          completion_rate?: number | null
          id?: string
          last_updated?: string
          open_ended_summary?: Json | null
          poll_results?: Json | null
          total_plays?: number | null
          word_cloud_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_summary_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: true
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
      apps: {
        Row: {
          accepting_responses: boolean | null
          app_type: string
          config: Json
          created_at: string
          document_context: Json | null
          folder_id: string | null
          id: string
          is_starred: boolean | null
          share_code: string
          teacher_id: string
          theme: string | null
          title: string
          updated_at: string
          url_context: Json | null
        }
        Insert: {
          accepting_responses?: boolean | null
          app_type?: string
          config: Json
          created_at?: string
          document_context?: Json | null
          folder_id?: string | null
          id?: string
          is_starred?: boolean | null
          share_code: string
          teacher_id: string
          theme?: string | null
          title: string
          updated_at?: string
          url_context?: Json | null
        }
        Update: {
          accepting_responses?: boolean | null
          app_type?: string
          config?: Json
          created_at?: string
          document_context?: Json | null
          folder_id?: string | null
          id?: string
          is_starred?: boolean | null
          share_code?: string
          teacher_id?: string
          theme?: string | null
          title?: string
          updated_at?: string
          url_context?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "apps_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apps_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      blog_comments: {
        Row: {
          author_email: string | null
          author_id: string | null
          author_name: string
          content: string
          created_at: string | null
          id: string
          parent_id: string | null
          post_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          author_email?: string | null
          author_id?: string | null
          author_name: string
          content: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          post_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          author_email?: string | null
          author_id?: string | null
          author_name?: string
          content?: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          post_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "blog_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_media: {
        Row: {
          alt_text: string | null
          caption: string | null
          created_at: string | null
          file_path: string
          file_size: number | null
          filename: string
          id: string
          mime_type: string | null
          uploaded_by: string
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string | null
          file_path: string
          file_size?: number | null
          filename: string
          id?: string
          mime_type?: string | null
          uploaded_by: string
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string | null
          file_path?: string
          file_size?: number | null
          filename?: string
          id?: string
          mime_type?: string | null
          uploaded_by?: string
        }
        Relationships: []
      }
      blog_post_tags: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "blog_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_avatar: string | null
          author_bio: string | null
          author_id: string
          author_name: string | null
          category_id: string | null
          content: string
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          id: string
          meta_description: string | null
          meta_keywords: string | null
          meta_title: string | null
          published_at: string | null
          reading_time: number | null
          scheduled_at: string | null
          slug: string
          status: string
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          author_avatar?: string | null
          author_bio?: string | null
          author_id: string
          author_name?: string | null
          category_id?: string | null
          content: string
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          published_at?: string | null
          reading_time?: number | null
          scheduled_at?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          author_avatar?: string | null
          author_bio?: string | null
          author_id?: string
          author_name?: string | null
          category_id?: string | null
          content?: string
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          published_at?: string | null
          reading_time?: number | null
          scheduled_at?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          answered_with: string | null
          app_id: string | null
          attachment_href: string | null
          attachment_kind: string | null
          attachment_label: string | null
          attachment_sublabel: string | null
          content: string
          created_at: string
          id: string
          option_mode: string | null
          options: Json | null
          role: string
          user_id: string
        }
        Insert: {
          answered_with?: string | null
          app_id?: string | null
          attachment_href?: string | null
          attachment_kind?: string | null
          attachment_label?: string | null
          attachment_sublabel?: string | null
          content: string
          created_at?: string
          id?: string
          option_mode?: string | null
          options?: Json | null
          role: string
          user_id: string
        }
        Update: {
          answered_with?: string | null
          app_id?: string | null
          attachment_href?: string | null
          attachment_kind?: string | null
          attachment_label?: string | null
          attachment_sublabel?: string | null
          content?: string
          created_at?: string
          id?: string
          option_mode?: string | null
          options?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_charges: {
        Row: {
          created_at: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          message_id?: string
          user_id?: string
        }
        Relationships: []
      }
      folders: {
        Row: {
          color: string
          created_at: string
          display_order: number
          icon: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          display_order?: number
          icon?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          display_order?: number
          icon?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      landing_feature_images: {
        Row: {
          created_at: string
          feature_index: number
          id: string
          image_url: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          feature_index: number
          id?: string
          image_url: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          feature_index?: number
          id?: string
          image_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      plan_features: {
        Row: {
          created_at: string | null
          display_name: string | null
          feature_key: string
          feature_type: string
          feature_value: string
          id: string
          plan_id: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          feature_key: string
          feature_type: string
          feature_value: string
          id?: string
          plan_id: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          feature_key?: string
          feature_type?: string
          feature_value?: string
          id?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_features_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_pricing_features: {
        Row: {
          created_at: string | null
          display_order: number
          feature_text: string
          id: string
          is_highlighted: boolean | null
          plan_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number
          feature_text: string
          id?: string
          is_highlighted?: boolean | null
          plan_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number
          feature_text?: string
          id?: string
          is_highlighted?: boolean | null
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_pricing_features_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          has_completed_onboarding: boolean | null
          id: string
          last_notification_read_at: string | null
          last_seen: string | null
          onboarding_completed_at: string | null
          onboarding_step: string | null
          updated_at: string
          welcomed_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          has_completed_onboarding?: boolean | null
          id: string
          last_notification_read_at?: string | null
          last_seen?: string | null
          onboarding_completed_at?: string | null
          onboarding_step?: string | null
          updated_at?: string
          welcomed_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          has_completed_onboarding?: boolean | null
          id?: string
          last_notification_read_at?: string | null
          last_seen?: string | null
          onboarding_completed_at?: string | null
          onboarding_step?: string | null
          updated_at?: string
          welcomed_at?: string | null
        }
        Relationships: []
      }
      promotions: {
        Row: {
          code: string | null
          created_at: string
          description: string
          discount: string | null
          display_locations: string[]
          expiry_date: string | null
          id: string
          is_active: boolean
          theme_color: string
          title: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          description: string
          discount?: string | null
          display_locations?: string[]
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          theme_color?: string
          title: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string
          discount?: string | null
          display_locations?: string[]
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          theme_color?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      student_responses: {
        Row: {
          answered_at: string
          correct_answer: string | null
          hint_used: boolean | null
          id: string
          is_correct: boolean | null
          question_index: number
          question_text: string
          session_id: string
          student_answer: string
          time_spent_seconds: number | null
        }
        Insert: {
          answered_at?: string
          correct_answer?: string | null
          hint_used?: boolean | null
          id?: string
          is_correct?: boolean | null
          question_index: number
          question_text: string
          session_id: string
          student_answer: string
          time_spent_seconds?: number | null
        }
        Update: {
          answered_at?: string
          correct_answer?: string | null
          hint_used?: boolean | null
          id?: string
          is_correct?: boolean | null
          question_index?: number
          question_text?: string
          session_id?: string
          student_answer?: string
          time_spent_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "student_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      student_sessions: {
        Row: {
          app_id: string
          completed_at: string | null
          created_at: string
          id: string
          score: number | null
          started_at: string
          student_name: string
          total_questions: number
        }
        Insert: {
          app_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          score?: number | null
          started_at?: string
          student_name: string
          total_questions: number
        }
        Update: {
          app_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          score?: number | null
          started_at?: string
          student_name?: string
          total_questions?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_sessions_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          billing_type: string
          created_at: string | null
          credits_amount: number | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          is_free_tier: boolean | null
          last_stripe_sync: string | null
          metadata: Json | null
          name: string
          price_monthly: number | null
          price_one_time: number | null
          price_yearly: number | null
          show_on_landing: boolean | null
          stripe_import_source: string | null
          stripe_price_id_monthly: string | null
          stripe_price_id_one_time: string | null
          stripe_price_id_yearly: string | null
          stripe_product_id: string | null
          updated_at: string | null
        }
        Insert: {
          billing_type?: string
          created_at?: string | null
          credits_amount?: number | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_free_tier?: boolean | null
          last_stripe_sync?: string | null
          metadata?: Json | null
          name: string
          price_monthly?: number | null
          price_one_time?: number | null
          price_yearly?: number | null
          show_on_landing?: boolean | null
          stripe_import_source?: string | null
          stripe_price_id_monthly?: string | null
          stripe_price_id_one_time?: string | null
          stripe_price_id_yearly?: string | null
          stripe_product_id?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_type?: string
          created_at?: string | null
          credits_amount?: number | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_free_tier?: boolean | null
          last_stripe_sync?: string | null
          metadata?: Json | null
          name?: string
          price_monthly?: number | null
          price_one_time?: number | null
          price_yearly?: number | null
          show_on_landing?: boolean | null
          stripe_import_source?: string | null
          stripe_price_id_monthly?: string | null
          stripe_price_id_one_time?: string | null
          stripe_price_id_yearly?: string | null
          stripe_product_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          ai_generations_used: number | null
          apps_created: number | null
          created_at: string | null
          credits: number | null
          id: string
          last_reset_date: string | null
          monthly_plays: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_generations_used?: number | null
          apps_created?: number | null
          created_at?: string | null
          credits?: number | null
          id?: string
          last_reset_date?: string | null
          monthly_plays?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_generations_used?: number | null
          apps_created?: number | null
          created_at?: string | null
          credits?: number | null
          id?: string
          last_reset_date?: string | null
          monthly_plays?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          billing_interval: string | null
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          is_trial: boolean | null
          plan_id: string
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_interval?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          is_trial?: boolean | null
          plan_id: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_interval?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          is_trial?: boolean | null
          plan_id?: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_reading_time: {
        Args: { content_html: string }
        Returns: number
      }
      can_create_app: { Args: { _user_id: string }; Returns: boolean }
      deduct_credit: { Args: { _user_id: string }; Returns: boolean }
      get_user_credits: { Args: { _user_id: string }; Returns: number }
      get_user_feature_limit: {
        Args: { _feature_key: string; _user_id: string }
        Returns: string
      }
      get_user_storage_bytes: { Args: { _user_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
