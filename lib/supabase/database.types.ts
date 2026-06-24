export type SportType = "KBO" | "MLB" | "NPB";
export type PickOutcome = "home" | "away";

export type DbUser = {
  id: string;
  uid: string;
  nickname: string;
  created_at: string;
};

export type DbGame = {
  id: string;
  sport: SportType;
  home_team: string;
  away_team: string;
  scheduled_at: string;
  result: PickOutcome | null;
  result_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DbPrediction = {
  id: string;
  user_id: string;
  game_id: string;
  pick: PickOutcome;
  submitted_at: string;
  created_at: string;
  updated_at: string;
};

export type DbRankingRow = {
  user_id: string;
  nickname: string;
  total_games: number;
  participated: number;
  hits: number;
  misses: number;
  non_participation: number;
  ranking_score: number;
};

export type DbGameOpinionRow = {
  game_id: string;
  total_predictions: number;
  home_count: number;
  away_count: number;
  home_percent: number;
  away_percent: number;
};

export type Database = {
  public: {
    Tables: {
      users: {
        Row: DbUser;
        Insert: {
          id?: string;
          uid: string;
          nickname: string;
          created_at?: string;
        };
        Update: {
          uid?: string;
          nickname?: string;
        };
        Relationships: [];
      };
      games: {
        Row: DbGame;
        Insert: {
          id?: string;
          sport: SportType;
          home_team: string;
          away_team: string;
          scheduled_at: string;
          result?: PickOutcome | null;
          result_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          sport?: SportType;
          home_team?: string;
          away_team?: string;
          scheduled_at?: string;
          result?: PickOutcome | null;
          result_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      predictions: {
        Row: DbPrediction;
        Insert: {
          id?: string;
          user_id: string;
          game_id: string;
          pick: PickOutcome;
          submitted_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          pick?: PickOutcome;
          submitted_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "predictions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "predictions_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      ranking_view: {
        Row: DbRankingRow;
        Relationships: [];
      };
      game_opinion_view: {
        Row: DbGameOpinionRow;
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: {
      sport_type: SportType;
      pick_outcome: PickOutcome;
    };
    CompositeTypes: Record<string, never>;
  };
};
