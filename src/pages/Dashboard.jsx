import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, tokenService } from '../services/authService';
import { stockService } from '../services/stockService';
import axios from 'axios'; // Add this import
import '../styles/Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const token = tokenService.getToken();

  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [portfolioStocks, setPortfolioStocks] = useState([]);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [showStockForm, setShowStockForm] = useState(false);
  const [editingStockId, setEditingStockId] = useState(null);
  const [stockFormData, setStockFormData] = useState({
    symbol: '',
    total_buy_qty: '',
    buy_price: '',
    total_sell_qty: '',
    sell_price: '',
    wk_52_high: '',
    wk_52_low: '',
  });
  const [savingStock, setSavingStock] = useState(false);
  const [downloading, setDownloading] = useState(false); // Add this state
  const [editingPortfolioId, setEditingPortfolioId] = useState(null);
  const [editingPortfolioName, setEditingPortfolioName] = useState('');
  const [updatingPortfolio, setUpdatingPortfolio] = useState(false);
  useEffect(() => {
    fetchPortfolios();
  }, []);
  const handleEditPortfolio = (portfolio) => {
    setEditingPortfolioId(portfolio.id);
    setEditingPortfolioName(portfolio.name);
    setError('');
  };
  
  const handleCancelEditPortfolio = () => {
    setEditingPortfolioId(null);
    setEditingPortfolioName('');
    setError('');
  };
  
  const handleUpdatePortfolio = async (e) => {
    e.preventDefault();
    
    if (!editingPortfolioName.trim()) {
      setError('Portfolio name cannot be empty');
      return;
    }
  
    try {
      setUpdatingPortfolio(true);
      setError('');
      
      await stockService.updatePortfolio(editingPortfolioId, {
        name: editingPortfolioName.trim()
      });
      
      // Update the portfolios list
      await fetchPortfolios();
      
      // If the updated portfolio is currently selected, update its name
      if (selectedPortfolio?.id === editingPortfolioId) {
        setSelectedPortfolio(prev => ({
          ...prev,
          name: editingPortfolioName.trim()
        }));
      }
      
      // Reset edit state
      setEditingPortfolioId(null);
      setEditingPortfolioName('');
      
    } catch (err) {
      console.error('Update portfolio error:', err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.name?.[0] || 
                          err.message || 
                          'Failed to update portfolio.';
      setError(errorMessage);
    } finally {
      setUpdatingPortfolio(false);
    }
  };
  
  const handlePortfolioNameChange = (e) => {
    setEditingPortfolioName(e.target.value);
  };

  const fetchPortfolios = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await stockService.getPortfolios();
      
      let portfoliosData = [];
      if (response && Array.isArray(response.data)) {
        portfoliosData = response.data;
      } else if (Array.isArray(response)) {
        portfoliosData = response;
      }
      
      setPortfolios(portfoliosData);
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load portfolios.';
      setError(errorMessage);
      console.error('Fetch portfolios error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePortfolio = async (e) => {
    e.preventDefault();
    if (!newPortfolioName.trim()) {
      setError('Portfolio name is required');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await stockService.createPortfolio({ name: newPortfolioName.trim() });
      setNewPortfolioName('');
      setShowAddForm(false);
      await fetchPortfolios();
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.name?.[0] || err.message || 'Failed to create portfolio.';
      setError(errorMessage);
      console.error('Create portfolio error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePortfolio = async (portfolio, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete portfolio "${portfolio.name}"?`)) {
      return;
    }

    try {
      setDeleting(portfolio.id);
      setError('');
      
      try {
        await stockService.deletePortfolio(portfolio.id);
      } catch (err) {
        if (err.response?.status === 404 || err.response?.status === 400) {
          await stockService.deletePortfolioByName(portfolio.name);
        } else {
          throw err;
        }
      }
      
      if (selectedPortfolio?.id === portfolio.id) {
        setSelectedPortfolio(null);
        setPortfolioStocks([]);
        setShowStockForm(false);
        setEditingStockId(null);
      }
      
      await fetchPortfolios();
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to delete portfolio.';
      setError(errorMessage);
      console.error('Delete portfolio error:', err);
    } finally {
      setDeleting(null);
    }
  };

  const handlePortfolioClick = async (portfolio) => {
    if (selectedPortfolio?.id === portfolio.id) {
      setSelectedPortfolio(null);
      setPortfolioStocks([]);
      setShowStockForm(false);
      setEditingStockId(null);
      return;
    }

    setSelectedPortfolio(portfolio);
    setLoadingStocks(true);
    setError('');

    try {
      const response = await stockService.getStocksByPortfolioId(portfolio.id);
      
      let stocksData = [];
      if (response && Array.isArray(response.data)) {
        stocksData = response.data;
      } else if (Array.isArray(response)) {
        stocksData = response;
      } else if (response && response.message && response.count !== undefined) {
        stocksData = response.data || [];
      }
      
      setPortfolioStocks(stocksData);
    } catch (err) {
      console.error('Fetch portfolio stocks error:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.detail || err.message || 'Failed to load stocks.';
      setError(errorMessage);
      setPortfolioStocks([]);
    } finally {
      setLoadingStocks(false);
    }
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatValue = (value, field) => {
    if (value === null || value === undefined) return '-';
    if (field.includes('value') || field.includes('cost') || field.includes('price') || field.includes('profit')) {
      return formatCurrency(value);
    }
    if (field === 'percent_holding') {
      return `${formatNumber(value)}%`;
    }
    if (typeof value === 'number') {
      return formatNumber(value);
    }
    return String(value);
  };

  const handleEditStock = (stock) => {
    setStockFormData({
      symbol: stock.symbol || '',
      total_buy_qty: stock.total_buy_qty || '',
      buy_price: stock.buy_price || '',
      total_sell_qty: stock.total_sell_qty || '',
      sell_price: stock.sell_price || '',
      wk_52_high: stock.wk_52_high || '',
      wk_52_low: stock.wk_52_low || '',
    });
    setEditingStockId(stock.id);
    setShowStockForm(true);
  };

  const handleAddNewStock = () => {
    setStockFormData({
      symbol: '',
      total_buy_qty: '',
      buy_price: '',
      total_sell_qty: '',
      sell_price: '',
      wk_52_high: '',
      wk_52_low: '',
    });
    setEditingStockId(null);
    setShowStockForm(true);
  };

  const handleCancelStockForm = () => {
    setShowStockForm(false);
    setEditingStockId(null);
    setStockFormData({
      symbol: '',
      total_buy_qty: '',
      buy_price: '',
      total_sell_qty: '',
      sell_price: '',
      wk_52_high: '',
      wk_52_low: '',
    });
  };

  const handleSaveStock = async (e) => {
    e.preventDefault();
    if (!selectedPortfolio) return;

    try {
      setSavingStock(true);
      setError('');

      const stockData = {
        portfolio_id: selectedPortfolio.id,
        symbol: stockFormData.symbol.trim().toUpperCase(),
      };

      const numericFields = ['total_buy_qty', 'buy_price', 'total_sell_qty', 'sell_price', 'wk_52_high', 'wk_52_low'];
      numericFields.forEach(field => {
        if (stockFormData[field] && stockFormData[field] !== '') {
          const numValue = parseFloat(stockFormData[field]);
          if (!isNaN(numValue)) {
            if (field.includes('qty')) {
              stockData[field] = parseInt(stockFormData[field], 10);
            } else {
              stockData[field] = numValue;
            }
          }
        }
      });

      let response;
      if (editingStockId) {
        response = await stockService.updateStock(editingStockId, stockData);
      } else {
        response = await stockService.createStock(stockData);
      }
      
      setStockFormData({
        symbol: '',
        total_buy_qty: '',
        buy_price: '',
        total_sell_qty: '',
        sell_price: '',
        wk_52_high: '',
        wk_52_low: '',
      });
      setEditingStockId(null);
      setShowStockForm(false);
      
      setLoadingStocks(true);
      try {
        const response = await stockService.getStocksByPortfolioId(selectedPortfolio.id);
        let stocksData = [];
        if (response && Array.isArray(response.data)) {
          stocksData = response.data;
        } else if (Array.isArray(response)) {
          stocksData = response;
        }
        setPortfolioStocks(stocksData);
      } catch (err) {
        console.error('Error refreshing stocks:', err);
      } finally {
        setLoadingStocks(false);
      }
    } catch (err) {
      console.error(`${editingStockId ? 'Update' : 'Create'} stock error:`, err);
      
      let errorMessage = `Failed to ${editingStockId ? 'update' : 'create'} stock.`;
      if (err.response?.data) {
        if (err.response.data.error) {
          errorMessage = err.response.data.error;
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response.data.symbol) {
          errorMessage = `Symbol: ${Array.isArray(err.response.data.symbol) ? err.response.data.symbol.join(', ') : err.response.data.symbol}`;
        } else if (err.response.data.portfolio_id) {
          errorMessage = `Portfolio: ${Array.isArray(err.response.data.portfolio_id) ? err.response.data.portfolio_id.join(', ') : err.response.data.portfolio_id}`;
        } else {
          errorMessage = JSON.stringify(err.response.data);
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setSavingStock(false);
    }
  };

  const handleStockFieldChange = (field, value) => {
    setStockFormData({
      ...stockFormData,
      [field]: value,
    });
  };

  const handleDeleteStock = async (stock) => {
    if (!window.confirm(`Are you sure you want to delete stock ${stock.symbol}?`)) return;

    try {
      setDeleting(stock.id);
      await stockService.deleteStock(stock.id);
      
      const response = await stockService.getStocksByPortfolioId(selectedPortfolio.id);
      let stocksData = [];
      if (response && Array.isArray(response.data)) {
        stocksData = response.data;
      } else if (Array.isArray(response)) {
        stocksData = response;
      }
      setPortfolioStocks(stocksData);
    } catch (err) {
      console.error('Delete stock error:', err);
      setError('Failed to delete stock');
    } finally {
      setDeleting(null);
    }
  };

  // Simplified download function using stockService
  const handleDownloadImage = async () => {
    if (!selectedPortfolio) return;
  
    try {
      setDownloading(true);
      setError('');
      
      console.log('Fetching HTML report for portfolio:', selectedPortfolio.id);
      
      // 1. Fetch HTML from backend
      const response = await fetch(
        `http://127.0.0.1:8000/api/stocks/trades/download_report/?portfolio_id=${selectedPortfolio.id}`,
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Accept': 'text/html'
          }
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
      }
      
      const html = await response.text();
      console.log('HTML received, length:', html.length);
      
      // 2. Open HTML in a hidden iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.top = '0';
      iframe.style.width = '1800px'; // Match the width from your HTML template
      iframe.style.height = '1000px';
      iframe.style.border = 'none';
      iframe.style.overflow = 'auto';
      
      document.body.appendChild(iframe);
      
      // 3. Write HTML to iframe
      iframe.contentDocument.open();
      iframe.contentDocument.write(html);
      iframe.contentDocument.close();
      
      // 4. Wait for iframe to load completely
      await new Promise((resolve, reject) => {
        iframe.onload = resolve;
        setTimeout(resolve, 2000); // 2 second timeout
      });
      
      // 5. Use html2canvas to convert iframe content to image
      console.log('Converting HTML to PNG using html2canvas...');
      
      const canvas = await html2canvas(iframe.contentDocument.body, {
        scale: 1.5, // Adjust scale for better quality
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        logging: true,
        width: iframe.contentDocument.body.scrollWidth,
        height: iframe.contentDocument.body.scrollHeight,
        windowWidth: iframe.contentDocument.body.scrollWidth,
        windowHeight: iframe.contentDocument.body.scrollHeight,
        onclone: (clonedDoc) => {
          // Ensure cloned document has proper styling
          clonedDoc.body.style.width = '100%';
          clonedDoc.body.style.overflow = 'visible';
        }
      });
      
      console.log('Canvas created, dimensions:', canvas.width, 'x', canvas.height);
      
      // 6. Convert canvas to PNG and trigger download
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `${selectedPortfolio.name}_report_${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      
      // Append link, click it, and remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 7. Clean up iframe
      document.body.removeChild(iframe);
      
      console.log('PNG download initiated successfully');
      
    } catch (err) {
      console.error('Download error:', err);
      
      // Fallback: If html2canvas fails, open HTML in new tab
      try {
        console.log('Falling back to opening HTML in new tab...');
        
        const response = await fetch(
          `http://127.0.0.1:8000/api/stocks/trades/download_report/?portfolio_id=${selectedPortfolio.id}`,
          {
            headers: {
              'Authorization': `Token ${token}`,
            }
          }
        );
        const html = await response.text();
        
        const newWindow = window.open('', '_blank');
        newWindow.document.write(html);
        newWindow.document.close();
        
        setError('Report opened in new tab. Use browser print (Ctrl+P) → "Save as PDF" to save.');
        
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
        setError(`Failed to generate image: ${err.message}. HTML opened in new tab instead.`);
      }
    } finally {
      setDownloading(false);
    }
  };
  // ... (rest of your component remains the same)


  // Alternative: Simple direct fetch approach
  const handleDownloadImageSimple = async () => {
    if (!selectedPortfolio) return;

    try {
      setDownloading(true);
      setError('');
      
      // Direct fetch with authentication
      const response = await fetch(
        `http://127.0.0.1:8000/api/stocks/trades/download_report/?portfolio_id=${selectedPortfolio.id}`,
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Accept': 'image/png'
          }
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
      }
      
      // Get the blob
      const blob = await response.blob();
      
      // Check if it's actually an image
      if (!blob.type.startsWith('image/')) {
        const text = await blob.text();
        throw new Error(`Expected image but got ${blob.type}: ${text.substring(0, 100)}`);
      }
      
      // Download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedPortfolio.name}_report.png`;
      link.click();
      
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Download error:', err);
      setError(`Download failed: ${err.message}`);
    } finally {
      setDownloading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  if (!token) {
    navigate('/login');
    return null;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <button onClick={handleLogout} className="btn-secondary">
          Logout
        </button>
      </div>
      <div className="dashboard-content">
        <div className="portfolios-section">
          <div className="portfolios-header">
            <h2>Portfolios</h2>
            <button 
              onClick={() => setShowAddForm(!showAddForm)} 
              className="btn-add-portfolio"
            >
              {showAddForm ? 'Cancel' : '+ Add Portfolio'}
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          {showAddForm && (
            <form onSubmit={handleCreatePortfolio} className="add-portfolio-form">
              <input
                type="text"
                placeholder="Enter portfolio name"
                value={newPortfolioName}
                onChange={(e) => setNewPortfolioName(e.target.value)}
                className="portfolio-name-input"
                required
              />
              <button 
                type="submit" 
                disabled={saving || !newPortfolioName.trim()} 
                className="btn-save-portfolio"
              >
                {saving ? 'Creating...' : 'Create Portfolio'}
              </button>
            </form>
          )}
          {loading ? (
  <div className="loading">Loading portfolios...</div>
) : portfolios.length === 0 ? (
  <div className="no-portfolios">No portfolios found. Create your first portfolio to get started.</div>
) : (
  <div className="portfolios-list">
    {portfolios.map((portfolio) => (
      <div 
        key={portfolio.id || portfolio.name} 
        className={`portfolio-item ${selectedPortfolio?.id === portfolio.id ? 'selected' : ''}`}
        onClick={() => handlePortfolioClick(portfolio)}
      >
        {editingPortfolioId === portfolio.id ? (
          // Edit mode
          <form onSubmit={handleUpdatePortfolio} className="portfolio-edit-form">
            <input
              type="text"
              value={editingPortfolioName}
              onChange={handlePortfolioNameChange}
              className="portfolio-edit-input"
              autoFocus
              required
            />
            <div className="portfolio-edit-actions">
              <button
                type="button"
                onClick={handleCancelEditPortfolio}
                className="btn-cancel-edit"
                disabled={updatingPortfolio}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updatingPortfolio || !editingPortfolioName.trim()}
                className="btn-save-edit"
              >
                {updatingPortfolio ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        ) : (
          // View mode
          <>
            <div className="portfolio-info">
              <h3 className="portfolio-name">{portfolio.name}</h3>
              {portfolio.created_at && (
                <span className="portfolio-date">
                  Created: {new Date(portfolio.created_at).toLocaleDateString()}
                </span>
              )}
            </div>
            <div className="portfolio-actions">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditPortfolio(portfolio);
                }}
                className="btn-edit-portfolio"
                title="Edit portfolio name"
              >
                ✏️ Edit
              </button>
              <button
                onClick={(e) => handleDeletePortfolio(portfolio, e)}
                disabled={deleting === portfolio.id}
                className="btn-delete-portfolio"
                title="Delete portfolio"
              >
                {deleting === portfolio.id ? 'Deleting...' : '🗑️ Delete'}
              </button>
            </div>
          </>
        )}
      </div>
    ))}
  </div>
)}

          {loading ? (
            <div className="loading">Loading portfolios...</div>
          ) : portfolios.length === 0 ? (
            <div className="no-portfolios">No portfolios found. Create your first portfolio to get started.</div>
          ) : (
            <div className="portfolios-list">
              {portfolios.map((portfolio) => (
                <div 
                  key={portfolio.id || portfolio.name} 
                  className={`portfolio-item ${selectedPortfolio?.id === portfolio.id ? 'selected' : ''}`}
                  onClick={() => handlePortfolioClick(portfolio)}
                >
                  <div className="portfolio-info">
                    <h3 className="portfolio-name">{portfolio.name}</h3>
                    {portfolio.created_at && (
                      <span className="portfolio-date">
                        Created: {new Date(portfolio.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleDeletePortfolio(portfolio, e)}
                    disabled={deleting === portfolio.id}
                    className="btn-delete-portfolio"
                  >
                    {deleting === portfolio.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {selectedPortfolio && (
            <div className="portfolio-stocks-section">
              <h3 className="stocks-section-title">
                Stocks in: {selectedPortfolio.name}
                <div className="stocks-title-actions">
                  <button 
                    onClick={handleAddNewStock} 
                    className="btn-add-stock"
                  >
                    + Add Stock
                  </button>
                  <button 
                    onClick={handleDownloadImage} // or use handleDownloadImageSimple
                    disabled={downloading}
                    className="btn-download-image"
                    title="Download as PNG Image"
                  >
                    {downloading ? '⏳ Downloading...' : '📥 Download Image'}
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedPortfolio(null);
                      setPortfolioStocks([]);
                      setShowStockForm(false);
                      setEditingStockId(null);
                    }}
                    className="btn-close-stocks"
                  >
                    ×
                  </button>
                </div>
              </h3>

              {showStockForm && (
                <form onSubmit={handleSaveStock} className="add-stock-form">
                  <div className="stock-form-row">
                    <div className="stock-form-field">
                      <label>Symbol *</label>
                      <input
                        type="text"
                        value={stockFormData.symbol}
                        onChange={(e) => handleStockFieldChange('symbol', e.target.value)}
                        required
                        placeholder="e.g., AAPL"
                        disabled={editingStockId}
                      />
                    </div>
                    <div className="stock-form-field">
                      <label>Total Buy Qty</label>
                      <input
                        type="number"
                        value={stockFormData.total_buy_qty}
                        onChange={(e) => handleStockFieldChange('total_buy_qty', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div className="stock-form-field">
                      <label>Buy Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={stockFormData.buy_price}
                        onChange={(e) => handleStockFieldChange('buy_price', e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="stock-form-row">
                    <div className="stock-form-field">
                      <label>Total Sell Qty</label>
                      <input
                        type="number"
                        value={stockFormData.total_sell_qty}
                        onChange={(e) => handleStockFieldChange('total_sell_qty', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div className="stock-form-field">
                      <label>Sell Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={stockFormData.sell_price}
                        onChange={(e) => handleStockFieldChange('sell_price', e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="stock-form-field">
                      <label>52 Week High</label>
                      <input
                        type="number"
                        step="0.01"
                        value={stockFormData.wk_52_high}
                        onChange={(e) => handleStockFieldChange('wk_52_high', e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="stock-form-row">
                    <div className="stock-form-field">
                      <label>52 Week Low</label>
                      <input
                        type="number"
                        step="0.01"
                        value={stockFormData.wk_52_low}
                        onChange={(e) => handleStockFieldChange('wk_52_low', e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="stock-form-field"></div>
                    <div className="stock-form-field form-actions">
                      <button 
                        type="button" 
                        onClick={handleCancelStockForm}
                        className="btn-cancel-stock"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={savingStock || !stockFormData.symbol.trim()} 
                        className="btn-save-stock"
                      >
                        {savingStock 
                          ? (editingStockId ? 'Updating...' : 'Creating...') 
                          : (editingStockId ? 'Update Stock' : 'Create Stock')
                        }
                      </button>
                    </div>
                  </div>
                </form>
              )}
              
              {loadingStocks ? (
                <div className="loading">Loading stocks...</div>
              ) : portfolioStocks.length === 0 ? (
                <div className="no-stocks">No stocks found in this portfolio.</div>
              ) : (
                <div className="stocks-table-container">
                  <table className="stocks-table-horizontal">
                    <thead>
                      <tr>
                        {Object.keys(portfolioStocks[0] || {}).map((key) => (
                          <th key={key}>{key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</th>
                        ))}
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolioStocks.map((stock, index) => (
                        <tr key={stock.id || index}>
                          {Object.entries(stock).map(([key, value]) => (
                            <td key={key}>{formatValue(value, key)}</td>
                          ))}
                          <td className="actions-cell">
                            <button
                              onClick={() => handleEditStock(stock)}
                              className="btn-edit-stock"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteStock(stock)}
                              disabled={deleting === stock.id}
                              className="btn-delete-stock"
                            >
                              {deleting === stock.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;