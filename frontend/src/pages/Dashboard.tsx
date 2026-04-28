import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

const supabase = createClient();

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function getInfo() {
      const { data, error } = await supabase.auth.getUser();
      if (data.user) {
        setUser(data.user);
      }
    }
    getInfo();
  }, []);

  return (
    <div>
      {!user && <button onClick={() => navigate("/auth")}>Sign In</button>}

      {user && (
        <div>
          {user.email}
          <button
            onClick={async() => {
              await supabase.auth.signOut();
              setUser(null);
            }}
          >
            Log Out
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
