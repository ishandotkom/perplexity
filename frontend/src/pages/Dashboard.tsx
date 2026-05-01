import "../index.css";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { BACKEND_URL } from "@/config/config";
import axios from "axios";
import {
  Search,
  Compass,
  Library,
  Plus,
  LogOut,
  User as UserIcon,
  Paperclip,
  ArrowRight,
  Globe,
  LogIn,
} from "lucide-react";

const supabase = createClient();

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function getInfo() {
      const { data, error } = await supabase.auth.getUser();
      if (data.user) {
        setUser(data.user);
      }
    }
    getInfo();
  }, []);

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");

  const handleSubmit = async () => {
    if (!query.trim() || loading || !user) {
      navigate("/auth");
    }

    setLoading(true);
    setResponse("");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const jwt = session?.access_token;

      if (!jwt) throw new Error("No auth token");

      const res = await fetch(`${BACKEND_URL}/perplexity_ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: jwt,
        },
        body: JSON.stringify({ query }),
      });

      if (!res.body) throw new Error("No response body");

      setQuery("");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        setResponse((prev) => prev + chunk);
      }
    } catch (error) {
      console.error("Failed to submit query:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function getExistingConversations() {
      if (user) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const jwt = session?.access_token;
        if (!jwt) return;
        try {
          const response = await axios.get(`${BACKEND_URL}/conversations`, {
            headers: {
              Authorization: jwt,
            },
          });
          console.log(response.data);
        } catch (error) {
          console.error("Failed to fetch conversations", error);
        }
      }
    }
    getExistingConversations();
  }, [user]);

  return (
    <div className="flex h-screen w-full bg-[#191919] text-neutral-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[260px] bg-[#202020] border-r border-white/5 flex-col hidden md:flex h-full py-4">
        <div className="px-5 flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-[#208b81] rounded-md flex items-center justify-center shrink-0 shadow-sm">
            {/* Minimal Logo representation */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white"
            >
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <span className="font-semibold text-lg tracking-wide text-white">
            perplexity
          </span>
        </div>

        <div className="px-3 mb-4">
          <button className="w-full flex items-center justify-between bg-[#191919] hover:bg-[#2b2b2b] text-neutral-200 px-3 py-2.5 rounded-full transition-colors text-sm font-medium border border-white/5">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-neutral-400" />
              <span>New Thread</span>
            </div>
            <div className="flex items-center gap-1 opacity-60">
              <span className="text-[10px] font-semibold border border-white/20 rounded px-1.5 py-0.5">
                Ctrl
              </span>
              <span className="text-[10px] font-semibold border border-white/20 rounded px-1.5 py-0.5">
                I
              </span>
            </div>
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          <NavItem icon={<Search className="w-5 h-5" />} label="Home" active />
          <NavItem icon={<Compass className="w-5 h-5" />} label="Discover" />
          <NavItem icon={<Library className="w-5 h-5" />} label="Library" />
        </nav>

        <div className="p-3 mt-auto border-t border-white/5 pt-4 mx-3">
          {user ? (
            <div className="flex items-center justify-between px-2 py-2 hover:bg-[#2b2b2b] rounded-lg cursor-pointer transition-colors group">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center shrink-0">
                  <UserIcon className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate text-neutral-200">
                    {user.email}
                  </span>
                  <span className="text-[10px] text-neutral-500 truncate">
                    Free Plan
                  </span>
                </div>
              </div>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  await supabase.auth.signOut();
                  setUser(null);
                }}
                className="text-neutral-500 hover:text-white p-1.5 opacity-0 group-hover:opacity-100 transition-all rounded hover:bg-white/10"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate("/auth")}
              className="w-full flex items-center justify-center gap-2 bg-[#208b81] hover:bg-[#1a736a] text-white px-4 py-2.5 rounded-full transition-colors text-sm font-medium shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign Up / Log In</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative h-full bg-[#191919]">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#208b81] rounded flex items-center justify-center">
              <Search className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white">perplexity</span>
          </div>
          {user ? (
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                setUser(null);
              }}
            >
              <LogOut className="w-5 h-5 text-neutral-400" />
            </button>
          ) : (
            <button
              onClick={() => navigate("/auth")}
              className="text-sm font-medium text-[#208b81]"
            >
              Log In
            </button>
          )}
        </header>

        <div className={`flex-1 overflow-hidden w-full flex flex-col items-center px-4 md:px-8 pb-6 transition-all duration-500 ease-in-out ${response || loading ? "pt-4 md:pt-6" : "pt-[12vh] md:pt-[18vh]"}`}>
          <div className="w-full max-w-3xl flex flex-col h-full items-center">
            {response || loading ? (
              <div className="flex-1 w-full min-h-0 mb-6 text-neutral-200 p-6 bg-[#202020] rounded-2xl border border-white/10 shadow-lg whitespace-pre-wrap leading-relaxed text-[15px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 hover:[&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent transition-colors">
                {response || "Thinking..."}
              </div>
            ) : (
              <h1 className="text-3xl md:text-[2.5rem] font-serif mb-8 text-white tracking-tight shrink-0 text-center">
                Where knowledge begins
              </h1>
            )}

            {/* Search Input Container */}
            <div className="w-full bg-[#202020] border border-white/10 rounded-2xl shadow-xl shadow-black/40 focus-within:ring-1 focus-within:ring-[#208b81]/50 focus-within:border-[#208b81]/50 transition-all flex flex-col group shrink-0">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask anything..."
                className="w-full bg-transparent text-white placeholder:text-neutral-500 p-4 md:p-5 text-lg md:text-xl resize-none outline-none min-h-[110px] rounded-t-2xl leading-relaxed"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              <div className="flex items-center justify-between px-3 py-3 border-t border-white/5 bg-[#202020] rounded-b-2xl">
                <div className="flex items-center gap-1.5">
                  <button className="flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors px-2.5 py-1.5 rounded-full hover:bg-white/5 text-sm font-medium">
                    <Globe className="w-4 h-4" />
                    <span>Focus</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors px-2.5 py-1.5 rounded-full hover:bg-white/5 text-sm font-medium">
                    <Paperclip className="w-4 h-4" />
                    <span>Attach</span>
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 mr-1 hidden sm:flex">
                    <span className="text-[13px] font-medium text-neutral-400">
                      Pro
                    </span>
                    <div className="w-8 h-4 bg-white/10 rounded-full relative cursor-pointer hover:bg-white/20 transition-colors">
                      <div className="w-3 h-3 bg-neutral-400 rounded-full absolute left-0.5 top-0.5"></div>
                    </div>
                  </div>
                  <button
                    disabled={!query.trim()}
                    onClick={handleSubmit}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      query.trim()
                        ? "bg-white text-black hover:bg-neutral-200"
                        : "bg-white/10 text-neutral-500 cursor-not-allowed"
                    }`}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Suggestions */}
            {!response && !loading && (
              <div className="w-full mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 shrink-0">
                <SuggestionChip
                  icon={<Compass className="w-4 h-4" />}
                  text="What does polymarket do?"
                />
                <SuggestionChip
                  icon={<Library className="w-4 h-4" />}
                  text="How to download mt5 platform"
                />
                <SuggestionChip
                  icon={<Search className="w-4 h-4" />}
                  text="Is Polymarket legal in the US"
                />
                <SuggestionChip
                  icon={<Search className="w-4 h-4" />}
                  text="Who founded Polymarket"
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const NavItem = ({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) => {
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
        active
          ? "bg-[#2b2b2b] text-white font-medium"
          : "text-neutral-400 hover:text-white hover:bg-[#2b2b2b]/50"
      }`}
    >
      <div className={`${active ? "text-white" : "text-neutral-400"}`}>
        {icon}
      </div>
      <span className="text-[15px]">{label}</span>
    </div>
  );
};

const SuggestionChip = ({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) => {
  return (
    <button className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/5 bg-[#202020] hover:bg-[#2b2b2b] transition-all text-left group">
      <div className="text-neutral-500 group-hover:text-white transition-colors">
        {icon}
      </div>
      <span className="text-sm font-medium text-neutral-300 group-hover:text-white transition-colors line-clamp-1">
        {text}
      </span>
    </button>
  );
};

export default Dashboard;
