import React from "react";
import "./App.css";
import HomePage from "./pages/HomePage";
import JoinRoomPage from "./pages/JoinRoomPage";
import WaitingRoomPage from "./pages/WaitingRoomPage";
import HeadlinePage from "./pages/HeadlinePage";
import TopicVotePage from "./pages/TopicVotePage";
import { Route, Routes, Link, useLocation } from "react-router-dom";
import { SecretPage } from "./pages/SecretPage";
// import { ScriptWritingPage } from './pages/ScriptWritingPage';
import Footer from "./components/Footer";
import PromptAnswering from "./pages/PromptAnswering";
import Teleprompter from "./pages/Teleprompter";
import { UnderDevelopment } from "./pages/UnderDevelopment";
import FunniesCaptionPage from "./pages/FunniesCaptionPage";
import FunniesShowcasePage from "./pages/FunniesShowcasePage";
import FunniesWinnersPage from "./pages/FunniesWinnersPage";

function App() {
  const location = useLocation();
  const isTeleprompterPage = location.pathname.startsWith("/teleprompter");
  const isFunniesPage = location.pathname.startsWith("/funnies");

  const headerClassName = isFunniesPage
    ? "w-full bg-[#c1121f] py-3 flex flex-col border-b-4 border-black"
    : "w-full bg-primary py-2 mb-4 flex flex-col";

  const titleClassName = isFunniesPage ? "text-2xl font-bold text-[#f6f1e4]" : "text-2xl font-bold text-text";

  return (
    <div className="App flex flex-col min-h-screen">
      {!isTeleprompterPage && (
        <header className={headerClassName}>
          <h1 className="flex items-center justify-center">
            <Link
              to="/"
              className={`no-underline flex items-center ${isFunniesPage ? "text-[#f6f1e4]" : "text-text"}`}
            >
              <span className="my-auto">
                <em className={titleClassName}>
                  {isFunniesPage ? "Telimpromptu Funnies" : "Telimpromptu"}
                </em>
              </span>
            </Link>
          </h1>
        </header>
      )}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="join-room" element={<JoinRoomPage />} />
          <Route path="/waiting-room" element={<WaitingRoomPage />} />
          <Route path="/headline" element={<HeadlinePage />} />
          <Route path="/topic-vote" element={<TopicVotePage />} />
          <Route path="/secret-page" element={<SecretPage />} />
          <Route path="/script-writing" element={<UnderDevelopment />} />
          <Route path="/prompt-answering" element={<PromptAnswering />} />
          <Route path="/teleprompter" element={<Teleprompter />} />
          <Route path="/teleprompter/:roomName" element={<Teleprompter />} />
          <Route path="/funnies-caption" element={<FunniesCaptionPage />} />
          <Route path="/funnies-showcase" element={<FunniesShowcasePage />} />
          <Route path="/funnies-winners" element={<FunniesWinnersPage />} />
        </Routes>
      </main>
      {!isTeleprompterPage && <Footer isFunniesMode={isFunniesPage} />}
    </div>
  );
}

export default App;
