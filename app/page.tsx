import GithubLoginButton from "@/components/GithubLoginButton";
import GithubLogoutButton from "@/components/GithubLogoutButton";


export default function Home() {
  return (
    <div >
      <GithubLoginButton/>
      <hr/> <hr/> <hr/>
      <GithubLogoutButton />
    </div>
  );
}
