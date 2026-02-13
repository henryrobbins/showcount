import type { RatingSystemConfig } from './rating';

export interface Database {
  public: {
    Tables: {
      central_shows: {
        Row: {
          id: string;
          show_id: string;
          date: string;
          artist: string;
          venue_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          show_id: string;
          date: string;
          artist: string;
          venue_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          show_id?: string;
          date?: string;
          artist?: string;
          venue_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_shows: {
        Row: {
          id: string;
          clerk_user_id: string;
          show_ids: string[];
          notes: string | null;
          rating: string | null;
          created_at: string;
          updated_at: string;
          // Legacy columns (kept for backward compatibility during migration)
          date: string | null;
          artists: string[] | null;
          venue: string | null;
          city: string | null;
          state: string | null;
          country: string | null;
          venue_id: string | null;
        };
        Insert: {
          id?: string;
          clerk_user_id: string;
          show_ids: string[];
          notes?: string | null;
          rating?: string | null;
          created_at?: string;
          updated_at?: string;
          // Legacy columns
          date?: string | null;
          artists?: string[] | null;
          venue?: string | null;
          city?: string | null;
          state?: string | null;
          country?: string | null;
          venue_id?: string | null;
        };
        Update: {
          id?: string;
          clerk_user_id?: string;
          show_ids?: string[];
          notes?: string | null;
          rating?: string | null;
          created_at?: string;
          updated_at?: string;
          // Legacy columns
          date?: string | null;
          artists?: string[] | null;
          venue?: string | null;
          city?: string | null;
          state?: string | null;
          country?: string | null;
          venue_id?: string | null;
        };
      };
      // Legacy alias for backward compatibility
      shows: {
        Row: Database['public']['Tables']['user_shows']['Row'];
        Insert: Database['public']['Tables']['user_shows']['Insert'];
        Update: Database['public']['Tables']['user_shows']['Update'];
      };
      venues: {
        Row: {
          id: string;
          name: string;
          city: string | null;
          state: string | null;
          country: string;
          latitude: number | null;
          longitude: number | null;
          osm_place_id: string | null;
          osm_display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          city?: string | null;
          state?: string | null;
          country: string;
          latitude?: number | null;
          longitude?: number | null;
          osm_place_id?: string | null;
          osm_display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          city?: string | null;
          state?: string | null;
          country?: string;
          latitude?: number | null;
          longitude?: number | null;
          osm_place_id?: string | null;
          osm_display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          clerk_user_id: string;
          caption: string | null;
          city: string | null;
          show_email: boolean;
          song_chasing: string | null;
          band_chasing: string | null;
          favorite_show: string | null;
          favorite_venue: string | null;
          cashortrade_username: string | null;
          instagram_username: string | null;
          x_username: string | null;
          facebook_username: string | null;
          ratings_enabled: boolean;
          rating_system_type:
            | 'ordered_list'
            | 'numeric_range'
            | 'numeric_unbounded'
            | null;
          rating_system_config: RatingSystemConfig | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clerk_user_id: string;
          caption?: string | null;
          city?: string | null;
          show_email?: boolean;
          song_chasing?: string | null;
          band_chasing?: string | null;
          favorite_show?: string | null;
          favorite_venue?: string | null;
          cashortrade_username?: string | null;
          instagram_username?: string | null;
          x_username?: string | null;
          facebook_username?: string | null;
          ratings_enabled?: boolean;
          rating_system_type?:
            | 'ordered_list'
            | 'numeric_range'
            | 'numeric_unbounded'
            | null;
          rating_system_config?: RatingSystemConfig | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clerk_user_id?: string;
          caption?: string | null;
          city?: string | null;
          show_email?: boolean;
          song_chasing?: string | null;
          band_chasing?: string | null;
          favorite_show?: string | null;
          favorite_venue?: string | null;
          cashortrade_username?: string | null;
          instagram_username?: string | null;
          x_username?: string | null;
          facebook_username?: string | null;
          ratings_enabled?: boolean;
          rating_system_type?:
            | 'ordered_list'
            | 'numeric_range'
            | 'numeric_unbounded'
            | null;
          rating_system_config?: RatingSystemConfig | null;
          updated_at?: string;
        };
      };
    };
  };
}
