import "next-auth";
declare module "next-auth" {
  interface Session {
    staff: { id: string; roles: string[]; authenticatedAt: number };
  }
}
