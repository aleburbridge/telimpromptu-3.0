import React, { useState } from 'react';
import CreateRoomForm from '../components/CreateRoomForm';
import About from '../components/About';
import AllRoomsList from '../components/AllRoomsList';

export default function HomePage() {
    const [showCreateRoomButton, setShowCreateRoomButton] = useState(true);
    const [showCreateRoomForm, setShowCreateRoomForm] = useState(false);

    const toggleFormVisibility = () => {
        setShowCreateRoomForm(!showCreateRoomForm);
        setShowCreateRoomButton(!showCreateRoomButton);
    }

    return (
        <div className='container container-md'>
            {showCreateRoomButton && <button className='btn btn-accent btn-tall w-full' onClick={toggleFormVisibility}>Create Room</button>}
            {showCreateRoomForm && <CreateRoomForm />}
            <About />
            <AllRoomsList />
        </div>
    );
}
