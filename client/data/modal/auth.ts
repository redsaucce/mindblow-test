export const authModal = {
  header: {
    title: "Get Started",
    subtitle: "Enter your email to get a magic sign-in link.",
  },
  emailField: {
    label: "Email address",
    placeholder: "you@example.com",
    helper: "We never share your email.",
    errors: {
      required: "Enter your email.",
      invalid: "Enter a valid email.",
    },
  },
  submit: {
    idle: "Send Magic Link",
    loading: "Sending...",
  },
  disclaimer:
    "By continuing, you agree to our Terms of Service and Privacy Policy.",
  retryLabel: "Try again",
  differentEmailLabel: "Use a different email",
  // "{email}" is replaced with the actual address at render time
  feedback: {
    success: {
      title: "Check your email",
      description: "We sent a magic link to {email}. Click the link to sign in.",
    },
    warning: {
      title: "Something went wrong",
      description:
        "We couldn't verify your email right now. Please try again in a moment.",
    },
    error: {
      title: "Request failed",
      description:
        "An unexpected error occurred while sending the magic link. Please try again.",
    },
    rateLimit: {
      title: "Too many requests",
      description:
        "A magic link has already been requested for {email}. Please check your inbox before trying again.",
    },
  },
} as const;