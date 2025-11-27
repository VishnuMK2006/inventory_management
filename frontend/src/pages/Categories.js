import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { categoriesAPI } from '../services/api';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

// Styled Components
const PageContainer = styled.div`
  margin-left: 280px;
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  animation: ${fadeIn} 0.6s ease-out;

  @media (max-width: 992px) {
    margin-left: 0;
  }
`;

const PageHeader = styled.div`
  background: white;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-bottom: 3px solid #3498db;
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h1`
  color: #2c3e50;
  margin: 0;
  font-size: 2.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 1rem;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const TitleIcon = styled.span`
  animation: ${pulse} 2s infinite;
`;

const ActionButton = styled.button`
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.8rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ContentContainer = styled.div`
  padding: 2rem;
`;

const SearchAndFilter = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
`;

const SearchBar = styled.input`
  flex: 1;
  min-width: 250px;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }

  &::placeholder {
    color: #999;
  }
`;

const CategoriesGrid = styled.div`
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const CategoryCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border-left: 4px solid #3498db;
  animation: ${fadeIn} 0.6s ease-out;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
`;

const CategoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const CategoryName = styled.h3`
  color: #2c3e50;
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
  flex: 1;
`;

const CategoryCode = styled.span`
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  font-family: 'Courier New', monospace;
`;

const CategoryDescription = styled.p`
  color: #666;
  margin: 0 0 1rem 0;
  line-height: 1.5;
  font-size: 0.95rem;
`;

const CategoryActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const EditButton = styled.button`
  background: linear-gradient(135deg, #f39c12, #e67e22);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.3rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(243, 156, 18, 0.3);
  }
`;

const DeleteButton = styled.button`
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.3rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(231, 76, 60, 0.3);
  }
`;

// Modal Components
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
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 0;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  animation: ${slideIn} 0.4s ease-out;
`;

const ModalHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border-radius: 12px 12px 0 0;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const ModalBody = styled.div`
  padding: 2rem;
`;

const ModalFooter = styled.div`
  padding: 1rem 2rem 2rem;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
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
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }

  &.error {
    border-color: #e74c3c;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }
`;

const PrimaryButton = styled.button`
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const SecondaryButton = styled.button`
  background: #95a5a6;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #7f8c8d;
    transform: translateY(-2px);
  }
`;

const ErrorMessage = styled.div`
  background: #fdf2f2;
  border: 1px solid #fbb6c2;
  color: #c53030;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SuccessMessage = styled.div`
  background: #f0fff4;
  border: 1px solid #9ae6b4;
  color: #2f855a;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: #666;

  h3 {
    color: #2c3e50;
    margin-bottom: 1rem;
  }

  p {
    margin-bottom: 2rem;
    font-size: 1.1rem;
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-radius: 50%;
  border-top-color: #3498db;
  animation: spin 1s ease-in-out infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: ''
  });

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Filter categories based on search term
  useEffect(() => {
    const filtered = categories.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.code.includes(searchTerm) ||
      (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredCategories(filtered);
  }, [categories, searchTerm]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await categoriesAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      setError('Failed to load categories');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.code) {
      setError('Name and code are required');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      setLoading(true);
      
      if (editingCategory) {
        await categoriesAPI.update(editingCategory._id, formData);
        setSuccess('Category updated successfully!');
      } else {
        await categoriesAPI.create(formData);
        setSuccess('Category created successfully!');
      }

      setShowModal(false);
      setEditingCategory(null);
      setFormData({ name: '', code: '', description: '' });
      loadCategories();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save category');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      code: category.code,
      description: category.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      setLoading(true);
      await categoriesAPI.delete(categoryId);
      setSuccess('Category deleted successfully!');
      loadCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete category');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = async () => {
    try {
      const response = await categoriesAPI.getNextCode();
      const nextCode = response.data.nextCode;
      
      setFormData({ name: '', code: nextCode, description: '' });
      setEditingCategory(null);
      setShowModal(true);
    } catch (error) {
      setError('Failed to get next category code');
      setTimeout(() => setError(''), 3000);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', code: '', description: '' });
  };

  if (loading && categories.length === 0) {
    return (
      <PageContainer>
        <PageHeader>
          <HeaderContent>
            <Title>
              <TitleIcon>
                <i className="bi bi-tags"></i>
              </TitleIcon>
              Categories
            </Title>
          </HeaderContent>
        </PageHeader>
        <ContentContainer>
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <LoadingSpinner />
            <p style={{ marginTop: '1rem', color: '#666' }}>Loading categories...</p>
          </div>
        </ContentContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader>
        <HeaderContent>
          <Title>
            <TitleIcon>
              <i className="bi bi-tags"></i>
            </TitleIcon>
            Categories
          </Title>
          <ActionButton onClick={openCreateModal}>
            <i className="bi bi-plus"></i>
            Add New Category
          </ActionButton>
        </HeaderContent>
      </PageHeader>

      <ContentContainer>
        {error && (
          <ErrorMessage>
            <i className="bi bi-exclamation-triangle"></i>
            {error}
          </ErrorMessage>
        )}
        
        {success && (
          <SuccessMessage>
            <i className="bi bi-check-circle"></i>
            {success}
          </SuccessMessage>
        )}

        <SearchAndFilter>
          <SearchBar
            type="text"
            placeholder="Search categories by name, code, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchAndFilter>

        {filteredCategories.length === 0 ? (
          <EmptyState>
            <i className="bi bi-tags" style={{ fontSize: '4rem', color: '#ddd', marginBottom: '1rem' }}></i>
            <h3>No Categories Found</h3>
            <p>
              {searchTerm 
                ? `No categories match "${searchTerm}". Try adjusting your search.`
                : 'Get started by creating your first product category.'
              }
            </p>
            {!searchTerm && (
              <ActionButton onClick={openCreateModal}>
                <i className="bi bi-plus"></i>
                Create First Category
              </ActionButton>
            )}
          </EmptyState>
        ) : (
          <CategoriesGrid>
            {filteredCategories.map((category) => (
              <CategoryCard key={category._id}>
                <CategoryHeader>
                  <CategoryName>{category.name}</CategoryName>
                  <CategoryCode>{category.code}</CategoryCode>
                </CategoryHeader>
                
                {category.description && (
                  <CategoryDescription>{category.description}</CategoryDescription>
                )}
                
                <CategoryActions>
                  <EditButton onClick={() => handleEdit(category)}>
                    <i className="bi bi-pencil"></i>
                    Edit
                  </EditButton>
                  <DeleteButton onClick={() => handleDelete(category._id)}>
                    <i className="bi bi-trash"></i>
                    Delete
                  </DeleteButton>
                </CategoryActions>
              </CategoryCard>
            ))}
          </CategoriesGrid>
        )}
      </ContentContainer>

      {/* Category Modal */}
      {showModal && (
        <ModalOverlay onClick={closeModal}>
          <ModalContainer onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                <i className="bi bi-tags" style={{ marginRight: '0.5rem' }}></i>
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </ModalTitle>
              <CloseButton onClick={closeModal}>
                <i className="bi bi-x"></i>
              </CloseButton>
            </ModalHeader>

            <form onSubmit={handleSubmit}>
              <ModalBody>
                <FormGroup>
                  <Label>Category Name *</Label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter category name"
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Category Code *</Label>
                  <Input
                    type="text"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    placeholder="001"
                    pattern="[0-9]{3}"
                    maxLength={3}
                    title="Must be exactly 3 digits"
                    required
                  />
                  <small style={{ color: '#666', fontSize: '0.85rem' }}>
                    Must be exactly 3 digits (e.g., 001, 002, 003)
                  </small>
                </FormGroup>

                <FormGroup>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter category description (optional)"
                  />
                </FormGroup>
              </ModalBody>

              <ModalFooter>
                <SecondaryButton type="button" onClick={closeModal}>
                  Cancel
                </SecondaryButton>
                <PrimaryButton type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <LoadingSpinner />
                      {editingCategory ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check"></i>
                      {editingCategory ? 'Update Category' : 'Create Category'}
                    </>
                  )}
                </PrimaryButton>
              </ModalFooter>
            </form>
          </ModalContainer>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};

export default Categories;