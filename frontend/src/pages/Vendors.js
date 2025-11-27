import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { vendorsAPI } from '../services/api';

// Animations (unchanged)
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

// Styled Components (unchanged except for table column adjustments)
const PageContainer = styled.div`
  padding: 2rem;
  animation: ${fadeIn} 0.5s ease-out;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const PageTitle = styled.h2`
  color: #2c3e50;
  font-weight: 700;
  position: relative;
  padding-bottom: 0.5rem;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 60px;
    height: 4px;
    background: linear-gradient(to right, #3498db);
    border-radius: 2px;
  }
`;

const ActionButton = styled.button`
  background: linear-gradient(to right, #3498db);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.8rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    animation: ${pulse} 1s;
  }
`;

const AlertMessage = styled.div`
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  animation: ${slideIn} 0.3s ease-out;

  ${props => props.variant === 'success' && css`
    background: rgba(46, 204, 113, 0.15);
    color: #27ae60;
    border-left: 4px solid #27ae60;
  `}
  
  ${props => props.variant === 'danger' && css`
    background: rgba(231, 76, 60, 0.15);
    color: #e74c3c;
    border-left: 4px solid #e74c3c;
  `}
`;

const CloseAlert = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  margin-left: auto;
`;

const TableContainer = styled.div`
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 5px 25px rgba(0, 0, 0, 0.1);
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;

  thead {
    background: linear-gradient(to right, #3498db);
    color: white;
  }

  th, td {
    padding: 1rem;
    text-align: center;
    vertical-align: middle;
    word-wrap: break-word;
  }

  /* Adjust column widths for 7 columns instead of 8 */
  th, td {
    width: calc(100% / 7);
  }

  /* Make S.No column narrower */
  th:first-child, td:first-child {
    width: 60px;
  }

  /* Make Actions column slightly wider */
  th:last-child, td:last-child {
    width: 140px;
  }

  tbody tr {
    transition: all 0.3s ease;
    border-bottom: 1px solid #f1f2f6;

    &:hover {
      background: #f8f9fa;
    }
  }
`;

const ActionCell = styled.td`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
`;

const IconButton = styled.button`
  background: ${props => props.variant === 'edit' ? 'rgba(102, 126, 234, 0.15)' : 'rgba(229, 62, 62, 0.15)'};
  color: ${props => props.variant === 'edit' ? '#667eea' : '#e53e3e'};
  border: none;
  border-radius: 6px;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  overflow-y: auto;
  animation: ${slideIn} 0.3s ease-out;
`;

const ModalHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #f1f2f6;
  display: flex;
  justify-content: space-between;
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const ModalFooter = styled.div`
  padding: 1.5rem;
  border-top: 1px solid #f1f2f6;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.8rem;
  border: 2px solid #f1f2f6;
  border-radius: 8px;
  margin-bottom: 1rem;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.8rem;
  border: 2px solid #f1f2f6;
  border-radius: 8px;
  min-height: 80px;
`;

const SecondaryButton = styled.button`
  background: #f1f2f6;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
`;

const PrimaryButton = styled.button`
  background: linear-gradient(to right, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
`;

// Component
const Vendors = () => {
  const [vendors, setVendors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [formData, setFormData] = useState({ name: '', contactPerson: '', email: '', phone: '', address: '', gstNo: '', accountNo: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { fetchVendors(); }, []);

  const fetchVendors = async () => {
    try {
      const response = await vendorsAPI.getAll();
      setVendors(response.data);
    } catch {
      setError('Failed to fetch vendors.');
    }
  };

  const handleShowModal = (vendor = null) => {
    setEditingVendor(vendor);
    setFormData(vendor || { name: '', contactPerson: '', email: '', phone: '', address: '' ,gstNo:'',accountNo:'' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingVendor) {
        await vendorsAPI.update(editingVendor._id, formData);
        setSuccess('Vendor updated successfully!');
      } else {
        await vendorsAPI.create(formData);
        setSuccess('Vendor created successfully!');
      }
      fetchVendors();
      setShowModal(false);
    } catch {
      setError('Failed to save vendor.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this vendor?')) {
      try {
        await vendorsAPI.delete(id);
        setSuccess('Vendor deleted successfully!');
        fetchVendors();
      } catch {
        setError('Failed to delete vendor.');
      }
    }
  };

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Vendors Management</PageTitle>
        <ActionButton onClick={() => handleShowModal()}>+ Add Vendor</ActionButton>
      </PageHeader>

      {error && <AlertMessage variant="danger">{error}<CloseAlert onClick={() => setError('')}>×</CloseAlert></AlertMessage>}
      {success && <AlertMessage variant="success">{success}<CloseAlert onClick={() => setSuccess('')}>×</CloseAlert></AlertMessage>}

      <TableContainer>
        <StyledTable>
          <thead>
            <tr>
              <th>S.No</th> {/* Added Serial Number column */}
              <th>Name</th>
              <th>Contact Person</th>
              {/* Removed Email column */}
              <th>Phone</th>
              <th>Address</th>
              <th>GST No</th>
              <th>Account No</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v, index) => (
              <tr key={v._id}>
                <td>{index + 1}</td> {/* Added Serial Number */}
                <td>{v.name}</td>
                <td>{v.contactPerson}</td>
                {/* Removed Email column data */}
                <td>{v.phone}</td>
                <td>{v.address}</td>
                <td>{v.gstNo}</td>
                <td>{v.accountNo}</td>
                <ActionCell>
                  <IconButton variant="edit" onClick={() => handleShowModal(v)}>✏️</IconButton>
                  <IconButton variant="danger" onClick={() => handleDelete(v._id)}>🗑️</IconButton>
                </ActionCell>
              </tr>
            ))}
          </tbody>
        </StyledTable>
      </TableContainer>

      {showModal && (
        <ModalOverlay onClick={() => setShowModal(false)}>
          <ModalContainer onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h3>{editingVendor ? 'Edit Vendor' : 'Add Vendor'}</h3>
              <CloseAlert onClick={() => setShowModal(false)}>×</CloseAlert>
            </ModalHeader>
            <form onSubmit={handleSubmit}>
              <ModalBody>
                <Input placeholder="Name" name="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                <Input placeholder="Contact Person" name="contactPerson" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} required />
                {/* Email field removed from modal as well */}
                <Input placeholder="Phone" name="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
                <TextArea placeholder="Address" name="address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required />
                <Input placeholder="GST No" name="gstNo" value={formData.gstNo} onChange={e => setFormData({...formData, gstNo: e.target.value})} required />
                <Input placeholder="Account No" name="accountNo" value={formData.accountNo} onChange={e => setFormData({...formData, accountNo: e.target.value})} required />
              </ModalBody>
              <ModalFooter>
                <SecondaryButton type="button" onClick={() => setShowModal(false)}>Cancel</SecondaryButton>
                <PrimaryButton type="submit">{editingVendor ? 'Update' : 'Create'}</PrimaryButton>
              </ModalFooter>
            </form>
          </ModalContainer>
        </ModalOverlay>
      )}
    </PageContainer> 
  );
};

export default Vendors;