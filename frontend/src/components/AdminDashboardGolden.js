import React, { useEffect, useState } from 'react';
import api from '../services/api';

const phi = 1.618;

const statusColors = {
  pending: 'bg-yellow-200 text-yellow-800',
  'in-progress': 'bg-blue-200 text-blue-800',
  completed: 'bg-green-200 text-green-800',
};

const roleColors = {
  customer: 'bg-purple-200 text-purple-800',
  garage: 'bg-blue-200 text-blue-800',
  admin: 'bg-red-200 text-red-800',
};

const AdminDashboardGolden = () => {
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, bookingsRes] = await Promise.all([
        api.get('/users'),        // fetch all users
        api.get('/bookings/all')  // fetch all bookings
      ]);
      setUsers(usersRes.data);
      setBookings(bookingsRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    if(!window.confirm('Delete this user?')) return;
    try {
      await api.delete(`/users/${userId}`);
      setUsers(users.filter(u => u._id !== userId));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteBooking = async (bookingId) => {
    if(!window.confirm('Delete this booking?')) return;
    try {
      await api.delete(`/bookings/${bookingId}`);
      setBookings(bookings.filter(b => b._id !== bookingId));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="text-center mt-10 text-xl">Loading admin data...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-4xl font-semibold text-primary mb-8">Admin Dashboard</h1>

      {/* Users Section */}
      <h2 className="text-2xl font-medium mb-4">Users</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {users.map(user => (
          <div key={user._id} className="bg-secondary rounded-xl shadow-lg p-6"
            style={{ height: `${150 * phi}px` }}
          >
            <h3 className="text-xl font-medium mb-1">{user.name}</h3>
            <p className="text-gray-700">Email: {user.email}</p>
            <span className={`px-3 py-1 rounded-full ${roleColors[user.role]} mt-2 inline-block`} aria-label={`Role: ${user.role}`}>
              {user.role}
            </span>
            <div className="mt-3">
              <button
                onClick={() => deleteUser(user._id)}
                className="bg-red-500 text-white px-4 py-2 rounded hover:opacity-90"
                style={{ width: `${100 * phi}px`, height: `${40 * phi}px` }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bookings Section */}
      <h2 className="text-2xl font-medium mb-4">Bookings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {bookings.map(booking => (
          <div key={booking._id} className="bg-secondary rounded-xl shadow-lg p-6 flex flex-col justify-between"
            style={{ height: `${250 * phi}px` }}
          >
            <div>
              <h3 className="text-xl font-medium mb-1">{booking.customerName} - {booking.vehicle}</h3>
              <p className="text-gray-700">{booking.serviceType}</p>
              <p className="text-gray-600">Scheduled: {new Date(booking.date).toLocaleString()}</p>
              <p className="mt-2 text-gray-700">Notes: {booking.notes || 'No notes'}</p>
            </div>
            <div className="flex flex-wrap mt-4 gap-3 items-center">
              <span className={`px-3 py-1 rounded-full ${statusColors[booking.status]}`} aria-label={`Job status: ${booking.status}`}>
                {booking.status}
              </span>
              <button
                onClick={() => deleteBooking(booking._id)}
                className="bg-red-500 text-white px-6 py-2 rounded hover:opacity-90"
                style={{ width: `${100 * phi}px`, height: `${40 * phi}px` }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboardGolden;