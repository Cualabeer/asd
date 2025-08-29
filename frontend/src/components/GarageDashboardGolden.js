import React, { useEffect, useState } from 'react';
import api from '../services/api';

const phi = 1.618;
const statusColors = {
  pending: 'bg-yellow-200 text-yellow-800',
  'in-progress': 'bg-blue-200 text-blue-800',
  completed: 'bg-green-200 text-green-800',
};

const GarageDashboardGolden = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchJobs(); }, []);

  const fetchJobs = async () => {
    try {
      const res = await api.get('/bookings/assigned');
      setJobs(res.data);
      setLoading(false);
    } catch (err) { console.error(err); setLoading(false); }
  };

  const updateStatus = async (jobId, newStatus) => {
    try {
      await api.put(`/bookings/${jobId}`, { status: newStatus });
      setJobs(jobs.map(job => job._id === jobId ? { ...job, status: newStatus } : job));
    } catch (err) { console.error(err); }
  };

  const addNote = async (jobId, note) => {
    try {
      await api.put(`/bookings/${jobId}`, { notes: note });
      setJobs(jobs.map(job => job._id === jobId ? { ...job, notes: note } : job));
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="text-center mt-10 text-xl">Loading jobs...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-4xl font-semibold text-primary mb-6">Your Assigned Jobs</h1>
      {jobs.length === 0 && <p className="text-gray-700 text-lg">No jobs assigned yet.</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {jobs.map(job => (
          <div key={job._id} className="bg-secondary rounded-xl shadow-lg p-6 flex flex-col justify-between"
               style={{ height: `${300 * phi}px` }}>
            <div>
              <h2 className="text-2xl font-medium mb-2">{job.customerName} - {job.vehicle}</h2>
              <p className="text-gray-700 text-lg">{job.serviceType}</p>
              <p className="text-gray-600 text-base">Scheduled: {new Date(job.date).toLocaleString()}</p>
              <p className="mt-3 text-gray-700">Notes: {job.notes || 'No notes yet'}</p>
            </div>
            <div className="flex flex-wrap mt-4 gap-3 items-center">
              <span className={`px-3 py-1 rounded-full ${statusColors[job.status]}`} aria-label={`Job status: ${job.status}`}>
                {job.status}
              </span>
              <button onClick={() => updateStatus(job._id, 'in-progress')}
                      className="bg-blue-500 text-white rounded-lg px-6 py-3 hover:opacity-90"
                      style={{ width: `${100 * phi}px`, height: `${60 * phi}px` }}>
                Start Job
              </button>
              <button onClick={() => updateStatus(job._id, 'completed')}
                      className="bg-green-500 text-white rounded-lg px-6 py-3 hover:opacity-90"
                      style={{ width: `${100 * phi}px`, height: `${60 * phi}px` }}>
                Complete
              </button>
              <button onClick={() => { const note = prompt('Add a note:', job.notes || ''); if(note !== null) addNote(job._id, note); }}
                      className="bg-purple-500 text-white rounded-lg px-6 py-3 hover:opacity-90"
                      style={{ width: `${100 * phi}px`, height: `${60 * phi}px` }}>
                Add Note
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GarageDashboardGolden;