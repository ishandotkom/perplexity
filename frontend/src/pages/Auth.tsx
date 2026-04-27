import { createClient } from "@/lib/client";

const supabase = createClient()

const Auth = () => {
  async function LogIn(provider: "google" | "github") {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider,
    });

    if (error) {
      alert("Error while signing in");
    } else {
      alert("Signed in successfully");
    }
  }

  return (
    <div>
      <button onClick={() => LogIn("google")}>Login with google</button>
      <button onClick={() => LogIn("github")}>Login with github</button>
    </div>
  );
};

export default Auth;
