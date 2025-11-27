import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { buyersAPI } from '../services/api';

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

const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
  40% {transform: translateY(-8px);}
  60% {transform: translateY(-4px);}
`;

// Styled Components (unchanged except for table column adjustments)
const PageContainer = styled.div`
  padding: 2rem;
  animation: ${fadeIn} 0.5s ease-out;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
  
  @media (max-width: 576px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const PageTitle = styled.h2`
  color: #2c3e50;
  margin: 0;
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
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
    animation: ${pulse} 1s;
  }
  
  &:active {
    transform: translateY(0);
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
  color: inherit;
  cursor: pointer;
  margin-left: auto;
  padding: 0.2rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }
`;

const TableContainer = styled.div`
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 5px 25px rgba(0, 0, 0, 0.1);
  animation: ${fadeIn} 0.6s ease-out;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  thead {
    background: linear-gradient(to right, #3498db);
    color: white;
  }
  
  th {
    padding: 1.2rem 1rem;
    text-align: left;
    font-weight: 600;
    font-size: 0.95rem;
  }
  
  tbody tr {
    border-bottom: 1px solid #f1f2f6;
    transition: all 0.3s ease;
    
    &:hover {
      background: #f8f9fa;
      transform: translateY(-2px);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    }
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  td {
    padding: 1rem;
    color: #2c3e50;
  }
  
  /* Make S.No column narrower */
  th:first-child, td:first-child {
    width: 60px;
    text-align: center;
  }
  
  @media (max-width: 992px) {
    th:nth-child(4),
    td:nth-child(4) {
      display: none;
    }
  }
  
  @media (max-width: 768px) {
    th:nth-child(5),
    td:nth-child(5) {
      display: none;
    }
  }
`;

const ActionCell = styled.td`
  display: flex;
  gap: 0.5rem;
  
  @media (max-width: 576px) {
    flex-direction: column;
  }
`;

const IconButton = styled.button`
  background: ${props => props.variant === 'edit' 
    ? 'rgba(52, 152, 219, 0.1)' 
    : 'rgba(231, 76, 60, 0.1)'};
  color: ${props => props.variant === 'edit' 
    ? '#3498db' 
    : '#e74c3c'};
  border: none;
  border-radius: 6px;
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.variant === 'edit' 
      ? 'rgba(52, 152, 219, 0.2)' 
      : 'rgba(231, 76, 60, 0.2)'};
    transform: translateY(-2px);
    animation: ${bounce} 0.8s ease;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: ${fadeIn} 0.3s ease-out;
  padding: 1rem;
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: ${slideIn} 0.3s ease-out;
`;

const ModalHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #f1f2f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h3`
  margin: 0;
  color: #2c3e50;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #7f8c8d;
  padding: 0.2rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    color: #e74c3c;
    background: rgba(231, 76, 60, 0.1);
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #2c3e50;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.8rem 1rem;
  border: 2px solid #f1f2f6;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.8rem 1rem;
  border: 2px solid #f1f2f6;
  border-radius: 8px;
  font-size: 1rem;
  resize: vertical;
  min-height: 100px;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
  }
`;

const ModalFooter = styled.div`
  padding: 1.5rem;
  border-top: 1px solid #f1f2f6;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
`;

const SecondaryButton = styled.button`
  background: #f1f2f6;
  color: #7f8c8d;
  border: none;
  border-radius: 8px;
  padding: 0.8rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: #e4e6eb;
    transform: translateY(-2px);
  }
`;

const PrimaryButton = styled.button`
  background: linear-gradient(to right, #3498db);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.8rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
    animation: ${pulse} 1s;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #7f8c8d;
  
  i {
    font-size: 3rem;
    margin-bottom: 1rem;
    display: block;
    color: #bdc3c7;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  
  &::after {
    content: '';
    width: 40px;
    height: 40px;
    border: 4px solid #f1f2f6;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const Buyers = () => {
  const [buyers, setBuyers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBuyers();
  }, []);

  const fetchBuyers = async () => {
    try {
      setLoading(true);
      const response = await buyersAPI.getAll();
  setBuyers(response.data);
      setError('');
    } catch (error) {
      setError('Failed to fetch buyers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = (buyer = null) => {
    if (buyer) {
      setEditingBuyer(buyer);
      setFormData({
        name: buyer.name,
        companyName: buyer.companyName,
        email: buyer.email || '',
        phone: buyer.phone || '',
        address: buyer.address
      });
    } else {
      setEditingBuyer(null);
      setFormData({
        name: '',
        companyName: '',
        email: '',
        phone: '',
        address: ''
      });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBuyer(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBuyer) {
        await buyersAPI.update(editingBuyer._id, formData);
        setSuccess('Buyer updated successfully!');
      } else {
        await buyersAPI.create(formData);
        setSuccess('Buyer created successfully!');
      }
      fetchBuyers();
      handleCloseModal();
    } catch (error) {
      setError('Failed to save buyer. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this buyer?')) {
      try {
        await buyersAPI.delete(id);
        setSuccess('Buyer deleted successfully!');
        fetchBuyers();
      } catch (error) {
        setError('Failed to delete buyer. Please try again.');
      }
    }
  };

  const clearAlerts = () => {
    setError('');
    setSuccess('');
  };

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Buyers Management</PageTitle>
        <ActionButton onClick={() => handleShowModal()}>
          <i className="bi bi-plus-circle"></i>
          Add New Buyer
        </ActionButton>
      </PageHeader>

      {error && (
        <AlertMessage variant="danger">
          <i className="bi bi-exclamation-circle"></i>
          {error}
          <CloseAlert onClick={clearAlerts}>
            <i className="bi bi-x"></i>
          </CloseAlert>
        </AlertMessage>
      )}

      {success && (
        <AlertMessage variant="success">
          <i className="bi bi-check-circle"></i>
          {success}
          <CloseAlert onClick={clearAlerts}>
            <i className="bi bi-x"></i>
          </CloseAlert>
        </AlertMessage>
      )}

      <TableContainer>
        {loading ? (
          <LoadingSpinner />
        ) : buyers.length === 0 ? (
          <EmptyState>
            <i className="bi bi-people"></i>
            <h3>No Buyers Found</h3>
            <p>Get started by adding your first buyer.</p>
          </EmptyState>
        ) : (
          <StyledTable>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Name</th>
                <th>Company Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {buyers.map((buyer, index) => (
                <tr key={buyer._id}>
                  <td>{index + 1}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'linear-gradient(to right, #3498db, #2ecc71)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold'
                      }}>
                        {buyer.name.charAt(0)}
                      </div>
                      {buyer.name}
                    </div>
                  </td>
                  <td>{buyer.companyName}</td>
                  <td>{buyer.email || '-'}</td>
                  <td>{buyer.phone || '-'}</td>
                  <td>{buyer.address}</td>
                  <ActionCell>
                    <IconButton 
                      variant="edit" 
                      onClick={() => handleShowModal(buyer)}
                      title="Edit Buyer"
                    >
                      <i className="bi bi-pencil"></i>
                    </IconButton>
                    <IconButton 
                      variant="danger" 
                      onClick={() => handleDelete(buyer._id)}
                      title="Delete Buyer"
                    >
                      <i className="bi bi-trash"></i>
                    </IconButton>
                  </ActionCell>
                </tr>
              ))}
            </tbody>
          </StyledTable>
        )}
      </TableContainer>

      {showModal && (
        <ModalOverlay onClick={handleCloseModal}>
          <ModalContainer onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>{editingBuyer ? 'Edit Buyer' : 'Add New Buyer'}</ModalTitle>
              <CloseButton onClick={handleCloseModal}>
                <i className="bi bi-x"></i>
              </CloseButton>
            </ModalHeader>
            <form onSubmit={handleSubmit}>
              <ModalBody>
                <FormGroup>
                  <Label>Name *</Label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter buyer name"
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Company Name *</Label>
                  <Input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter company name"
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Address *</Label>
                  <TextArea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter full address"
                  />
                </FormGroup>
              </ModalBody>
              <ModalFooter>
                <SecondaryButton type="button" onClick={handleCloseModal}>
                  Cancel
                </SecondaryButton>
                <PrimaryButton type="submit">
                  {editingBuyer ? 'Update Buyer' : 'Create Buyer'}
                </PrimaryButton>
              </ModalFooter>
            </form>
          </ModalContainer>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};

export default Buyers;