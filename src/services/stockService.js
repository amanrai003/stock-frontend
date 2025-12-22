import axios from 'axios';
import { tokenService } from './authService';

// MAke this setting according to work
// const STOCK_API_BASE = 'http://127.0.0.1:8000';
const STOCK_API_BASE = 'https://stock-backend-tl9t.onrender.com';

const stockApi = axios.create({
  baseURL: STOCK_API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach DRF TokenAuthentication header
stockApi.interceptors.request.use(
  (config) => {
    const token = tokenService.getToken();
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper to try multiple endpoint candidate paths and return the first successful response
const tryRequest = async (method, paths, data = undefined, config = undefined) => {
  let lastError = null;
  for (const path of paths) {
    try {
      // axios methods signature: get(url, config), post(url, data, config), delete(url, config)
      let res;
      if (method === 'get' || method === 'delete') {
        res = await stockApi[method](path, config);
      } else {
        res = await stockApi[method](path, data, config);
      }
      return res;
    } catch (err) {
      lastError = err;
      // try next candidate on 404
      if (err.response && err.response.status === 404) continue;
      throw err;
    }
  }

  if (lastError) lastError.attemptedPaths = paths;
  throw lastError || new Error('No candidate endpoints responded');
};

export const stockService = {
  /**
   * Get all stock trades
   * Returns: { message, count, data: [...] }
   */
  getAllStocks: async () => {
    const res = await stockApi.get('/api/stocks/trades/');
    return res.data;
  },

  /**
   * Get a specific stock trade by ID
   */
  getStockById: async (id) => {
    const res = await stockApi.get(`/api/stocks/trades/${id}/`);
    return res.data;
  },

  /**
   * Create a new stock trade
   */
  createStock: async (data) => {
    const res = await stockApi.post('/api/stocks/trades/', data);
    return res.data;
  },

  /**
   * Update a stock trade (partial update)
   */
  updateStock: async (id, data) => {
    const res = await stockApi.patch(`/api/stocks/trades/${id}/`, data);
    return res.data;
  },

  /**
   * Delete a stock trade
   */
  deleteStock: async (id) => {
    const res = await stockApi.delete(`/api/stocks/trades/${id}/`);
    return res.data;
  },

  /**
   * Get stock trade by symbol using custom action
   * Returns stock trade data for the given symbol
   */
  getStockBySymbol: async (symbol) => {
    const res = await stockApi.get(`/api/stocks/trades/by_symbol/?symbol=${encodeURIComponent(symbol)}`);
    return res.data;
  },

  /**
   * Get all stock trades (using standard list endpoint)
   * Optionally filtered by portfolio using query parameter
   * Returns: { message, count, data: [...] }
   */
  getAggregatedByPortfolio: async (portfolio) => {
    const url = portfolio 
      ? `/api/stocks/trades/?portfolio=${encodeURIComponent(portfolio)}`
      : '/api/stocks/trades/';
    const res = await stockApi.get(url);
    return res.data;
  },

  /**
   * Get stocks by portfolio_id
   * Returns: { message, count, data: [...] }
   */
  getStocksByPortfolioId: async (portfolioId) => {
    const res = await stockApi.get(`/api/stocks/trades/?portfolio_id=${portfolioId}`);
    return res.data;
  },

  /**
   * Download HTML report of all stock trades
   * Returns blob response
   */
  downloadReport: async () => {
    const res = await stockApi.get('/api/stocks/trades/download_report/', {
      responseType: 'blob'
    });
    return res;
  },

  /**
   * Download portfolio report as PNG image
   * Returns blob response (PNG image)
   */
 // In your stockService.js file, update the downloadImage method:
downloadImage: async (portfolioId) => {
  const res = await stockApi.get(`/api/stocks/trades/download_report/?portfolio_id=${portfolioId}`, {
    responseType: 'text', // Change from 'blob' to 'text' since it's HTML
    headers: {
      'Accept': 'text/html, application/json, */*' // Accept HTML
    }
  });
  return res;
},
  // ==================== Portfolio Methods ====================

  /**
   * Get all portfolios
   * Returns: { message, count, data: [...] }
   */
  getPortfolios: async () => {
    const res = await stockApi.get('/api/stocks/portfolios/');
    return res.data;
  },

  /**
   * Get a specific portfolio by ID
   */
  getPortfolioById: async (id) => {
    const res = await stockApi.get(`/api/stocks/portfolios/${id}/`);
    return res.data;
  },

  /**
   * Get portfolio by name using custom action
   */
  getPortfolioByName: async (name) => {
    const res = await stockApi.get(`/api/stocks/portfolios/by_name/?name=${encodeURIComponent(name)}`);
    return res.data;
  },

  /**
   * Create a new portfolio
   */
  createPortfolio: async (data) => {
    const res = await stockApi.post('/api/stocks/portfolios/', data);
    return res.data;
  },

  /**
   * Update a portfolio (partial update)
   */
  updatePortfolio: async (id, data) => {
    const res = await stockApi.patch(`/api/stocks/portfolios/${id}/`, data);
    return res.data;
  },

  /**
   * Delete a portfolio
   */
  deletePortfolio: async (id) => {
    const res = await stockApi.delete(`/api/stocks/portfolios/${id}/`);
    return res.data;
  },

  /**
   * Delete portfolio by name using custom action
   */
  deletePortfolioByName: async (name) => {
    const res = await stockApi.delete(`/api/stocks/portfolios/delete_by_name/?name=${encodeURIComponent(name)}`);
    return res.data;
  },
};
