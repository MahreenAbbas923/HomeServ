import React, { useState, useEffect } from 'react';
import { Users, CheckCircle } from 'lucide-react';
import API from '../../utils/api';

const ManageCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const { data } = await API.get('/admin/customers');
        setCustomers(data.data || []);
      } catch (error) {
        console.error('Failed to fetch customers', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="dashboard-title">All Customers</h1>
        <p className="dashboard-subtitle">View all registered customers</p>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-center"><div className="spinner"></div></div>
        ) : customers.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>City</th>
                  <th>Status</th>
                  <th>Joined Date</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(customer => (
                  <tr key={customer._id}>
                    <td style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="navbar-avatar" style={{ width: '28px', height: '28px', fontSize: '0.75rem', marginBottom: 0 }}>
                        {customer.name?.charAt(0).toUpperCase()}
                      </div>
                      {customer.name}
                    </td>
                    <td>{customer.email}</td>
                    <td>{customer.phone}</td>
                    <td>{customer.city}</td>
                    <td>
                      {customer.isVerified ? (
                        <span className="badge badge-success" style={{ background: 'transparent', border: '1px solid var(--accent-success)' }}>
                          <CheckCircle size={12} style={{ marginRight: '4px' }} /> Verified
                        </span>
                      ) : (
                        <span className="badge badge-pending">Unverified</span>
                      )}
                    </td>
                    <td>{new Date(customer.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><Users size={48} /></div>
            <h3 className="empty-state-title">No customers found</h3>
            <p className="empty-state-desc">There are no registered customers on the platform yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageCustomers;
