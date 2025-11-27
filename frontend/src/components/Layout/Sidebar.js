import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

// Animations
const slideIn = keyframes`
  from { 
    transform: translateX(-100%);
    opacity: 0;
  }
  to { 
    transform: translateX(0);
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
const SidebarContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: ${props => props.$collapsed ? '80px' : '280px'};
  background: linear-gradient(to bottom, #2c3e50, #4a6fa5);
  color: white;
  transition: all 0.3s ease;
  z-index: 1000;
  overflow-y: auto;
  overflow-x: hidden;
  box-shadow: 5px 0 15px rgba(0, 0, 0, 0.1);
  animation: ${slideIn} 0.5s ease-out;

  @media (max-width: 992px) {
    width: ${props => props.$mobileOpen ? '280px' : '0'};
    transform: ${props => props.$mobileOpen ? 'translateX(0)' : 'translateX(-100%)'};
  }

  /* Scrollbar styling */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const SidebarHeader = styled.div`
  padding: 1.5rem 1.5rem 1rem;
  display: flex;
  align-items: center;
  justify-content: ${props => props.$collapsed ? 'center' : 'space-between'};
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  @media (max-width: 992px) {
    padding: 1.2rem 1.2rem 0.8rem;
  }
`;

const Logo = styled.div`
  display: ${props => props.$collapsed ? 'none' : 'flex'};
  align-items: center;
  gap: 0.8rem;
  font-weight: 700;
  font-size: 1.2rem;

  @media (max-width: 992px) {
    display: flex;
  }
`;

const LogoIcon = styled.span`
  animation: ${pulse} 2s infinite;
`;

const ToggleButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 6px;
  color: white;
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    animation: ${bounce} 0.8s ease;
  }

  &.mobile-only {
    position: fixed;
    top: 15px;
    right: 15px;
    z-index: 1001;
    background: linear-gradient(135deg, #2c3e50 0%, #4a6fa5 100%);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);

    @media (min-width: 993px) {
      display: none;
    }
  }
`;

const Nav = styled.nav`
  padding: 1.5rem 1rem;

  @media (max-width: 992px) {
    padding: 1rem 0.8rem;
  }
`;

const NavSection = styled.div`
  margin-bottom: 1.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0 0 1rem 1rem;
  color: rgba(255, 255, 255, 0.6);
  display: ${props => props.$collapsed ? 'none' : 'block'};

  @media (max-width: 992px) {
    display: block;
  }
`;

const NavList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const NavItem = styled.li`
  margin-bottom: 0.5rem;
`;

const NavLink = styled(Link)`
  display: flex;
  align-items: center;
  padding: 0.8rem 1rem;
  color: ${props => props.$active ? 'white' : 'rgba(255, 255, 255, 0.7)'};
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.3s ease;
  position: relative;
  background: ${props => props.$active ? 'rgba(255, 255, 255, 0.15)' : 'transparent'};

  &:hover {
    color: white;
    background: rgba(255, 255, 255, 0.1);
    transform: translateX(5px);
  }

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    height: ${props => props.$active ? '24px' : '0'};
    width: 4px;
    background: linear-gradient(to bottom, #3498db, #2ecc71);
    border-radius: 0 4px 4px 0;
    transition: all 0.3s ease;
  }
`;

const NavIcon = styled.span`
  margin-right: ${props => props.$collapsed ? '0' : '0.8rem'};
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  font-size: 1.1rem;

  @media (max-width: 992px) {
    margin-right: 0.8rem;
    
  }
`;

const NavText = styled.span`
  display: ${props => props.$collapsed ? 'none' : 'block'};
  white-space: nowrap;
  transition: all 0.3s ease;

  @media (max-width: 992px) {
    display: block;
  }
`;

const Tooltip = styled.span`
  position: absolute;
  left: calc(100% + 15px);
  top: 50%;
  transform: translateY(-50%);
  background: #2c3e50;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  z-index: 1001;

  &::before {
    content: '';
    position: absolute;
    left: -6px;
    top: 50%;
    transform: translateY(-50%);
    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
    border-right: 6px solid #2c3e50;
  }
`;

const NavItemWithTooltip = styled.li`
  position: relative;
  margin-bottom: 0.5rem;

  &:hover {
    ${Tooltip} {
      opacity: 1;
      visibility: visible;
    }
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: ${props => props.$visible ? 'block' : 'none'};
  animation: ${fadeIn} 0.3s ease-out;

  @media (min-width: 993px) {
    display: none;
  }
`;

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 992);
  const location = useLocation();

  const toggleSidebar = () => setCollapsed(!collapsed);
  const toggleMobileSidebar = () => setMobileOpen(!mobileOpen);
  const closeMobileSidebar = () => setMobileOpen(false);

  // Detect screen resize
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile sidebar when route changes
  useEffect(() => {
    if (!isDesktop) closeMobileSidebar();
  }, [location, isDesktop]);

  const navItems = [
    {
      section: "Main",
      items: [{ path: "/", icon: "bi-speedometer2", text: "Dashboard" }]
    },
    {
      section: "Management",
      items: [
        { path: "/vendors", icon: "bi-truck", text: "Vendors" },
        { path: "/buyers", icon: "bi-people", text: "Buyers" },
        { path: "/categories", icon: "bi-tags", text: "Categories" },
        { path: "/products", icon: "bi-box", text: "Products" },
        { path: "/combos", icon: "bi-collection", text: "Combos" },
      ]
    },
    {
      section: "Transactions",
      items: [
        { path: "/purchases", icon: "bi-cart-plus", text: "Purchases" },
        { path: "/sales", icon: "bi-cart-check", text: "Sales" },
        { path: "/inventory", icon: "bi-clipboard-data", text: "Inventory" },
      ]
    },
    {
      section: "Reports",
      items: [
        { path: "/reports", icon: "bi-graph-up", text: "Reports" },
        { path: "/profit-loss", icon: "bi-graph-up-arrow", text: "Profit & Loss" },
        { path: "/uploaded-data", icon: "bi-cloud-arrow-down", text: "Uploaded Data" },
      ]
    },
    {
      section: "Returns & Tracking",
      items: [
        { path: "/rto-products", icon: "bi-arrow-return-left", text: "RTO/RPU Products" },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Hamburger */}
      <ToggleButton onClick={toggleMobileSidebar} className="mobile-only">
        <i className="bi bi-list"></i>
      </ToggleButton>

      {/* Overlay (mobile only) */}
      <Overlay $visible={mobileOpen} onClick={closeMobileSidebar} />

      {/* Sidebar */}
      <SidebarContainer $collapsed={isDesktop ? collapsed : false} $mobileOpen={mobileOpen}>
        <SidebarHeader $collapsed={collapsed}>
          <Logo $collapsed={collapsed}>
            <LogoIcon>
              <i className="bi bi-box-seam"></i>
            </LogoIcon>
            {!collapsed && "Inventory"}
          </Logo>

          {/* Desktop collapse toggle */}
          {isDesktop && (
            <ToggleButton onClick={toggleSidebar}>
              <i className={collapsed ? "bi bi-arrow-right-circle" : "bi bi-arrow-left-circle"}></i>
            </ToggleButton>
          )}
        </SidebarHeader>

        <Nav>
          {navItems.map((section, index) => (
            <NavSection key={index}>
              <SectionTitle $collapsed={collapsed}>{section.section}</SectionTitle>
              <NavList>
                {section.items.map((item, itemIndex) => {
                  const isActive = location.pathname === item.path;

                  if (collapsed && isDesktop) {
                    return (
                      <NavItemWithTooltip key={itemIndex}>
                        <NavLink to={item.path} $active={isActive}>
                          <NavIcon>
                            <i className={item.icon}></i>
                          </NavIcon>
                          <Tooltip>{item.text}</Tooltip>
                        </NavLink>
                      </NavItemWithTooltip>
                    );
                  }

                  return (
                    <NavItem key={itemIndex}>
                      <NavLink to={item.path} $active={isActive}>
                        <NavIcon $collapsed={collapsed}>
                          <i className={item.icon}></i>
                        </NavIcon>
                        <NavText $collapsed={collapsed}>{item.text}</NavText>
                      </NavLink>
                    </NavItem>
                  );
                })}
              </NavList>
            </NavSection>
          ))}
        </Nav>
      </SidebarContainer>
    </>
  );
};

export default Sidebar;
