export interface SidebarLink {
  label: string;
  href: string;
}

export const sidebarLinks: Record<"user" | "admin", SidebarLink[]> = {
  user: [
    { label: "Generate Quiz", href: "/user" },
    { label: "My Quizzes", href: "/user/quizzes" },
  ],
  admin: [
    { label: "Overview", href: "/admin" },
    { label: "User Management", href: "/admin/users" },
    { label: "Activity Logs", href: "/admin/logs" },
    { label: "Prompt", href: "/admin/prompt" },
  ],
};

export const sidebarAccount = {
  brand: "MindBlow",
  userEmail: "student@mindblow.com",
  adminEmail: "admin@mindblow.com",
  adminLabel: "Administrator",
  logoutLabel: "Logout",
  logoutDialog: {
    title: "Log out?",
    description: "You'll need to sign in again with a new magic link to continue.",
    cancelLabel: "Cancel",
    confirmLabel: "Log out",
    loggingOutLabel: "Logging out...",
  },
} as const;