import React from 'react';
import NavigationBar from './components/NavigationBar';
import QueryPage from './pages/QueryPage';
import { Box } from '@mui/material';

const App: React.FC = () => {
  const handleQueryClick = () => {
    // 这里可以添加查询逻辑
    console.log('Query button clicked');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <NavigationBar onQueryClick={handleQueryClick} />
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <QueryPage />
      </Box>
    </Box>
  );
};

export default App;