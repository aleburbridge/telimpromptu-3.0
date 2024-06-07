import React from 'react';
import './App.css';
import HomePage from './pages/HomePage';
import JoinRoomPage from './pages/JoinRoomPage';
import WaitingRoomPage from './pages/WaitingRoomPage';
import HeadlinePage from './pages/HeadlinePage';
import TopicVotePage from './pages/TopicVotePage';
import { Route, Routes, Link, useLocation } from 'react-router-dom';
import { SecretPage } from './components/SecretPage';
import { ScriptWritingPage } from './pages/ScriptWritingPage';
import Footer from './components/Footer';
import PromptAnswering from './pages/PromptAnswering';
import Teleprompter from './pages/Teleprompter';
import TestPage from './pages/TestPage';

function App() {
  const location = useLocation();
  const isTeleprompterPage = location.pathname === '/teleprompter';

  return (
    <div className='App flex flex-col min-h-screen'>
      {!isTeleprompterPage && (
        <header>
          <Link to='/' className='no-underline'>
            <h1 className='text-4xl font-bold mt-6 mb-4'>Telimpromptu</h1>
          </Link>
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
          <Route path='/script-writing' element={<ScriptWritingPage />} />
          <Route path='/prompt-answering' element={<PromptAnswering />} />
          <Route path='/teleprompter' element={<Teleprompter />} />
          <Route path='/test-page' element={<TestPage/>} />
        </Routes>
      </main>
      {!isTeleprompterPage && <Footer />}
    </div>
  );
}

export default App;
