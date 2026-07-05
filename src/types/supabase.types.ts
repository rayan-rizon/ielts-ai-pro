export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      achievements: {
        Row: {
          badge_color: string | null
          category: string | null
          created_at: string | null
          criteria: Json | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          points: number | null
          updated_at: string | null
        }
        Insert: {
          badge_color?: string | null
          category?: string | null
          created_at?: string | null
          criteria?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          points?: number | null
          updated_at?: string | null
        }
        Update: {
          badge_color?: string | null
          category?: string | null
          created_at?: string | null
          criteria?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          points?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_api_usage: {
        Row: {
          cached: boolean | null
          created_at: string
          endpoint: string
          id: string
          request_metadata: Json | null
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          cached?: boolean | null
          created_at?: string
          endpoint: string
          id?: string
          request_metadata?: Json | null
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          cached?: boolean | null
          created_at?: string
          endpoint?: string
          id?: string
          request_metadata?: Json | null
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_api_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_feedback_cache: {
        Row: {
          created_at: string
          expires_at: string
          feedback_json: Json
          id: string
          input_hash: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          feedback_json: Json
          id?: string
          input_hash: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          feedback_json?: Json
          id?: string
          input_hash?: string
        }
        Relationships: []
      }
      analytics_data: {
        Row: {
          data_type: string
          id: string
          recorded_at: string | null
          user_id: string | null
          value: Json | null
        }
        Insert: {
          data_type: string
          id?: string
          recorded_at?: string | null
          user_id?: string | null
          value?: Json | null
        }
        Update: {
          data_type?: string
          id?: string
          recorded_at?: string | null
          user_id?: string | null
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_data_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_history: {
        Row: {
          amount: number
          auth_id: string | null
          billing_interval: string | null
          created_at: string | null
          currency: string
          id: string
          payment_method: string
          status: string
          stripe_invoice_id: string | null
          tier: string
          transaction_id: string
          user_id: string | null
        }
        Insert: {
          amount: number
          auth_id?: string | null
          billing_interval?: string | null
          created_at?: string | null
          currency: string
          id?: string
          payment_method: string
          status: string
          stripe_invoice_id?: string | null
          tier: string
          transaction_id: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          auth_id?: string | null
          billing_interval?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          payment_method?: string
          status?: string
          stripe_invoice_id?: string | null
          tier?: string
          transaction_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_history_auth_id_fkey"
            columns: ["auth_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["auth_id"]
          },
          {
            foreignKeyName: "billing_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_history: {
        Row: {
          consent_type: string
          consent_version: string
          consented: boolean
          created_at: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          consent_type: string
          consent_version: string
          consented: boolean
          created_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          consent_type?: string
          consent_version?: string
          consented?: boolean
          created_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_focus: {
        Row: {
          ai_reason: string | null
          completed_at: string | null
          created_at: string | null
          focus_date: string
          id: string
          is_completed: boolean | null
          primary_activity_id: string | null
          primary_module: string | null
          primary_skill: string | null
          user_id: string
        }
        Insert: {
          ai_reason?: string | null
          completed_at?: string | null
          created_at?: string | null
          focus_date?: string
          id?: string
          is_completed?: boolean | null
          primary_activity_id?: string | null
          primary_module?: string | null
          primary_skill?: string | null
          user_id: string
        }
        Update: {
          ai_reason?: string | null
          completed_at?: string | null
          created_at?: string | null
          focus_date?: string
          id?: string
          is_completed?: boolean | null
          primary_activity_id?: string | null
          primary_module?: string | null
          primary_skill?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_focus_primary_activity_id_fkey"
            columns: ["primary_activity_id"]
            isOneToOne: false
            referencedRelation: "learning_path_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_focus_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_path_activities: {
        Row: {
          activity_key: string
          activity_type: string
          completed_at: string | null
          created_at: string | null
          description: string | null
          estimated_minutes: number | null
          id: string
          is_completed: boolean | null
          learning_path_id: string | null
          module: string | null
          outcome_data: Json | null
          outcome_score: number | null
          priority: string | null
          scheduled_date: string | null
          scheduled_day: string | null
          skill_targets: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activity_key: string
          activity_type: string
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          is_completed?: boolean | null
          learning_path_id?: string | null
          module?: string | null
          outcome_data?: Json | null
          outcome_score?: number | null
          priority?: string | null
          scheduled_date?: string | null
          scheduled_day?: string | null
          skill_targets?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activity_key?: string
          activity_type?: string
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          is_completed?: boolean | null
          learning_path_id?: string | null
          module?: string | null
          outcome_data?: Json | null
          outcome_score?: number | null
          priority?: string | null
          scheduled_date?: string | null
          scheduled_day?: string | null
          skill_targets?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_path_activities_learning_path_id_fkey"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_path_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_paths: {
        Row: {
          activities_completed: Json | null
          created_at: string | null
          id: string
          path_data: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          activities_completed?: Json | null
          created_at?: string | null
          id?: string
          path_data?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          activities_completed?: Json | null
          created_at?: string | null
          id?: string
          path_data?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_paths_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          created_at: string | null
          file_type: string | null
          id: string
          migration_status: string | null
          original_url: string
          r2_key: string | null
          r2_url: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          file_type?: string | null
          id?: string
          migration_status?: string | null
          original_url: string
          r2_key?: string | null
          r2_url?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          file_type?: string | null
          id?: string
          migration_status?: string | null
          original_url?: string
          r2_key?: string | null
          r2_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          message: string
          target_audience: string | null
          title: string
          type: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          target_audience?: string | null
          title: string
          type?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          target_audience?: string | null
          title?: string
          type?: string | null
        }
        Relationships: []
      }
      passages: {
        Row: {
          access_tier: string
          audio_url: string | null
          cambridge_test_number: number | null
          cambridge_title: string | null
          cambridge_year: number | null
          content: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean
          is_official_cambridge: boolean
          task_type: string | null
          test_format: string
          test_type: string
          title: string
          topic: string
          total_questions: number | null
          transcript: string | null
          updated_at: string | null
        }
        Insert: {
          access_tier?: string
          audio_url?: string | null
          cambridge_test_number?: number | null
          cambridge_title?: string | null
          cambridge_year?: number | null
          content?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          is_official_cambridge?: boolean
          task_type?: string | null
          test_format: string
          test_type: string
          title: string
          topic: string
          total_questions?: number | null
          transcript?: string | null
          updated_at?: string | null
        }
        Update: {
          access_tier?: string
          audio_url?: string | null
          cambridge_test_number?: number | null
          cambridge_title?: string | null
          cambridge_year?: number | null
          content?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          is_official_cambridge?: boolean
          task_type?: string | null
          test_format?: string
          test_type?: string
          title?: string
          topic?: string
          total_questions?: number | null
          transcript?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          auth_id: string | null
          created_at: string | null
          currency: string | null
          id: string
          interval: string
          payment_method: string
          sender_phone: string
          status: string | null
          tier: string
          transaction_id: string
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          auth_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          interval: string
          payment_method: string
          sender_phone: string
          status?: string | null
          tier: string
          transaction_id: string
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          auth_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          interval?: string
          payment_method?: string
          sender_phone?: string
          status?: string | null
          tier?: string
          transaction_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_requests_auth_id_fkey"
            columns: ["auth_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["auth_id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          applicable_plans: string[] | null
          code: string
          created_at: string | null
          current_uses: number | null
          discount: number | null
          discount_type: string | null
          discount_value: number | null
          grants_subscription: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          subscription_duration_days: number | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          applicable_plans?: string[] | null
          code: string
          created_at?: string | null
          current_uses?: number | null
          discount?: number | null
          discount_type?: string | null
          discount_value?: number | null
          grants_subscription?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          subscription_duration_days?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          applicable_plans?: string[] | null
          code?: string
          created_at?: string | null
          current_uses?: number | null
          discount?: number | null
          discount_type?: string | null
          discount_value?: number | null
          grants_subscription?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          subscription_duration_days?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          allow_multiple: boolean | null
          correct_answer: string | null
          created_at: string | null
          duration_minutes: number | null
          explanation: string | null
          explanation_data: Json | null
          flowchart: Json | null
          gap_fill: Json | null
          group_instructions: string | null
          id: string
          map_labeling: Json | null
          matching_data: Json | null
          matching_features: Json | null
          mcq_title: string | null
          options: Json | null
          part_number: number | null
          passage_id: string | null
          question_count: number | null
          question_number: number | null
          question_text: string
          section: number | null
          static_text: Json | null
          table_data: Json | null
          type: string
          updated_at: string | null
        }
        Insert: {
          allow_multiple?: boolean | null
          correct_answer?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          explanation?: string | null
          explanation_data?: Json | null
          flowchart?: Json | null
          gap_fill?: Json | null
          group_instructions?: string | null
          id?: string
          map_labeling?: Json | null
          matching_data?: Json | null
          matching_features?: Json | null
          mcq_title?: string | null
          options?: Json | null
          part_number?: number | null
          passage_id?: string | null
          question_count?: number | null
          question_number?: number | null
          question_text: string
          section?: number | null
          static_text?: Json | null
          table_data?: Json | null
          type: string
          updated_at?: string | null
        }
        Update: {
          allow_multiple?: boolean | null
          correct_answer?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          explanation?: string | null
          explanation_data?: Json | null
          flowchart?: Json | null
          gap_fill?: Json | null
          group_instructions?: string | null
          id?: string
          map_labeling?: Json | null
          matching_data?: Json | null
          matching_features?: Json | null
          mcq_title?: string | null
          options?: Json | null
          part_number?: number | null
          passage_id?: string | null
          question_count?: number | null
          question_number?: number | null
          question_text?: string
          section?: number | null
          static_text?: Json | null
          table_data?: Json | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_passage_id_fkey"
            columns: ["passage_id"]
            isOneToOne: false
            referencedRelation: "passages"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_reward_tiers: {
        Row: {
          created_at: string | null
          extra_days: number | null
          id: string
          is_active: boolean | null
          referrals_required: number
          speaking_credits: number | null
          updated_at: string | null
          updated_by: string | null
          writing_credits: number | null
        }
        Insert: {
          created_at?: string | null
          extra_days?: number | null
          id?: string
          is_active?: boolean | null
          referrals_required: number
          speaking_credits?: number | null
          updated_at?: string | null
          updated_by?: string | null
          writing_credits?: number | null
        }
        Update: {
          created_at?: string | null
          extra_days?: number | null
          id?: string
          is_active?: boolean | null
          referrals_required?: number
          speaking_credits?: number | null
          updated_at?: string | null
          updated_by?: string | null
          writing_credits?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_reward_tiers_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          access_tier: string | null
          content: string | null
          content_type: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_published: boolean | null
          seo_tags: string[] | null
          slug: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          url: string
          view_count: number | null
        }
        Insert: {
          access_tier?: string | null
          content?: string | null
          content_type: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          seo_tags?: string[] | null
          slug?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          url: string
          view_count?: number | null
        }
        Update: {
          access_tier?: string | null
          content?: string | null
          content_type?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          seo_tags?: string[] | null
          slug?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          url?: string
          view_count?: number | null
        }
        Relationships: []
      }
      skill_proficiency: {
        Row: {
          confidence_level: number | null
          correct_count: number | null
          created_at: string | null
          id: string
          last_practiced_at: string | null
          mastery_probability: number | null
          module: string
          next_review_at: string | null
          practice_count: number | null
          skill_code: string
          streak_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          confidence_level?: number | null
          correct_count?: number | null
          created_at?: string | null
          id?: string
          last_practiced_at?: string | null
          mastery_probability?: number | null
          module: string
          next_review_at?: string | null
          practice_count?: number | null
          skill_code: string
          streak_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          confidence_level?: number | null
          correct_count?: number | null
          created_at?: string | null
          id?: string
          last_practiced_at?: string | null
          mastery_probability?: number | null
          module?: string
          next_review_at?: string | null
          practice_count?: number | null
          skill_code?: string
          streak_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_proficiency_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_events: {
        Row: {
          error_message: string | null
          id: string
          metadata: Json | null
          processed_at: string | null
          status: string | null
          type: string
        }
        Insert: {
          error_message?: string | null
          id: string
          metadata?: Json | null
          processed_at?: string | null
          status?: string | null
          type: string
        }
        Update: {
          error_message?: string | null
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          status?: string | null
          type?: string
        }
        Relationships: []
      }
      system_health_logs: {
        Row: {
          component: string
          created_at: string | null
          id: string
          level: string
          message: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          component: string
          created_at?: string | null
          id?: string
          level: string
          message: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          component?: string
          created_at?: string | null
          id?: string
          level?: string
          message?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      test_sessions: {
        Row: {
          answers: Json | null
          band_score: number | null
          completed_at: string | null
          content_data: Json | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          is_completed: boolean | null
          module: string | null
          passage_id: string | null
          score: number | null
          started_at: string | null
          test_mode: string | null
          test_type: string
          updated_at: string | null
          user_id: string | null
          user_responses: Json | null
        }
        Insert: {
          answers?: Json | null
          band_score?: number | null
          completed_at?: string | null
          content_data?: Json | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          is_completed?: boolean | null
          module?: string | null
          passage_id?: string | null
          score?: number | null
          started_at?: string | null
          test_mode?: string | null
          test_type: string
          updated_at?: string | null
          user_id?: string | null
          user_responses?: Json | null
        }
        Update: {
          answers?: Json | null
          band_score?: number | null
          completed_at?: string | null
          content_data?: Json | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          is_completed?: boolean | null
          module?: string | null
          passage_id?: string | null
          score?: number | null
          started_at?: string | null
          test_mode?: string | null
          test_type?: string
          updated_at?: string | null
          user_id?: string | null
          user_responses?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "test_sessions_passage_id_fkey"
            columns: ["passage_id"]
            isOneToOne: false
            referencedRelation: "passages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tier_rate_limits: {
        Row: {
          burst_limit: number
          daily_limit: number
          id: string
          monthly_limit: number
          speaking_daily_limit: number
          speaking_monthly_limit: number
          tier: string
          updated_at: string
          updated_by: string | null
          writing_daily_limit: number
          writing_monthly_limit: number
        }
        Insert: {
          burst_limit?: number
          daily_limit?: number
          id?: string
          monthly_limit?: number
          speaking_daily_limit?: number
          speaking_monthly_limit?: number
          tier: string
          updated_at?: string
          updated_by?: string | null
          writing_daily_limit?: number
          writing_monthly_limit?: number
        }
        Update: {
          burst_limit?: number
          daily_limit?: number
          id?: string
          monthly_limit?: number
          speaking_daily_limit?: number
          speaking_monthly_limit?: number
          tier?: string
          updated_at?: string
          updated_by?: string | null
          writing_daily_limit?: number
          writing_monthly_limit?: number
        }
        Relationships: [
          {
            foreignKeyName: "tier_rate_limits_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string | null
          id: string
          unlocked_at: string | null
          user_id: string | null
        }
        Insert: {
          achievement_id?: string | null
          id?: string
          unlocked_at?: string | null
          user_id?: string | null
        }
        Update: {
          achievement_id?: string | null
          id?: string
          unlocked_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_points: {
        Row: {
          current_streak: number | null
          id: string
          last_activity_date: string | null
          level: number | null
          longest_streak: number | null
          points: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          level?: number | null
          longest_streak?: number | null
          points?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          level?: number | null
          longest_streak?: number | null
          points?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_referral_rewards: {
        Row: {
          claimed_at: string | null
          extra_days_granted: number | null
          id: string
          speaking_credits_granted: number | null
          tier_id: string
          user_id: string
          writing_credits_granted: number | null
        }
        Insert: {
          claimed_at?: string | null
          extra_days_granted?: number | null
          id?: string
          speaking_credits_granted?: number | null
          tier_id: string
          user_id: string
          writing_credits_granted?: number | null
        }
        Update: {
          claimed_at?: string | null
          extra_days_granted?: number | null
          id?: string
          speaking_credits_granted?: number | null
          tier_id?: string
          user_id?: string
          writing_credits_granted?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_referral_rewards_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "referral_reward_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_referral_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_referrals: {
        Row: {
          claimed_at: string | null
          created_at: string | null
          id: string
          referred_id: string
          referrer_id: string
          reward_claimed: boolean | null
        }
        Insert: {
          claimed_at?: string | null
          created_at?: string | null
          id?: string
          referred_id: string
          referrer_id: string
          reward_claimed?: boolean | null
        }
        Update: {
          claimed_at?: string | null
          created_at?: string | null
          id?: string
          referred_id?: string
          referrer_id?: string
          reward_claimed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "user_referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_id: string | null
          avatar_url: string | null
          billing_interval: string | null
          bonus_speaking_credits: number | null
          bonus_writing_credits: number | null
          cancel_at_period_end: boolean | null
          ccpa_do_not_sell: boolean | null
          ccpa_opted_out_at: string | null
          consent_analytics: boolean | null
          consent_functional: boolean | null
          consent_marketing: boolean | null
          consent_timestamp: string | null
          consent_version: string | null
          created_at: string | null
          current_estimated_band: number | null
          current_streak: number | null
          days_until_exam: number | null
          email: string
          exam_type: string | null
          full_name: string | null
          id: string
          last_active: string | null
          last_path_generated_at: string | null
          last_study_date: string | null
          last_support_request: Json | null
          longest_streak: number | null
          onboarding_completed: boolean | null
          preferred_study_time: string | null
          promo_discount: Json | null
          referral_bonus_expires_at: string | null
          referral_code: string | null
          referred_by: string | null
          role: string
          strengths: string[] | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          study_hours_goal: number | null
          study_streak_days: number | null
          subscription_amount: number | null
          subscription_currency: string | null
          subscription_end_date: string | null
          subscription_start_date: string | null
          subscription_tier: string
          target_band_score: number | null
          test_date: string | null
          total_study_time: number | null
          updated_at: string | null
          used_promo_codes: string[] | null
          weak_area: string | null
          weaknesses: string[] | null
        }
        Insert: {
          auth_id?: string | null
          avatar_url?: string | null
          billing_interval?: string | null
          bonus_speaking_credits?: number | null
          bonus_writing_credits?: number | null
          cancel_at_period_end?: boolean | null
          ccpa_do_not_sell?: boolean | null
          ccpa_opted_out_at?: string | null
          consent_analytics?: boolean | null
          consent_functional?: boolean | null
          consent_marketing?: boolean | null
          consent_timestamp?: string | null
          consent_version?: string | null
          created_at?: string | null
          current_estimated_band?: number | null
          current_streak?: number | null
          days_until_exam?: number | null
          email: string
          exam_type?: string | null
          full_name?: string | null
          id?: string
          last_active?: string | null
          last_path_generated_at?: string | null
          last_study_date?: string | null
          last_support_request?: Json | null
          longest_streak?: number | null
          onboarding_completed?: boolean | null
          preferred_study_time?: string | null
          promo_discount?: Json | null
          referral_bonus_expires_at?: string | null
          referral_code?: string | null
          referred_by?: string | null
          role?: string
          strengths?: string[] | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          study_hours_goal?: number | null
          study_streak_days?: number | null
          subscription_amount?: number | null
          subscription_currency?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_tier?: string
          target_band_score?: number | null
          test_date?: string | null
          total_study_time?: number | null
          updated_at?: string | null
          used_promo_codes?: string[] | null
          weak_area?: string | null
          weaknesses?: string[] | null
        }
        Update: {
          auth_id?: string | null
          avatar_url?: string | null
          billing_interval?: string | null
          bonus_speaking_credits?: number | null
          bonus_writing_credits?: number | null
          cancel_at_period_end?: boolean | null
          ccpa_do_not_sell?: boolean | null
          ccpa_opted_out_at?: string | null
          consent_analytics?: boolean | null
          consent_functional?: boolean | null
          consent_marketing?: boolean | null
          consent_timestamp?: string | null
          consent_version?: string | null
          created_at?: string | null
          current_estimated_band?: number | null
          current_streak?: number | null
          days_until_exam?: number | null
          email?: string
          exam_type?: string | null
          full_name?: string | null
          id?: string
          last_active?: string | null
          last_path_generated_at?: string | null
          last_study_date?: string | null
          last_support_request?: Json | null
          longest_streak?: number | null
          onboarding_completed?: boolean | null
          preferred_study_time?: string | null
          promo_discount?: Json | null
          referral_bonus_expires_at?: string | null
          referral_code?: string | null
          referred_by?: string | null
          role?: string
          strengths?: string[] | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          study_hours_goal?: number | null
          study_streak_days?: number | null
          subscription_amount?: number | null
          subscription_currency?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_tier?: string
          target_band_score?: number | null
          test_date?: string | null
          total_study_time?: number | null
          updated_at?: string | null
          used_promo_codes?: string[] | null
          weak_area?: string | null
          weaknesses?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "users_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      vocabulary_items: {
        Row: {
          created_at: string | null
          created_by: string | null
          definition: string | null
          ease_factor: number | null
          example: string | null
          id: string
          interval_days: number | null
          last_reviewed: string | null
          mastery_level: number | null
          next_review_date: string | null
          source: string | null
          synonyms: string[] | null
          times_reviewed: number | null
          updated_at: string | null
          user_id: string | null
          word: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          definition?: string | null
          ease_factor?: number | null
          example?: string | null
          id?: string
          interval_days?: number | null
          last_reviewed?: string | null
          mastery_level?: number | null
          next_review_date?: string | null
          source?: string | null
          synonyms?: string[] | null
          times_reviewed?: number | null
          updated_at?: string | null
          user_id?: string | null
          word: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          definition?: string | null
          ease_factor?: number | null
          example?: string | null
          id?: string
          interval_days?: number | null
          last_reviewed?: string | null
          mastery_level?: number | null
          next_review_date?: string | null
          source?: string | null
          synonyms?: string[] | null
          times_reviewed?: number | null
          updated_at?: string | null
          user_id?: string | null
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vocabulary_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_question_row_count: {
        Args: {
          p_allow_multiple: boolean
          p_flowchart: Json
          p_gap_fill: Json
          p_map_labeling: Json
          p_matching_data: Json
          p_matching_features: Json
          p_question_count: number
          p_question_number: number
          p_question_text: string
          p_table_data: Json
          p_type: string
        }
        Returns: number
      }
      calculate_total_questions: {
        Args: { content_json: Json }
        Returns: number
      }
      check_user_rate_limit: {
        Args: { p_tier: string; p_user_id: string }
        Returns: {
          allowed: boolean
          daily_remaining: number
          daily_used: number
          monthly_remaining: number
          monthly_used: number
        }[]
      }
      claim_referral_rewards: { Args: { p_user_id: string }; Returns: Json }
      clear_promo_discount: { Args: never; Returns: Json }
      count_inactive_users: {
        Args: { days_inactive?: number; subscription_filter?: string }
        Returns: number
      }
      create_admin_user_complete: { Args: never; Returns: undefined }
      debug_get_passages: {
        Args: never
        Returns: {
          id: string
          test_type: string
          title: string
        }[]
      }
      debug_question_count: {
        Args: { target_passage_id?: string }
        Returns: {
          passage_exists: boolean
          passage_questions: number
          total_questions: number
        }[]
      }
      delete_resource: { Args: { resource_id: string }; Returns: undefined }
      exec_sql: { Args: { sql: string }; Returns: undefined }
      export_user_data: { Args: never; Returns: Json }
      generate_referral_code: { Args: { p_user_id: string }; Returns: string }
      get_admin_dashboard_stats: { Args: never; Returns: Json }
      get_ai_usage_aggs: { Args: never; Returns: Json }
      get_ai_usage_stats_paginated: {
        Args: {
          p_page?: number
          p_page_size?: number
          p_sort_dir?: string
          p_sort_field?: string
        }
        Returns: Json
      }
      get_cambridge_tests: {
        Args: { p_limit?: number }
        Returns: {
          cambridge_test_number: number
          cambridge_year: number
          id: string
          test_type: string
          title: string
        }[]
      }
      get_daily_api_usage_stats: {
        Args: { p_start_date?: string }
        Returns: Json
      }
      get_dashboard_stats: { Args: { p_user_id: string }; Returns: Json }
      get_due_vocabulary: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          definition: string
          example: string
          id: string
          last_reviewed: string
          mastery_level: number
          next_review_date: string
          source: string
          word: string
        }[]
      }
      get_inactive_users: {
        Args: {
          days_inactive?: number
          page_limit?: number
          page_offset?: number
          subscription_filter?: string
        }
        Returns: {
          auth_id: string
          created_at: string
          email: string
          full_name: string
          id: string
          inactive_days: number
          last_active: string
          subscription_tier: string
        }[]
      }
      get_learning_path_data: { Args: never; Returns: Json }
      get_my_public_user_id: { Args: never; Returns: string }
      get_my_user_id: { Args: never; Returns: string }
      get_recent_sessions: {
        Args: { p_limit?: number }
        Returns: {
          completed_at: string
          duration_minutes: number
          id: string
          passage_id: string
          passage_title: string
          score: number
          test_type: string
        }[]
      }
      get_revenue_analytics: { Args: never; Returns: Json }
      get_system_stats: { Args: never; Returns: Json }
      get_test_taken_counts: {
        Args: { type_filter: string }
        Returns: {
          passage_id: string
          taken_count: number
        }[]
      }
      get_tier_rate_limits: {
        Args: { p_tier: string }
        Returns: {
          burst_limit: number
          daily_limit: number
          monthly_limit: number
          speaking_daily_limit: number
          speaking_monthly_limit: number
          writing_daily_limit: number
          writing_monthly_limit: number
        }[]
      }
      get_user_daily_usage: {
        Args: { p_endpoint?: string; p_user_id: string }
        Returns: number
      }
      get_user_latest_sessions: {
        Args: { p_test_type: string; p_user_id: string }
        Returns: {
          completed_at: string
          created_at: string
          is_completed: boolean
          passage_id: string
          progress_percentage: number
          score: number
          session_id: string
        }[]
      }
      get_user_monthly_usage: {
        Args: { p_endpoint?: string; p_user_id: string }
        Returns: number
      }
      get_user_referral_stats: { Args: { p_user_id: string }; Returns: Json }
      get_user_weak_skills: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          days_since_practice: number
          mastery_probability: number
          module: string
          practice_count: number
          priority_score: number
          skill_code: string
        }[]
      }
      get_vocabulary_stats: { Args: { p_user_id: string }; Returns: Json }
      get_writing_session_with_task: {
        Args: { p_session_id?: string; p_task_id?: string; p_user_id?: string }
        Returns: Json
      }
      handle_stripe_checkout_completed: {
        Args: {
          p_amount: number
          p_auth_id: string
          p_currency: string
          p_end_date: string
          p_event_id: string
          p_interval: string
          p_session_id: string
          p_subscription_id: string
          p_tier: string
          p_user_id: string
        }
        Returns: Json
      }
      handle_stripe_event: {
        Args: {
          p_amount: number
          p_auth_id: string
          p_currency: string
          p_end_date: string
          p_event_id: string
          p_event_type: string
          p_interval: string
          p_metadata?: Json
          p_subscription_id: string
          p_tier: string
          p_transaction_id: string
          p_user_id: string
        }
        Returns: Json
      }
      increment_resource_view: {
        Args: { resource_id: string }
        Returns: undefined
      }
      insert_question: {
        Args: {
          p_correct_answer?: string
          p_flowchart?: Json
          p_gap_fill?: Json
          p_group_instructions?: string
          p_map_labeling?: Json
          p_matching_features?: Json
          p_options?: Json
          p_passage_id: string
          p_question_number?: number
          p_question_text: string
          p_section?: number
          p_static_text?: Json
          p_table_data?: Json
          p_type: string
        }
        Returns: string
      }
      is_admin: { Args: never; Returns: boolean }
      is_current_user_admin: { Args: never; Returns: boolean }
      process_referral: {
        Args: { p_new_user_id: string; p_referral_code: string }
        Returns: Json
      }
      redeem_promo_code: { Args: { code_lookup: string }; Returns: Json }
      redeem_subscription_promo: { Args: { p_code: string }; Returns: Json }
      update_study_streak: {
        Args: { p_user_id: string }
        Returns: {
          current_streak: number
          longest_streak: number
        }[]
      }
      update_user_consent: {
        Args: {
          p_ccpa_do_not_sell?: boolean
          p_consent_analytics: boolean
          p_consent_functional: boolean
          p_consent_marketing: boolean
          p_ip_address?: string
          p_user_agent?: string
        }
        Returns: Json
      }
      update_user_last_active: {
        Args: { user_auth_id: string }
        Returns: undefined
      }
      upsert_user_profile: {
        Args: { p_auth_id: string; p_email: string; p_updates: Json }
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
    Enums: {},
  },
} as const

