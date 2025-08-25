package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/dgraph-io/badger/v4"
)

var db *badger.DB

func initDB() {
	var err error
	db, err = badger.Open(badger.DefaultOptions("./badger"))
	if err != nil {
		log.Fatal(err)
	}
}

func closeDB() {
	if db != nil {
		db.Close()
	}
}

// CORS中间件
func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 设置CORS头部
		w.Header().Set("Access-Control-Allow-Origin", "*") // 在生产环境中应该指定具体的域名
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// 处理预检请求
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		// 调用下一个处理函数
		next(w, r)
	}
}

func main() {
	initDB()
	defer closeDB()

	// 使用CORS中间件包装处理函数
	http.HandleFunc("/set", corsMiddleware(setHandler))
	http.HandleFunc("/set/", corsMiddleware(setPutHandler)) // 添加这一行
	http.HandleFunc("/get/", corsMiddleware(getHandler))
	http.HandleFunc("/delete/", corsMiddleware(deleteHandler))
	http.HandleFunc("/list", corsMiddleware(listHandler))
	http.HandleFunc("/search", corsMiddleware(searchHandler))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("Server is running on port %s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func setHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST method is allowed", http.StatusMethodNotAllowed)
		return
	}

	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	var req map[string]string
	err = json.Unmarshal(body, &req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if _, ok := req["key"]; !ok {
		http.Error(w, "Key is required", http.StatusBadRequest)
		return
	}
	if _, ok := req["value"]; !ok {
		http.Error(w, "Value is required", http.StatusBadRequest)
		return
	}

	key := req["key"]
	value := req["value"]

	if key == "" || value == "" {
		http.Error(w, "Key and value are required", http.StatusBadRequest)
		return
	}

	err = db.Update(func(txn *badger.Txn) error {
		return txn.Set([]byte(key), []byte(value))
	})

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	fmt.Fprintf(w, "Key '%s' set successfully", key)
}

func setPutHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Only PUT method is allowed", http.StatusMethodNotAllowed)
		return
	}

	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	var req map[string]string
	err = json.Unmarshal(body, &req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if _, ok := req["key"]; !ok {
		http.Error(w, "Key is required", http.StatusBadRequest)
		return
	}
	if _, ok := req["value"]; !ok {
		http.Error(w, "Value is required", http.StatusBadRequest)
		return
	}

	key := req["key"]
	value := req["value"]

	if key == "" || value == "" {
		http.Error(w, "Key and value are required", http.StatusBadRequest)
		return
	}

	err = db.Update(func(txn *badger.Txn) error {
		return txn.Set([]byte(key), []byte(value))
	})

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	fmt.Fprintf(w, "Key '%s' set successfully", key)
}

func getHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Only GET method is allowed", http.StatusMethodNotAllowed)
		return
	}

	key := r.URL.Path[len("/get/"):] // Extract key from URL path
	if key == "" {
		http.Error(w, "Key is required", http.StatusBadRequest)
		return
	}

	var value []byte
	err := db.View(func(txn *badger.Txn) error {
		item, err := txn.Get([]byte(key))
		if err != nil {
			return err
		}
		value, err = item.ValueCopy(nil)
		return err
	})

	if err != nil {
		if err == badger.ErrKeyNotFound {
			http.Error(w, "Key not found", http.StatusNotFound)
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	fmt.Fprintf(w, "%s", value)
}

func deleteHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Only DELETE method is allowed", http.StatusMethodNotAllowed)
		return
	}

	key := r.URL.Path[len("/delete/"):] // Extract key from URL path
	if key == "" {
		http.Error(w, "Key is required", http.StatusBadRequest)
		return
	}

	err := db.Update(func(txn *badger.Txn) error {
		return txn.Delete([]byte(key))
	})

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	fmt.Fprintf(w, "Key '%s' deleted successfully", key)
}

// 分页查询所有数据
func listHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Only GET method is allowed", http.StatusMethodNotAllowed)
		return
	}

	// 获取分页参数
	page, err := strconv.Atoi(r.URL.Query().Get("page"))
	if err != nil || page < 1 {
		page = 1
	}

	pageSize, err := strconv.Atoi(r.URL.Query().Get("page_size"))
	if err != nil || pageSize < 1 {
		pageSize = 10 // 默认每页10条数据
	}

	// 计算偏移量
	offset := (page - 1) * pageSize

	// 存储查询结果
	var items []KeyValue
	var count int

	// 首先计算总数
	err = db.View(func(txn *badger.Txn) error {
		opts := badger.DefaultIteratorOptions
		it := txn.NewIterator(opts)
		defer it.Close()

		// 遍历所有元素计算总数
		for it.Rewind(); it.Valid(); it.Next() {
			count++
		}
		return nil
	})

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// 获取当前页面的数据
	err = db.View(func(txn *badger.Txn) error {
		opts := badger.DefaultIteratorOptions
		opts.PrefetchSize = 100 // 预取100个键值对
		it := txn.NewIterator(opts)
		defer it.Close()

		// 跳过前面offset个元素
		var i int
		for it.Rewind(); it.Valid(); it.Next() {
			if i < offset {
				i++
				continue
			}

			// 达到页面大小限制时停止
			if len(items) >= pageSize {
				break
			}

			item := it.Item()
			k := item.Key()
			v, err := item.ValueCopy(nil)
			if err != nil {
				return err
			}

			items = append(items, KeyValue{Key: string(k), Value: string(v)})
			i++
		}
		return nil
	})

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// 构造响应
	response := ListResponse{
		Items:    items,
		Page:     page,
		PageSize: pageSize,
		Total:    count,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// 根据key进行模糊匹配查询
func searchHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Only GET method is allowed", http.StatusMethodNotAllowed)
		return
	}

	// 获取搜索关键字
	keyword := r.URL.Query().Get("keyword")
	if keyword == "" {
		http.Error(w, "Keyword is required", http.StatusBadRequest)
		return
	}

	// 获取分页参数
	page, err := strconv.Atoi(r.URL.Query().Get("page"))
	if err != nil || page < 1 {
		page = 1
	}

	pageSize, err := strconv.Atoi(r.URL.Query().Get("page_size"))
	if err != nil || pageSize < 1 {
		pageSize = 10 // 默认每页10条数据
	}

	// 计算偏移量
	offset := (page - 1) * pageSize

	// 存储查询结果
	var items []KeyValue
	var count int

	// 首先计算匹配条件的总数
	err = db.View(func(txn *badger.Txn) error {
		opts := badger.DefaultIteratorOptions
		it := txn.NewIterator(opts)
		defer it.Close()

		// 遍历所有元素，计算匹配搜索条件的总数
		for it.Rewind(); it.Valid(); it.Next() {
			item := it.Item()
			k := item.Key()
			keyStr := string(k)

			// 检查key是否包含关键字
			if strings.Contains(keyStr, keyword) {
				count++
			}
		}
		return nil
	})

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// 获取当前页面的数据
	err = db.View(func(txn *badger.Txn) error {
		opts := badger.DefaultIteratorOptions
		opts.PrefetchSize = 100 // 预取100个键值对
		it := txn.NewIterator(opts)
		defer it.Close()

		// 跳过前面offset个元素
		var i int
		for it.Rewind(); it.Valid(); it.Next() {
			item := it.Item()
			k := item.Key()
			keyStr := string(k)

			// 检查key是否包含关键字
			if strings.Contains(keyStr, keyword) {
				// 只处理匹配的元素
				if i < offset {
					i++
					continue
				}

				// 达到页面大小限制时停止
				if len(items) >= pageSize {
					break
				}

				v, err := item.ValueCopy(nil)
				if err != nil {
					return err
				}

				items = append(items, KeyValue{Key: keyStr, Value: string(v)})
				i++
			}
		}
		return nil
	})

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// 构造响应
	response := ListResponse{
		Items:    items,
		Page:     page,
		PageSize: pageSize,
		Total:    count,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// KeyValue 表示键值对结构
type KeyValue struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

// ListResponse 表示分页查询响应结构
type ListResponse struct {
	Items    []KeyValue `json:"items"`
	Page     int        `json:"page"`
	PageSize int        `json:"page_size"`
	Total    int        `json:"total"`
}

type SearchResponse struct {
	Items []KeyValue `json:"items"`
}
