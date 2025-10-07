
export interface KeyMoment {
  timestamp_description: string;
  event_summary: string;
}

export interface AnalysisResult {
  title: string;
  summary: string;
  key_topics: string[];
  key_moments: KeyMoment[];
}
