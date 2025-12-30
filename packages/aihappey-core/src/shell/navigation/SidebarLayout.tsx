import { useState } from "react";
import { Outlet } from "react-router";
import { useNavigate } from "react-router";
import { useAppStore } from "aihappey-state";
import { ConversationSidebar } from "./ConversationSidebar";
import { MinimalNavBar } from "./MinimalNavBar";
import { ConversationSearchModal } from "../../features/conversation-search";

export const SidebarLayout = () => {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const navigate = useNavigate();

  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      {/* IMPORTANT: modal OUTSIDE the flex layout so it can't mess with sizing/overflow */}
      <ConversationSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectConversation={async (id) => {
          await navigate(`/${id}`);
          setSearchOpen(false);
        }}
      />

      <div
        style={{
          display: "flex",
          height: "100dvh",
          minWidth: 0,
        }}
      >
        {/* KEEP original left-side behavior EXACTLY */}
        {!sidebarOpen && <MinimalNavBar onSearch={() => setSearchOpen(true)} />}

        {sidebarOpen && (
          <div
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <ConversationSidebar onSearch={() => setSearchOpen(true)} />
          </div>
        )}

        {/* KEEP original content column EXACTLY */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            overflowY: "auto",
            flexDirection: "column",
          }}
        >
          <Outlet />
        </div>
      </div>
    </>
  );
};
