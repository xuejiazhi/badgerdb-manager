import apiClient from './apiClient';

// 定义数据结构类型
export interface BadgerDBEntry {
  key: string;
  value: string;
}

// 获取所有数据
// 修改getAllData函数以支持分页参数
export const getAllData = async (page: number = 1, pageSize: number = 10): Promise<{items: BadgerDBEntry[], total: number}> => {
  try {
    const response = await apiClient.get<{items: BadgerDBEntry[], total: number}>(`/list?page=${page}&page_size=${pageSize}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

// 根据键获取数据
export const getDataByKey = async (key: string): Promise<BadgerDBEntry> => {
  try {
    const response = await apiClient.get<string>(`/get/${key}`);
    // 构造包含key和value的对象
    return { key: key, value: response.data };
  } catch (error) {
    console.error(`Error fetching data for key ${key}:`, error);
    throw error;
  }
};

// 搜索数据
export const searchDataByKey = async (keyword: string, page: number = 1, pageSize: number = 10): Promise<{items: BadgerDBEntry[], total: number}> => {
  try {
    const response = await apiClient.get<{items: BadgerDBEntry[], total: number}>(`/search?keyword=${keyword}&page=${page}&page_size=${pageSize}`);
    return response.data;
  } catch (error) {
    console.error('Error searching data:', error);
    throw error;
  }
};

// 添加新数据
export const addData = async (entry: BadgerDBEntry): Promise<void> => {
  try {
    await apiClient.post('/set', entry);
  } catch (error) {
    console.error('Error adding data:', error);
    throw error;
  }
};

// 更新数据
export const updateData = async (entry: BadgerDBEntry): Promise<void> => {
  try {
    await apiClient.put(`/set/${entry.key}`, entry);
  } catch (error) {
    console.error(`Error updating data for key ${entry.key}:`, error);
    throw error;
  }
};

// 删除数据
export const deleteData = async (key: string): Promise<void> => {
  try {
    await apiClient.delete(`/delete/${key}`);
  } catch (error) {
    console.error(`Error deleting data for key ${key}:`, error);
    throw error;
  }
};