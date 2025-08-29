import React, { useEffect, useState } from 'react';
import api from '../services/api';

const phi = 1.618;
const statusColors = {
  pending: 'bg-yellow-200 text-yellow-800',
  'in-progress': 'bg-blue-200 text-blue-800',
  completed: 'bg-green-200 text-green-800',
};

const CustomerDashboardGolden = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings/my');
      setBookings(res.data);
      setLoading(false);
    } catch (err) { console.error(err); setLoading(false); }
  };

  const printBooking = (booking) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>Booking Details</title></head><body>
      <h1 style="font-size:2em;">${booking.customerName} - ${booking.vehicle}</h1>
      <p>Service: ${booking.serviceType}</p>
      <p>Scheduled: ${new Date(booking.date).toLocaleString()}</p>
      <p>Status: ${booking.status}</p>
      <p>Notes: ${booking.notes || 'No notes'}</p>
      </body></html>
    `);
    printWindow.print();
  };

  if (loading) return <div className="text-center mt-10 text-xl">Loading your bookings...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-4xl font-semibold text-primary mb-6">Your Bookings</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {bookings.map(booking => (
          <div key={booking._id} className="bg-secondary rounded-xl shadow-lg p-6 flex flex-col justify-between"
               style={{ height: `${250 * phi}px` }}>
            <div>
              <h2 className="text-2xl font-medium mb-2">{booking.vehicle}</h2>
              <p className="text-gray-700 text-lg">{booking.serviceType}</p>
              <p className="text-gray-600 text-base">Scheduled: {new Date(booking.date).toLocaleString()}</p>
              <p className="mt-2 text-gray-700">Notes: {booking.notes || 'No notes'}</p>
            </div>
            <div className="flex justify-between mt-4">
              <span className={`px-3 py-1 rounded-full ${statusColors[booking.status]}`}>{booking.status}</span>
              <button onClick={() => printBooking(booking)}
                      className="bg-primary text-white px-6 py-2 rounded hover:opacity-90"
                      style={{ width: `${120 * phi}px`, height: `${40 * phi}px` }}>
                Print
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomerDashboardGolden;