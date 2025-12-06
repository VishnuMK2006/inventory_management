import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  IconButton,
  Avatar,
  Tooltip,
  useTheme,
  useMediaQuery,
  Divider,
  Fade,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Store as StoreIcon,
  People as PeopleIcon,
  Category as CategoryIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalMall as LocalMallIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  CloudDownload as CloudDownloadIcon,
  Undo as UndoIcon,
  Menu as MenuIcon,
  Home as HomeIcon,
  ShoppingBag as ShoppingBagIcon,
  TableChart as TableChartIcon,
  Settings as SettingsIcon,
  Collections as CollectionsIcon,
} from '@mui/icons-material';

const drawerWidth = 80;

const Sidebar = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMobileSidebar = () => setMobileOpen(!mobileOpen);
  const closeMobileSidebar = () => setMobileOpen(false);

  // Close mobile sidebar when route changes
  useEffect(() => {
    if (isMobile) closeMobileSidebar();
  }, [location, isMobile]);

  const navItems = [
    // { path: '/', icon: <Box>Logo</Box>, text: 'Logo', isLogo: true },
    { path: '/', icon: <HomeIcon />, text: 'Dashboard' },
    { path: '/vendors', icon: <StoreIcon />, text: 'Vendors' },
    { path: '/buyers', icon: <PeopleIcon />, text: 'Buyers' },
    { path: '/categories', icon: <CategoryIcon />, text: 'Categories' },
    { path: '/products', icon: <ShoppingBagIcon />, text: 'Products' },
    { path: '/combos', icon: <CollectionsIcon />, text: 'Combos' },
    { path: '/purchases', icon: <ShoppingCartIcon />, text: 'Purchases' },
    { path: '/sales', icon: <LocalMallIcon />, text: 'Sales' },
    { path: '/inventory', icon: <InventoryIcon />, text: 'Inventory' },
    { path: '/reports', icon: <TableChartIcon />, text: 'Reports' },
    { path: '/profit-loss', icon: <TrendingUpIcon />, text: 'Profit & Loss' },
    { path: '/uploaded-data', icon: <CloudDownloadIcon />, text: 'Uploaded Data' },
    { path: '/rto-products', icon: <UndoIcon />, text: 'RTO/RPU' },
  ];

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#fafafa',
        borderRight: '1px solid #e0e0e0',
        overflowY: 'auto',
        overflowX: 'hidden',
        '&::-webkit-scrollbar': {
          display: 'none',
        },
        '-ms-overflow-style': 'none',
        'scrollbarWidth': 'none',
      }}
    >
      {/* Main Navigation */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 3 }}>
        <List sx={{ width: '100%', px: 1.5 }}>
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <Fade in={true} timeout={300 + index * 50} key={item.path + index}>
                <ListItem disablePadding sx={{ mb: 2 }}>
                  <Tooltip title={item.text} placement="right" arrow>
                    <ListItemButton
                      onClick={() => navigate(item.path)}
                      sx={{
                        minHeight: 48,
                        justifyContent: 'center',
                        px: 0,
                        py: 1.5,
                        borderRadius: '15px',
                        width: 48,
                        height: 48,
                        mx: 'auto',
                        bgcolor: isActive ? '#000' : '#fff',
                        color: isActive ? '#fff' : '#000',
                        boxShadow: isActive
                          ? '0 4px 8px rgba(0,0,0,0.15)'
                          : '0 2px 4px rgba(0,0,0,0.08)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          bgcolor: isActive ? '#000' : '#f5f5f5',
                          transform: 'scale(1.05)',
                          boxShadow: isActive
                            ? '0 6px 12px rgba(0,0,0,0.2)'
                            : '0 4px 8px rgba(0,0,0,0.12)',
                        },
                      }}
                    >
                      {React.cloneElement(item.icon, {
                        sx: {
                          fontSize: 24,
                          color: isActive ? '#fff' : '#000',
                        },
                      })}
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
              </Fade>
            );
          })}
        </List>
      </Box>

      {/* Bottom Section - Settings and User */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pb: 3, gap: 2 }}>
        <Divider sx={{ width: '60%', mb: 1 }} />
        
        {/* Settings Icon */}
        <Tooltip title="Settings" placement="right" arrow>
          <IconButton
            sx={{
              width: 48,
              height: 48,
              bgcolor: '#fff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                bgcolor: '#f5f5f5',
                transform: 'scale(1.05)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.12)',
              },
            }}
          >
            <SettingsIcon sx={{ fontSize: 24, color: '#000' }} />
          </IconButton>
        </Tooltip>

        {/* User Avatar */}
        <Tooltip title="Profile" placement="right" arrow>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.12)',
              },
            }}
            src="/api/placeholder/48/48"
            alt="User"
          />
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && (
        <IconButton
          onClick={toggleMobileSidebar}
          sx={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 1300,
            bgcolor: '#000',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            '&:hover': {
              bgcolor: '#333',
            },
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

      {/* Desktop Drawer */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              border: 'none',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={closeMobileSidebar}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}
    </>
  );
};

export default Sidebar;
