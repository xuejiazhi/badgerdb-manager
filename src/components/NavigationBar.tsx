import React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

interface NavigationBarProps {
  onQueryClick: () => void;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ onQueryClick }) => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            BadgerDB Manager
          </Typography>
          <Button color="inherit" onClick={onQueryClick}>
            Query Data
          </Button>
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default NavigationBar;