// src/components/Home.js
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { currentUser } = useAuth();

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Welcome to the Authentication Demo</h1>
      
      {currentUser ? (
        <div>
          <p>You are logged in as: <strong>{currentUser.email}</strong></p>
          <p>Your account has been authenticated successfully!</p>
        </div>
      ) : (
        <div>
          <p>Please log in or sign up to access protected content.</p>
        </div>
      )}
    </div>
  );
};

export default Home;
