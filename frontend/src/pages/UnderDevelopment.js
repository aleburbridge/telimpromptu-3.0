import React from 'react';
import { Link } from 'react-router-dom';

export const UnderDevelopment = () => {
    return (
      <div className='App flex flex-col min-h-screen'>
            <p className='mt-6 mb-6 text-2xl text-center'>This feature is under construction. Please check back later.</p>
            <img className='mx-auto rounded-2xl' src='/error.png' alt='tv error' />
            <Link to='/' className='no-underline text-xl text-accent mt-6'>← Return</Link>
        </div>
    );
};

