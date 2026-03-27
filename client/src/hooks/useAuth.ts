export function useAuth() {
  return {
    user: {
      id: "dev-user-1",
      email: "dev@resumelogik.com",
      firstName: "Dev",
      lastName: "User",
      profileImageUrl: null as string | null,
      isAdmin: "true",
    },
    isAuthenticated: true,
    isLoading: false,
  };
}
