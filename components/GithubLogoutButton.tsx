import { signOut } from "@/auth";

export default function GithubLogoutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut();
      }}
    >
      <button type="submit">
        Sign out
      </button>
    </form>
  );
}