import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { BACKEND_URL } from "@/config/config";
import axios from "axios";

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

  useEffect(() => {
    async function getExistingConversations() {
      if (user) {
        const { data: { session } } = await supabase.auth.getSession();
        const jwt =session?.access_token
        const response = await axios.get(`${BACKEND_URL}/conversations`,{
          headers:{
            Authorization:jwt
          }
        })
        console.log(response.data)
      }
    }
    getExistingConversations()
  }, [user])

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
