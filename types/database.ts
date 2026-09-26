/**
 * Hand-written subset of the schema so the app compiles without a live
 * Supabase project. Once you have real credentials, replace this file with:
 *
 *   supabase gen types typescript --project-id YOUR_PROJECT_REF > types/database.ts
 */
export type Database = {
  public: {
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: "farmer" | "veterinarian" | "admin";
          full_name: string;
          phone: string | null;
          email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string; full_name: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      farms: {
        Row: {
          id: string;
          owner_id: string;
          farm_name: string;
          county: string | null;
          sub_county: string | null;
          location: string | null;
          livestock_kept: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["farms"]["Row"]> & { owner_id: string; farm_name: string };
        Update: Partial<Database["public"]["Tables"]["farms"]["Row"]>;
        Relationships: [];
      };
      animals: {
        Row: {
          id: string;
          farm_id: string;
          tag_number: string;
          name: string | null;
          species: "cattle" | "sheep" | "goat" | "pig" | "poultry" | "other";
          breed: string | null;
          sex: "male" | "female";
          date_of_birth: string | null;
          estimated_age_months: number | null;
          color_markings: string | null;
          weight_kg: number | null;
          body_condition_score: number | null;
          identification_notes: string | null;
          photo_url: string | null;
          health_status: "healthy" | "under_treatment" | "sick" | "deceased" | "sold";
          existing_conditions: string | null;
          allergies: string | null;
          special_notes: string | null;
          heat_cycle_days: number | null;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["animals"]["Row"]> & {
          farm_id: string;
          tag_number: string;
          species: Database["public"]["Tables"]["animals"]["Row"]["species"];
          sex: Database["public"]["Tables"]["animals"]["Row"]["sex"];
        };
        Update: Partial<Database["public"]["Tables"]["animals"]["Row"]>;
        Relationships: [];
      };
      breeding_records: {
        Row: {
          id: string;
          animal_id: string;
          heat_date: string | null;
          service_date: string | null;
          breeding_method: string | null;
          sire_id: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["breeding_records"]["Row"]> & { animal_id: string };
        Update: Partial<Database["public"]["Tables"]["breeding_records"]["Row"]>;
        Relationships: [];
      };
      reminders: {
        Row: {
          id: string;
          farm_id: string;
          animal_id: string | null;
          type: string;
          title: string;
          due_date: string;
          priority: "low" | "medium" | "high";
          status: "upcoming" | "completed" | "overdue" | "dismissed";
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["reminders"]["Row"]> & {
          farm_id: string;
          type: string;
          title: string;
          due_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["reminders"]["Row"]>;
        Relationships: [];
      };
    };
  };
};
