import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '../services/apiService';

// Async thunks для работы с API
export const fetchArticles = createAsyncThunk(
  'articles/fetchArticles',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await apiService.get('/articles/articles/', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка при загрузке статей');
    }
  }
);

export const fetchArticleBySlug = createAsyncThunk(
  'articles/fetchArticleBySlug',
  async (slug, { rejectWithValue }) => {
    try {
      const response = await apiService.get(`/articles/articles/${slug}/`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка при загрузке статьи');
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'articles/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.get('/articles/categories/');
      return response.data.results || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка при загрузке категорий');
    }
  }
);

export const fetchTags = createAsyncThunk(
  'articles/fetchTags',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.get('/articles/tags/');
      return response.data.results || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка при загрузке тегов');
    }
  }
);

export const createArticle = createAsyncThunk(
  'articles/createArticle',
  async (articleData, { rejectWithValue }) => {
    try {
      const response = await apiService.post('/articles/articles/', articleData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка при создании статьи');
    }
  }
);

export const updateArticle = createAsyncThunk(
  'articles/updateArticle',
  async ({ slug, articleData }, { rejectWithValue }) => {
    try {
      const response = await apiService.put(`/articles/articles/${slug}/`, articleData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка при обновлении статьи');
    }
  }
);

export const deleteArticle = createAsyncThunk(
  'articles/deleteArticle',
  async (articleId, { rejectWithValue }) => {
    try {
      await apiService.delete(`/articles/articles/${articleId}/`);
      return articleId;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка при удалении статьи');
    }
  }
);

export const toggleArticlePublish = createAsyncThunk(
  'articles/toggleArticlePublish',
  async ({ articleId, isPublished }, { rejectWithValue }) => {
    try {
      const endpoint = isPublished ? 'unpublish' : 'publish';
      const response = await apiService.post(`/articles/articles/${articleId}/${endpoint}/`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка при изменении статуса публикации');
    }
  }
);

const initialState = {
  // Список статей
  articles: [],
  totalArticles: 0,
  currentPage: 1,
  totalPages: 1,
  
  // Текущая статья
  currentArticle: null,
  
  // Категории и теги
  categories: [],
  tags: [],
  
  // Фильтры и поиск
  filters: {
    category: '',
    search: '',
    isPublished: null
  },
  
  // Состояния загрузки
  loading: {
    articles: false,
    currentArticle: false,
    categories: false,
    tags: false,
    creating: false,
    updating: false,
    deleting: false,
    publishing: false
  },
  
  // Ошибки
  errors: {
    articles: null,
    currentArticle: null,
    categories: null,
    tags: null,
    creating: null,
    updating: null,
    deleting: null,
    publishing: null
  }
};

const articlesSlice = createSlice({
  name: 'articles',
  initialState,
  reducers: {
    // Очистка ошибок
    clearErrors: (state) => {
      state.errors = {
        articles: null,
        currentArticle: null,
        categories: null,
        tags: null,
        creating: null,
        updating: null,
        deleting: null,
        publishing: null
      };
    },
    
    // Очистка текущей статьи
    clearCurrentArticle: (state) => {
      state.currentArticle = null;
      state.errors.currentArticle = null;
    },
    
    // Обновление фильтров
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.currentPage = 1; // Сброс на первую страницу при изменении фильтров
    },
    
    // Обновление текущей страницы
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    
    // Сброс фильтров
    resetFilters: (state) => {
      state.filters = {
        category: '',
        search: '',
        isPublished: null
      };
      state.currentPage = 1;
    }
  },
  extraReducers: (builder) => {
    // Загрузка списка статей
    builder
      .addCase(fetchArticles.pending, (state) => {
        state.loading.articles = true;
        state.errors.articles = null;
      })
      .addCase(fetchArticles.fulfilled, (state, action) => {
        state.loading.articles = false;
        
        if (action.payload.results) {
          // Пагинированный ответ
          state.articles = action.payload.results;
          state.totalArticles = action.payload.count;
          state.totalPages = Math.ceil(action.payload.count / 20);
        } else {
          // Простой массив
          state.articles = action.payload;
          state.totalArticles = action.payload.length;
          state.totalPages = 1;
        }
      })
      .addCase(fetchArticles.rejected, (state, action) => {
        state.loading.articles = false;
        state.errors.articles = action.payload;
      });

    // Загрузка статьи по slug
    builder
      .addCase(fetchArticleBySlug.pending, (state) => {
        state.loading.currentArticle = true;
        state.errors.currentArticle = null;
      })
      .addCase(fetchArticleBySlug.fulfilled, (state, action) => {
        state.loading.currentArticle = false;
        state.currentArticle = action.payload;
      })
      .addCase(fetchArticleBySlug.rejected, (state, action) => {
        state.loading.currentArticle = false;
        state.errors.currentArticle = action.payload;
      });

    // Загрузка категорий
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading.categories = true;
        state.errors.categories = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading.categories = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading.categories = false;
        state.errors.categories = action.payload;
      });

    // Загрузка тегов
    builder
      .addCase(fetchTags.pending, (state) => {
        state.loading.tags = true;
        state.errors.tags = null;
      })
      .addCase(fetchTags.fulfilled, (state, action) => {
        state.loading.tags = false;
        state.tags = action.payload;
      })
      .addCase(fetchTags.rejected, (state, action) => {
        state.loading.tags = false;
        state.errors.tags = action.payload;
      });

    // Создание статьи
    builder
      .addCase(createArticle.pending, (state) => {
        state.loading.creating = true;
        state.errors.creating = null;
      })
      .addCase(createArticle.fulfilled, (state, action) => {
        state.loading.creating = false;
        // Добавляем новую статью в начало списка
        state.articles.unshift(action.payload);
        state.totalArticles += 1;
      })
      .addCase(createArticle.rejected, (state, action) => {
        state.loading.creating = false;
        state.errors.creating = action.payload;
      });

    // Обновление статьи
    builder
      .addCase(updateArticle.pending, (state) => {
        state.loading.updating = true;
        state.errors.updating = null;
      })
      .addCase(updateArticle.fulfilled, (state, action) => {
        state.loading.updating = false;
        
        // Обновляем статью в списке
        const index = state.articles.findIndex(article => article.id === action.payload.id);
        if (index !== -1) {
          state.articles[index] = action.payload;
        }
        
        // Обновляем текущую статью если она загружена
        if (state.currentArticle && state.currentArticle.id === action.payload.id) {
          state.currentArticle = action.payload;
        }
      })
      .addCase(updateArticle.rejected, (state, action) => {
        state.loading.updating = false;
        state.errors.updating = action.payload;
      });

    // Удаление статьи
    builder
      .addCase(deleteArticle.pending, (state) => {
        state.loading.deleting = true;
        state.errors.deleting = null;
      })
      .addCase(deleteArticle.fulfilled, (state, action) => {
        state.loading.deleting = false;
        
        // Удаляем статью из списка
        state.articles = state.articles.filter(article => article.id !== action.payload);
        state.totalArticles -= 1;
        
        // Очищаем текущую статью если она была удалена
        if (state.currentArticle && state.currentArticle.id === action.payload) {
          state.currentArticle = null;
        }
      })
      .addCase(deleteArticle.rejected, (state, action) => {
        state.loading.deleting = false;
        state.errors.deleting = action.payload;
      });

    // Переключение статуса публикации
    builder
      .addCase(toggleArticlePublish.pending, (state) => {
        state.loading.publishing = true;
        state.errors.publishing = null;
      })
      .addCase(toggleArticlePublish.fulfilled, (state, action) => {
        state.loading.publishing = false;
        
        // Обновляем статью в списке
        const index = state.articles.findIndex(article => article.id === action.payload.id);
        if (index !== -1) {
          state.articles[index] = action.payload;
        }
        
        // Обновляем текущую статью если она загружена
        if (state.currentArticle && state.currentArticle.id === action.payload.id) {
          state.currentArticle = action.payload;
        }
      })
      .addCase(toggleArticlePublish.rejected, (state, action) => {
        state.loading.publishing = false;
        state.errors.publishing = action.payload;
      });
  }
});

export const {
  clearErrors,
  clearCurrentArticle,
  updateFilters,
  setCurrentPage,
  resetFilters
} = articlesSlice.actions;

// Селекторы
export const selectArticles = (state) => state.articles.articles;
export const selectCurrentArticle = (state) => state.articles.currentArticle;
export const selectCategories = (state) => state.articles.categories;
export const selectTags = (state) => state.articles.tags;
export const selectFilters = (state) => state.articles.filters;
export const selectCurrentPage = (state) => state.articles.currentPage;
export const selectTotalPages = (state) => state.articles.totalPages;
export const selectLoading = (state) => state.articles.loading;
export const selectErrors = (state) => state.articles.errors;

export default articlesSlice.reducer;