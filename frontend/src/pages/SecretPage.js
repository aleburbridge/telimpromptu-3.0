import React from 'react';

export const SecretPage = () => {
    
    return (
        <div>
            <img src='/Gargoyle.jpg' alt='gargoyle'></img>
           <h3>You have found the secret page. Enter the password to enter</h3>
           <input type='password' placeholder='Password'></input>
           <button>Enter</button>
        </div>
    );
};
