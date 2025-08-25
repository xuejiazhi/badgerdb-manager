import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert
} from '@mui/material';
import { BadgerDBEntry, addData, updateData } from '../services/badgerDbService';

interface DataFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  entry?: BadgerDBEntry;
}

const DataFormDialog: React.FC<DataFormDialogProps> = ({ open, onClose, onSubmit, entry }) => {
  const [key, setKey] = useState(entry?.key || '');
  const [value, setValue] = useState(entry?.value || '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const isEditing = !!entry;

  // 添加useEffect来监听entry变化并更新状态
  useEffect(() => {
    if (entry) {
      setKey(entry.key);
      setValue(entry.value);
    } else {
      setKey('');
      setValue('');
    }
  }, [entry]);

  const handleSubmit = async () => {
    if (!key || !value) {
      setError('Both key and value are required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      if (isEditing) {
        await updateData({ key, value });
      } else {
        await addData({ key, value });
      }
      onSubmit();
      handleClose();
    } catch (err) {
      setError('Failed to save data');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setKey('');
    setValue('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEditing ? 'Edit Entry' : 'Add New Entry'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Key"
            type="text"
            fullWidth
            variant="outlined"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            disabled={isEditing}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Value"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default DataFormDialog;