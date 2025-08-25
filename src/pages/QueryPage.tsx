import React, { useState, useEffect } from 'react';
import { deleteData, getDataByKey, BadgerDBEntry, getAllData, searchDataByKey } from '../services/badgerDbService';
import DataFormDialog from '../components/DataFormDialog';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Pagination,
  PaginationItem,
  TextField
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';

const QueryPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<any | null>(null);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<any | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10); // 固定每页大小为10
  const [total, setTotal] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);

// 修改fetchPaginatedData函数以确保data始终是数组
const fetchPaginatedData = async (page: number) => {
  setLoading(true);
  setError(null);
  
  try {
    let result;
    if (isSearching && searchKeyword) {
      result = await searchDataByKey(searchKeyword, page, pageSize);
    } else {
      result = await getAllData(page, pageSize);
    }
    // 确保result.items是数组，如果不是则设置为空数组
    setData(Array.isArray(result.items) ? result.items : []);
    setTotal(result.total);
    setLoading(false);
  } catch (err) {
    setError('Failed to fetch data from the server');
    // 在错误情况下，确保data被设置为空数组而不是null
    setData([]);
    setLoading(false);
  }
};

  useEffect(() => {
    fetchPaginatedData(page);
  }, [page, isSearching, searchKeyword]);

  const handleDeleteClick = (entry: BadgerDBEntry) => {
    setEntryToDelete(entry);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!entryToDelete) return;
    
    try {
      await deleteData(entryToDelete.key);
      fetchPaginatedData(page); // Refresh data
      setDeleteDialogOpen(false);
      setEntryToDelete(null);
    } catch (err) {
      setError('Failed to delete entry');
    }
  };

  const handleEditClick = async (entry: BadgerDBEntry) => {
    try {
      // 使用key获取完整的数据
      const fullEntry = await getDataByKey(entry.key);
      setEntryToEdit(fullEntry);
      setFormDialogOpen(true);
    } catch (err) {
      setError('Failed to fetch entry data');
    }
  };

  const handleAddClick = () => {
    setEntryToEdit(undefined);
    setFormDialogOpen(true);
  };

  const handleFormSubmit = () => {
    fetchPaginatedData(page); // Refresh data
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleSearch = () => {
    if (searchKeyword.trim()) {
      setIsSearching(true);
      setPage(1); // Reset to first page when searching
    } else {
      setIsSearching(false);
      setPage(1); // Reset to first page when clearing search
    }
  };

  const handleClearSearch = () => {
    setSearchKeyword('');
    setIsSearching(false);
    setPage(1); // Reset to first page when clearing search
  };

  // 计算总页数
  const totalPages = Math.ceil(total / pageSize);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          BadgerDB Data
        </Typography>
        <Box>
          <Button variant="contained" onClick={() => fetchPaginatedData(page)} sx={{ mr: 1 }}>
            Refresh Data
          </Button>
          <Button variant="contained" onClick={handleAddClick}>
            Add New
          </Button>
        </Box>
      </Box>
      
      {/* 搜索框 */}
      <Box sx={{ display: 'flex', mb: 2 }}>
        <TextField
          variant="outlined"
          placeholder="Enter key to search"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          sx={{ mr: 1, flexGrow: 1 }}
        />
        <Button
          variant="contained"
          startIcon={<SearchIcon />}
          onClick={handleSearch}
          sx={{ mr: 1 }}
        >
          Search
        </Button>
        <Button
          variant="outlined"
          onClick={handleClearSearch}
        >
          Clear
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="badgerdb data table">
              <TableHead>
                <TableRow>
                  <TableCell>Key</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((entry, index) => (
                  <TableRow
                    key={index}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {entry.key}
                    </TableCell>
                    <TableCell>{entry.value}</TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => handleEditClick(entry)} size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteClick(entry)} size="small">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* 分页控件 */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              variant="outlined"
              shape="rounded"
              renderItem={(item) => (
                <PaginationItem
                  {...item}
                />
              )}
            />
          </Box>
        </>
      )}
      
      {/* 删除确认对话框 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete the entry with key "{entryToDelete?.key}"?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
      
      {/* 数据表单对话框 */}
      <DataFormDialog
        open={formDialogOpen}
        onClose={() => setFormDialogOpen(false)}
        onSubmit={handleFormSubmit}
        entry={entryToEdit}
      />
    </Container>
  );
};

export default QueryPage;