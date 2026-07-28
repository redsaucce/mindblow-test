export interface StoryIntro {
  title: string;
  preview: string;
  previewSecondary: string;
  detail: string;
}

export interface AboutInfoCard {
  title: string;
  description: string;
}

export const aboutHero = {
  title: "Building the Future of ",
  highlight: "Smart Learning",
  subtitle:
    "MindBlow started with a simple question — what if you could turn any document into an interactive quiz in seconds?",
} as const;

export const aboutMedia = {
  placeholderLabel: "Team photo coming soon",
  placeholderLocation: "Bayombong, Nueva Vizcaya",
} as const;

export const storyToggleLabels = {
  more: "Read more",
  less: "Read less",
} as const;

export const storyIntro: StoryIntro = {
  title: "How It All Started",
  preview:
    "MindBlow started with a simple student problem: turning dense notes into useful quiz practice without wasting study time.",
  previewSecondary:
    "Built for college and undergraduate students, it helps turn uploaded study files into focused quiz material without the manual work.",
  detail:
    "At its core, MindBlow is built to make exam prep faster, clearer, and more accessible through AI-powered quiz generation.",
};

export const aboutInfoCards: AboutInfoCard[] = [
  {
    title: "What Drives Us",
    description:
      "We believe everyone deserves access to smart study tools — not just those who can afford expensive tutors or prep courses. Education should be a level playing field. Our mission is to democratize active learning by giving students, teachers, and self-learners a free AI-powered tool that turns any document into a personalized quiz in seconds.",
  },
  {
    title: "Where We're Headed",
    description:
      "MindBlow is just getting started. We're building the future of document-powered learning, one quiz at a time. Our roadmap includes collaborative study rooms, spaced-repetition scheduling, LMS integrations for schools and universities, and deeper analytics to help learners pinpoint exactly where they need to focus.",
  },
];