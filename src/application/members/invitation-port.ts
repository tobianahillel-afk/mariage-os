export type AssignableProjectRole = "owner" | "editor" | "viewer";

export type IssueProjectInvitationRequest = {
  readonly projectId: string;
  readonly intendedEmail: string;
  readonly role: AssignableProjectRole;
};

export type IssuedProjectInvitation = {
  readonly invitationId: string;
  readonly rawToken: string;
  readonly expiresAt: string;
};

export interface ProjectInvitationPort {
  issue(
    request: IssueProjectInvitationRequest,
  ): Promise<IssuedProjectInvitation>;
  revoke(invitationId: string): Promise<void>;
  accept(rawToken: string): Promise<string>;
}

export interface ProjectMembershipAdministrationPort {
  changeRole(
    projectId: string,
    userId: string,
    role: AssignableProjectRole,
  ): Promise<void>;
  revoke(projectId: string, userId: string): Promise<void>;
}

export function normalizeInvitationEmail(email: string): string {
  return email.trim().toLowerCase();
}
