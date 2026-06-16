export const VIDEO_CATEGORY_VALUES = ["SERVICE", "REVERS", "COUP_DROIT"] as const;
export type VideoCategory = (typeof VIDEO_CATEGORY_VALUES)[number];

export const VIDEO_LEVEL_VALUES = ["DEBUTANT", "INTERMEDIAIRE", "CONFIRME"] as const;
export type VideoLevel = (typeof VIDEO_LEVEL_VALUES)[number];

export const VIDEO_LEVEL_LABELS: Record<VideoLevel, string> = {
  DEBUTANT: "Debutant",
  INTERMEDIAIRE: "Intermediaire",
  CONFIRME: "Confirme"
};

export function toLevelLabel(level: string) {
  return VIDEO_LEVEL_LABELS[level as VideoLevel] ?? level;
}
