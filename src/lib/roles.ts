export const ROLES = ["VISITOR", "OWNER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  VISITOR: "Member",
  OWNER: "Business owner",
  ADMIN: "Admin",
};

const rank: Record<Role, number> = { VISITOR: 0, OWNER: 1, ADMIN: 2 };

/** Roles are nested: an admin can do everything an owner can, and an owner everything a member can. */
export function hasRole(userRole: string | null | undefined, required: Role): boolean {
  return (
    typeof userRole === "string" &&
    Object.hasOwn(rank, userRole) &&
    rank[userRole as Role] >= rank[required]
  );
}
