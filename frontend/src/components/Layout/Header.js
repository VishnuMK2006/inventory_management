import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';

// Animations
const slideDown = keyframes`
  from { 
    transform: translateY(-100%);
    opacity: 0;
  }
  to { 
    transform: translateY(0);
    opacity: 1;
  }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
  40% {transform: translateY(-5px);}
  60% {transform: translateY(-3px);}
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

// Styled Components
const HeaderContainer = styled.header`
  background: linear-gradient(135deg, #2c3e50 0%, #4a6fa5 100%);
  color: white;
  padding: 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  position: sticky;
  top: 0;
  z-index: 1000;
  animation: ${slideDown} 0.5s ease-out;
`;

const Nav = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  
  @media (max-width: 992px) {
    padding: 0.7rem 1.2rem;
  }
  
  @media (max-width: 768px) {
    padding: 0.6rem 1rem;
  }
`;

const Brand = styled.a`
  display: flex;
  align-items: center;
  text-decoration: none;
  color: white;
  font-weight: 700;
  font-size: 1.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    color: #3498db;
    transform: translateY(-2px);
  }
  
  @media (max-width: 992px) {
    font-size: 1.4rem;
  }
  
  @media (max-width: 768px) {
    font-size: 1.3rem;
  }
  
  @media (max-width: 576px) {
    font-size: 1.2rem;
  }
`;

const BrandIcon = styled.span`
  margin-right: 0.7rem;
  display: flex;
  align-items: center;
  animation: ${pulse} 2s infinite;
  
  @media (max-width: 576px) {
    margin-right: 0.5rem;
  }
`;

const NavItems = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  
  @media (max-width: 768px) {
    gap: 1rem;
  }
`;

const NavLink = styled.a`
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 0.8rem;
  border-radius: 6px;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    color: white;
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
    
    &::after {
      width: 100%;
      left: 0;
    }
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 50%;
    width: 0;
    height: 2px;
    background: linear-gradient(to right, #3498db, #2ecc71);
    transition: all 0.3s ease;
  }
  
  &.active {
    color: white;
    
    &::after {
      width: 100%;
      left: 0;
    }
  }
  
  @media (max-width: 992px) {
    font-size: 0.95rem;
    padding: 0.4rem 0.7rem;
  }
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    animation: ${bounce} 0.8s ease;
  }
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const UserMenu = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
`;

const UserButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50px;
  padding: 0.5rem 1rem;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }
  
  @media (max-width: 576px) {
    span {
      display: none;
    }
    
    padding: 0.6rem;
  }
`;

const NotificationBadge = styled.span`
  position: relative;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    animation: ${bounce} 0.8s ease;
  }
`;

const Badge = styled.span`
  position: absolute;
  top: -5px;
  right: -5px;
  background: #e74c3c;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: bold;
  animation: ${pulse} 2s infinite;
`;

const MobileMenu = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isOpen'
})`
  display: ${props => props.isOpen ? 'flex' : 'none'};
  flex-direction: column;
  background: linear-gradient(135deg, #2c3e50 0%, #4a6fa5 100%);
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  padding: 1rem;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  animation: ${fadeIn} 0.3s ease-out;
  z-index: 999;
  
  @media (min-width: 769px) {
    display: none;
  }
`;

const MobileNavLink = styled.a`
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  font-weight: 500;
  padding: 1rem;
  border-radius: 6px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  
  &:hover {
    color: white;
    background: rgba(255, 255, 255, 0.1);
    padding-left: 1.2rem;
  }
  
  &.active {
    color: white;
    background: rgba(255, 255, 255, 0.15);
  }
`;

const SearchContainer = styled.div`
  position: relative;
  margin: 0 1rem;
  
  @media (max-width: 992px) {
    display: none;
  }
`;

const SearchInput = styled.input`
  padding: 0.6rem 1rem 0.6rem 2.5rem;
  border-radius: 50px;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  width: 250px;
  transition: all 0.3s ease;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }
  
  &:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.25);
    width: 300px;
  }
`;

const SearchIcon = styled.span`
  position: absolute;
  left: 0.8rem;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.7);
`;

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications] = useState(3);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <>
      <HeaderContainer style={{ 
        background: scrolled 
          ? 'linear-gradient(135deg, #2c3e50 0%, #4a6fa5 100%)' 
          : 'linear-gradient(135deg, #2c3e50 0%, #4a6fa5 100%)',
        boxShadow: scrolled 
          ? '0 4px 20px rgba(0, 0, 0, 0.15)' 
          : 'none'
      }}>
        <Nav>
          <Brand href="/">
            <BrandIcon>
              <i className="bi bi-box-seam"></i>
            </BrandIcon>
            Inventory Management System
          </Brand>
          
          <SearchContainer>
            <SearchInput type="text" placeholder="Search..." />
            <SearchIcon>
              <i className="bi bi-search"></i>
            </SearchIcon>
          </SearchContainer>
{/*           
          <NavItems>
            <NavLink href="#" className="active">
              <i className="bi bi-speedometer2"></i>
              Dashboard
            </NavLink>
            <NavLink href="#">
              <i className="bi bi-clipboard-data"></i>
              Reports
            </NavLink>
            <NavLink href="#">
              <i className="bi bi-bell"></i>
              Alerts
            </NavLink>
            
            <NotificationBadge>
              <i className="bi bi-bell-fill"></i>
              {notifications > 0 && <Badge>{notifications}</Badge>}
            </NotificationBadge>
            
            <UserMenu>
              <UserButton>
                <i className="bi bi-person-circle"></i>
                <span>Admin User</span>
              </UserButton>
            </UserMenu>
            
            <MobileMenuButton onClick={toggleMobileMenu}>
              <i className={mobileMenuOpen ? "bi bi-x-lg" : "bi bi-list"}></i>
            </MobileMenuButton>
          </NavItems> */ }
        </Nav>
        
        <MobileMenu isOpen={mobileMenuOpen}>
          <MobileNavLink href="#" className="active">
            <i className="bi bi-speedometer2"></i>
            Dashboard
          </MobileNavLink>
          <MobileNavLink href="#">
            <i className="bi bi-clipboard-data"></i>
            Reports
          </MobileNavLink>
          <MobileNavLink href="#">
            <i className="bi bi-box-seam"></i>
            Inventory
          </MobileNavLink>
          <MobileNavLink href="#">
            <i className="bi bi-bell"></i>
            Alerts
            {notifications > 0 && <Badge>{notifications}</Badge>}
          </MobileNavLink>
          <MobileNavLink href="#">
            <i className="bi bi-gear"></i>
            Settings
          </MobileNavLink>
          <MobileNavLink href="#">
            <i className="bi bi-box-arrow-right"></i>
            Logout
          </MobileNavLink>
        </MobileMenu>
      </HeaderContainer>
    </>
  );
};

export default Header;