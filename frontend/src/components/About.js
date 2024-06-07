import React from "react";
import { Link } from "react-router-dom";

export default function About() {
    return (
        <div className="container mt-3">
            <div className="bg-secondary p-2.5 rounded-md overflow-y-auto">
                <h3 className="text-xl font-bold mb-2">💡 About</h3>
                <p>Telimpromptu is a free online game where players create and present whacky mad-libs style news broadcasts!</p>
                <Link to='/script-writing' className="text-accent hover:text-yellow-500">Want to write your own script? Click here</Link>
            </div>
        </div>
    );    
}
