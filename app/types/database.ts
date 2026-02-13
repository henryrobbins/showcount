export interface Database {
  public: {
    Tables: {
      shows: {
        Row: {
          id: string;
          clerk_user_id: string;
          date: string;
          artists: string[];
          venue: string | null;
          city: string | null;
          state: string | null;
          country: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clerk_user_id: string;
          date: string;
          artists: string[];
          venue?: string | null;
          city?: string | null;
          state?: string | null;
          country?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clerk_user_id?: string;
          date?: string;
          artists?: string[];
          venue?: string | null;
          city?: string | null;
          state?: string | null;
          country?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
