import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login',{email,password});
      localStorage.setItem('token',res.data.token);
      const role = res.data.user.role;
      if(role==='customer') navigate('/customer');
      else if(role==='garage') navigate('/garage');
      else if(role==='admin') navigate('/admin');
    } catch (err) { console.error(err); alert('Login failed'); }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-secondary">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-semibold mb-6 text-primary">Login</h1>
        <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}
               className="w-full p-3 mb-4 rounded border border-gray-300"/>
        <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}
               className="w-full p-3 mb-6 rounded border border-gray-300"/>
        <button type="submit" className="w-full bg-primary text-white py-3 rounded hover:opacity-90">Login</button>
      </form>
    </div>
  );
};

export default Login;