import React,{useState} from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const Register=()=>{
  const [name,setName]=useState('');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [role,setRole]=useState('customer');
  const navigate = useNavigate();

  const handleRegister=async(e)=>{
    e.preventDefault();
    try{
      await api.post('/auth/register',{name,email,password,role});
      alert('Registration successful');
      navigate('/login');
    }catch(err){console.error(err); alert('Registration failed');}
  };

  return(
    <div className="flex justify-center items-center h-screen bg-secondary">
      <form onSubmit={handleRegister} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-semibold mb-6 text-primary">Register</h1>
        <input type="text" placeholder="Name" value={name} onChange={e=>setName(e.target.value)}
               className="w-full p-3 mb-4 rounded border border-gray-300"/>
        <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}
               className="w-full p-3 mb-4 rounded border border-gray-300"/>
        <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}
               className="w-full p-3 mb-4 rounded border border-gray-300"/>
        <select value={role} onChange={e=>setRole(e.target.value)}
                className="w-full p-3 mb-6 rounded border border-gray-300">
          <option value="customer">Customer</option>
          <option value="garage">Garage Staff</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit" className="w-full bg-primary text-white py-3 rounded hover:opacity-90">Register</button>
      </form>
    </div>
  );
};

export default Register;