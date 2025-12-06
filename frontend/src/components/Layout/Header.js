import React from 'react';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';

const Header = () => {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: '#fff',
        borderBottom: '1px solid #e0e0e0',
      }}
    >
      <Toolbar sx={{ justifyContent: 'center', py: 1.5 }}>
        <Typography
          variant="h6"
          component="div"
          sx={{
            color: '#000',
            fontWeight: 600,
            fontSize: '1.25rem',
            letterSpacing: '0.5px',
          }}
        >
          Vellparai EnterPrices
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default Header;