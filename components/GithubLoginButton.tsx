import { signIn } from "@/auth";

export default function GithubLoginButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("github");
      }}
    >
      <button type="submit">
        Sign in with GitHub
      </button>
    </form>
  );
}