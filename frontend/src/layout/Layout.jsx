import { useState } from "react";
import TopBar from "./TopBar";
import { Outlet } from "react-router-dom";
import "../styles/layout.css";

const Layout = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="app-layout">
      <div className="content-area">
        <TopBar query={searchQuery} setQuery={setSearchQuery} />
        <main className="main-content">
          <Outlet context={{ searchQuery }} />
        </main>
      </div>
    </div>
  );
};

export default Layout;
