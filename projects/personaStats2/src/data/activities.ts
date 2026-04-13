import type { Activity } from "@/lib/models";

export const ACTIVITIES: readonly Activity[] = [
  {
    id: "read-light",
    name: "Light reading",
    statCategory: "Knowledge",
    difficultyMultiplier: 1.0,
  },
  {
    id: "deep-study",
    name: "Deep study session",
    statCategory: "Knowledge",
    difficultyMultiplier: 2.0,
  },
  {
    id: "exam-prep",
    name: "Exam cram",
    statCategory: "Knowledge",
    difficultyMultiplier: 3.0,
  },
  {
    id: "walk",
    name: "Easy walk",
    statCategory: "Guts",
    difficultyMultiplier: 1.0,
  },
  {
    id: "cold-shower",
    name: "Cold exposure",
    statCategory: "Guts",
    difficultyMultiplier: 1.5,
  },
  {
    id: "public-speak",
    name: "Speak up in public",
    statCategory: "Guts",
    difficultyMultiplier: 3.0,
  },
  {
    id: "chores",
    name: "Household chores",
    statCategory: "Proficiency",
    difficultyMultiplier: 1.0,
  },
  {
    id: "skill-drill",
    name: "Skill drill",
    statCategory: "Proficiency",
    difficultyMultiplier: 2.0,
  },
  {
    id: "deep-work",
    name: "Deep work block",
    statCategory: "Proficiency",
    difficultyMultiplier: 2.0,
  },
  {
    id: "listen",
    name: "Active listening",
    statCategory: "Kindness",
    difficultyMultiplier: 1.0,
  },
  {
    id: "help-out",
    name: "Help someone out",
    statCategory: "Kindness",
    difficultyMultiplier: 2.0,
  },
  {
    id: "volunteer",
    name: "Volunteer time",
    statCategory: "Kindness",
    difficultyMultiplier: 3.0,
  },
  {
    id: "small-talk",
    name: "Social warm-up",
    statCategory: "Charm",
    difficultyMultiplier: 1.0,
  },
  {
    id: "network",
    name: "Network / pitch",
    statCategory: "Charm",
    difficultyMultiplier: 2.0,
  },
  {
    id: "performance",
    name: "Perform or present",
    statCategory: "Charm",
    difficultyMultiplier: 3.0,
  },
];

export function findActivityById(id: string): Activity | undefined {
  return ACTIVITIES.find((a) => a.id === id);
}
