import React from 'react';
import './App.css';
import HomePage from './pages/HomePage';
import JoinRoomPage from './pages/JoinRoomPage';
import WaitingRoomPage from './pages/WaitingRoomPage';
import HeadlinePage from './pages/HeadlinePage';
import TopicVotePage from './pages/TopicVotePage';
import { Route, Routes, Link, useLocation } from 'react-router-dom';
import { SecretPage } from './pages/SecretPage';
// import { ScriptWritingPage } from './pages/ScriptWritingPage';
import Footer from './components/Footer';
import PromptAnswering from './pages/PromptAnswering';
import Teleprompter from './pages/Teleprompter';
import { UnderDevelopment } from './pages/UnderDevelopment';

function App() {
  const location = useLocation();
  const isTeleprompterPage = location.pathname.startsWith('/teleprompter');

  return (
    <div className='App flex flex-col min-h-screen'>
      {!isTeleprompterPage && (
        <header>
          <h1 className='text-4xl font-bold mt-6 mb-4 flex items-center justify-center'>
              <Link to='/' className='no-underline flex items-center'>
                  <img src='/tv_transparent.png' alt='logo' className='h-10 mr-2' />
                  Telimpromptu
              </Link>
          </h1>

        </header>
      )}
      <main className='flex-grow'>
        <Routes>
          <Route path='/' element={<HomePage />} />
          <Route path='join-room' element={<JoinRoomPage />} />
          <Route path='/waiting-room' element={<WaitingRoomPage />} />
          <Route path='/headline' element={<HeadlinePage />} />
          <Route path='/topic-vote' element={<TopicVotePage />} />
          <Route path='/secret-page' element={<SecretPage />} />
          <Route path='/script-writing' element={<UnderDevelopment />} />
          <Route path='/prompt-answering' element={<PromptAnswering />} />
          <Route path='/teleprompter' element={<Teleprompter />} />
          <Route path='/teleprompter/:roomName' element={<Teleprompter />} />
        </Routes>
      </main>
      {!isTeleprompterPage && <Footer />}
    </div>
  );
}

export default App;
