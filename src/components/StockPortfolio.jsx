import { useState, useEffect } from 'react';
import { stockService } from '../services/stockService';
import '../styles/StockPortfolio.css';
import DownloadReportButton from "./DownloadButton";

const StockPortfolio = () => {
  const [stocks, setStocks] = useState([]);
  const [groupedStocks, setGroupedStocks] = useState({});
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [selectedPortfolioDetails, setSelectedPortfolioDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingStock, setEditingStock] = useState(null);
  const [saving, setSaving] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState({});
  const [expandedSymbol, setExpandedSymbol] = useState(null);
  const [creatingPortfolio, setCreatingPortfolio] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');

  
  const StockPortfolio = () => {
    const portfolioRef = useRef(null);
  
    return (
      <div className="stock-portfolio-container" ref={portfolioRef}>
        {/* ... entire stock portfolio JSX ... */}
  
        {/* Download button */}
        <DownloadReportButton targetRef={portfolioRef} />
      </div>
    );
  };
  
  const handleDeleteStock = async (id) => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this stock?')) return;
  
    try {
      setSaving(true);
      setError('');
      await stockService.deleteStock(id); // Make sure this API exists
      if (selectedPortfolio) {
        await fetchStocksForPortfolio(selectedPortfolio);
      } else {
        await fetchStocks();
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to delete stock';
      setError(msg);
      console.error('Delete stock error:', err);
    } finally {
      setSaving(false);
    }
  };
  
  
  // Editable fields (non-read-only)
  const editableFields = [
    'symbol',
    'total_buy_qty',
    'buy_price',
    'total_sell_qty',
    'sell_price',
    'wk_52_high',
    'wk_52_low',
    'current_portfolio',
  ];

  // Read-only fields (calculated by backend)
  const readOnlyFields = [
    'total_buy_value',
    'total_sell_value',
    'balance_qty',
    'acquisition_cost',
    'percent_holding',
    'current_value',
    'realised_profit_loss',
  ];

  useEffect(() => {
    fetchPortfolios();
    fetchStocks();
  }, []);

  useEffect(() => {
    if (selectedPortfolio) {
      fetchPortfolioDetails(selectedPortfolio);
      fetchStocksForPortfolio(selectedPortfolio);
    } else {
      fetchStocks();
      setSelectedPortfolioDetails(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPortfolio]);

  const fetchPortfolios = async () => {
    try {
      const response = await stockService.getPortfolios();
      console.log('Fetched portfolios response:', response);
      
      let portfoliosData = [];
      if (response && Array.isArray(response.data)) {
        portfoliosData = response.data;
      } else if (Array.isArray(response)) {
        portfoliosData = response;
      }
      
      setPortfolios(portfoliosData);
      
      // Auto-select first portfolio if available and none selected
      if (portfoliosData.length > 0 && !selectedPortfolio) {
        setSelectedPortfolio(portfoliosData[0].id || portfoliosData[0].name);
      }
    } catch (err) {
      let errorMessage = err.message || 'Failed to load portfolios.';
      if (err.attemptedPaths) errorMessage = `Request failed for candidate paths: ${err.attemptedPaths.join(', ')}`;
      setError(errorMessage);
      console.error('Fetch portfolios error:', err);
    }
  };

  const fetchPortfolioDetails = async (portfolioIdOrName) => {
    // Use existing portfolios array to find details (backend may not expose separate endpoints)
    const p = portfolios.find((x) => (x.id && x.id.toString() === portfolioIdOrName.toString()) || (x.name && x.name === portfolioIdOrName));
    setSelectedPortfolioDetails(p || null);
  };

  const fetchStocks = async () => {
    try {
      setLoading(true);
      setError('');
      // Use aggregated endpoint (one record per symbol)
      const response = await stockService.getAggregatedByPortfolio();
      console.log('Fetched aggregated stocks response:', response);

      // Expected shape: { count: N, data: [...] }
      let stocksData = [];
      if (response && Array.isArray(response.data)) {
        stocksData = response.data;
      } else if (Array.isArray(response)) {
        stocksData = response;
      } else {
        stocksData = [];
      }
      
      setStocks(stocksData);
      
      // Group stocks by current_portfolio
      // Group aggregated stocks by portfolio name if available
      const grouped = stocksData.reduce((acc, stock) => {
        const portfolio = stock.portfolio_name || stock.current_portfolio || stock.portfolio?.name || 'Uncategorized';
        if (!acc[portfolio]) {
          acc[portfolio] = [];
        }
        acc[portfolio].push(stock);
        return acc;
      }, {});
      
      setGroupedStocks(grouped);
      setError('');
    } catch (err) {
      // Show attemptedPaths or request url for easier debugging
      let errorMessage = err.message || 'Failed to load stocks. Please try again.';
      if (err.attemptedPaths) {
        errorMessage = `Request failed for candidate paths: ${err.attemptedPaths.join(', ')}`;
      } else if (err.config && err.config.url) {
        errorMessage = `Request failed: ${err.config.url} (${err.message})`;
      }
      setError(errorMessage);
      console.error('Fetch stocks error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStocksForPortfolio = async (portfolioIdOrName) => {
    try {
      setLoading(true);
      setError('');
      // Fetch stocks filtered by portfolio
      const portfolioName = portfolios.find(p => 
        (p.id && p.id.toString() === portfolioIdOrName.toString()) || 
        (p.name && p.name === portfolioIdOrName)
      )?.name || portfolioIdOrName;
      
      const response = await stockService.getAggregatedByPortfolio(portfolioName);
      console.log('Fetched stocks for portfolio response:', response);

      let stocksData = [];
      if (response && Array.isArray(response.data)) {
        stocksData = response.data;
      } else if (Array.isArray(response)) {
        stocksData = response;
      } else {
        stocksData = [];
      }
      
      // Filter stocks that belong to selected portfolio
      const filteredStocks = stocksData.filter(stock => {
        const stockPortfolio = stock.portfolio?.name || stock.portfolio_name || stock.current_portfolio;
        return stockPortfolio === portfolioName;
      });
      
      setStocks(filteredStocks);
      setGroupedStocks({ [portfolioName]: filteredStocks });
      setError('');
    } catch (err) {
      let errorMessage = err.message || 'Failed to load stocks. Please try again.';
      if (err.attemptedPaths) {
        errorMessage = `Request failed for candidate paths: ${err.attemptedPaths.join(', ')}`;
      } else if (err.config && err.config.url) {
        errorMessage = `Request failed: ${err.config.url} (${err.message})`;
      }
      setError(errorMessage);
      console.error('Fetch stocks for portfolio error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (stock) => {
    // Only allow edit when stock has an underlying id
    if (!stock.id) return;
    setEditingStock({ ...stock });
  };

  const handleCreatePortfolio = async () => {
    if (!newPortfolioName.trim()) {
      setError('Portfolio name is required');
      return;
    }

    try {
      setSaving(true);
      setError('');
      const response = await stockService.createPortfolio({ name: newPortfolioName.trim() });
      const portfolioData = response && response.data ? response.data : response;
      
      // Refresh portfolios list
      await fetchPortfolios();
      
      // Select the newly created portfolio
      setSelectedPortfolio(portfolioData.id || portfolioData.name);
      
      // Reset form
      setNewPortfolioName('');
      setCreatingPortfolio(false);
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.detail || err.message || (err.attemptedPaths ? `Failed to reach candidate endpoints: ${err.attemptedPaths.join(', ')}` : 'Failed to create portfolio.');
      setError(errorMessage);
      console.error('Create portfolio error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePortfolio = async (name) => {
    if (!window.confirm(`Delete portfolio ${name}?`)) return;
    try {
      setSaving(true);
      setError('');
      await stockService.deletePortfolioByName(name);
      await fetchPortfolios();
      // If deleted portfolio was selected, clear selection
      if ((selectedPortfolio && selectedPortfolio.toString()) === name.toString()) {
        setSelectedPortfolio(null);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || (err.attemptedPaths ? `Delete failed for candidate paths: ${err.attemptedPaths.join(', ')}` : 'Failed to delete portfolio');
      setError(errorMessage);
      console.error('Delete portfolio error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddNew = () => {
    const portfolioName = portfolios.find(p => 
      (p.id && p.id.toString() === selectedPortfolio?.toString()) || 
      (p.name && p.name === selectedPortfolio)
    )?.name || '';
    
    setEditingStock({
      symbol: '',
      total_buy_qty: '',
      buy_price: '',
      total_sell_qty: '',
      sell_price: '',
      wk_52_high: '',
      wk_52_low: '',
      current_portfolio: portfolioName,
      portfolio: selectedPortfolio,
    });
  };

  const handleCancel = () => {
    setEditingStock(null);
  };

  const handleFieldChange = (field, value) => {
    setEditingStock({
      ...editingStock,
      [field]: value,
    });
  };

  const handleSave = async () => {
    if (!editingStock) return;

    try {
      setSaving(true);
      setError('');

      // Prepare data with only editable fields
      const stockData = {};
      editableFields.forEach((field) => {
        if (editingStock[field] !== undefined && editingStock[field] !== '') {
          stockData[field] = editingStock[field];
        }
      });

      // If creating a new stock and portfolio is selected, ensure portfolio is set
      if (!editingStock.id && selectedPortfolio) {
        const portfolioObj = portfolios.find(p => 
          (p.id && p.id.toString() === selectedPortfolio.toString()) || 
          (p.name && p.name === selectedPortfolio)
        );
        if (portfolioObj) {
          // Backend might expect 'portfolio' as ID or 'current_portfolio' as name
          // Try both approaches
          if (!stockData.portfolio && portfolioObj.id) {
            stockData.portfolio = portfolioObj.id;
          }
          if (!stockData.current_portfolio && portfolioObj.name) {
            stockData.current_portfolio = portfolioObj.name;
          }
        }
      }

      let updatedStock;
      if (editingStock.id) {
        // Update existing specific trade
        updatedStock = await stockService.updateStock(editingStock.id, stockData);
      } else {
        // Create new trade (backend will create a trade row)
        updatedStock = await stockService.createStock(stockData);
      }

      // Refresh the stocks list and portfolios
      if (selectedPortfolio) {
        await fetchStocksForPortfolio(selectedPortfolio);
      } else {
        await fetchStocks();
      }
      await fetchPortfolios();
      setEditingStock(null);
    } catch (err) {
      const errorMessage = err.detail || err.message || 'Failed to save stock. Please try again.';
      setError(errorMessage);
      console.error('Save stock error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleViewSymbol = async (symbol) => {
    try {
      setError('');
      setExpandedSymbol(symbol);
      // Fetch aggregated details for the symbol
      const res = await stockService.getStockBySymbol(symbol);
      const data = res && res.data ? res.data : res;
      setExpandedDetails((prev) => ({ ...prev, [symbol]: data }));
    } catch (err) {
      const msg = err.attemptedPaths ? `Request failed for: ${err.attemptedPaths.join(', ')}` : (err.message || 'Failed to fetch symbol details');
      setError(msg);
      console.error('View symbol error:', err);
    }
  };

  const handleCloseDetail = (symbol) => {
    setExpandedSymbol(null);
    setExpandedDetails((prev) => {
      const copy = { ...prev };
      delete copy[symbol];
      return copy;
    });
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

  if (loading) {
    return (
      <div className="stock-portfolio-container">
        <div className="loading">Loading stocks...</div>
      </div>
    );
  }

  if (error && !stocks.length) {
    return (
      <div className="stock-portfolio-container">
        <div className="error-message">{error}</div>
        <button onClick={fetchStocks} className="btn-retry">Retry</button>
      </div>
    );
  }

  return (
    <div className="stock-portfolio-container">
      <div className="portfolio-header">
        <h2>Stock Portfolio</h2>
        <div className="header-actions">
          <button onClick={handleAddNew} className="btn-add-new">
            Add New Stock
          </button>
          <button onClick={fetchStocks} className="btn-refresh">Refresh</button>
          {/* Portfolio selector and create */}
          <select
            value={selectedPortfolio || ''}
            onChange={(e) => setSelectedPortfolio(e.target.value || null)}
            className="portfolio-select"
          >
            <option value="">All Portfolios</option>
            {portfolios.map((p) => (
              <option key={p.id || p.name} value={p.id || p.name}>{p.name}</option>
            ))}
          </select>

          <button onClick={() => setCreatingPortfolio(true)} className="btn-add-portfolio">Add Portfolio</button>
        </div>
      </div>

      {/* Create portfolio form */}
      {creatingPortfolio && (
        <div className="create-portfolio-card">
          <h4>Create Portfolio</h4>
          <input
            type="text"
            value={newPortfolioName}
            onChange={(e) => setNewPortfolioName(e.target.value)}
            placeholder="Portfolio name"
          />
          <div className="create-actions">
            <button onClick={handleCreatePortfolio} disabled={saving} className="btn-save">{saving ? 'Saving...' : 'Create'}</button>
            <button onClick={() => setCreatingPortfolio(false)} className="btn-cancel">Cancel</button>
          </div>
        </div>
      )}

      {/* Portfolio Selector */}
      <div className="portfolio-selector-section">
        <div className="portfolio-selector-row">
          <label htmlFor="portfolio-select">Select Portfolio:</label>
          <select
            id="portfolio-select"
            value={selectedPortfolio || ''}
            onChange={(e) => setSelectedPortfolio(e.target.value || null)}
            className="portfolio-select"
          >
            <option value="">All Portfolios</option>
            {portfolios.map((portfolio) => (
              <option key={portfolio.id || portfolio.name} value={portfolio.id || portfolio.name}>
                {portfolio.name}
              </option>
            ))}
          </select>
          <button 
            onClick={() => setCreatingPortfolio(!creatingPortfolio)} 
            className="btn-add-portfolio"
          >
            {creatingPortfolio ? 'Cancel' : '+ New Portfolio'}
          </button>
        </div>

        {/* Create Portfolio Form */}
        {creatingPortfolio && (
          <div className="create-portfolio-form">
            <input
              type="text"
              placeholder="Enter portfolio name"
              value={newPortfolioName}
              onChange={(e) => setNewPortfolioName(e.target.value)}
              className="portfolio-name-input"
            />
            <button 
              onClick={handleCreatePortfolio} 
              disabled={saving || !newPortfolioName.trim()}
              className="btn-save-portfolio"
            >
              {saving ? 'Creating...' : 'Create Portfolio'}
            </button>
          </div>
        )}

        {/* Portfolio Details */}
        {selectedPortfolio && selectedPortfolioDetails && (
          <div className="portfolio-details-card">
            <h3>Portfolio Details</h3>
            <table className="portfolio-details-table">
              <tbody>
                {Object.entries(selectedPortfolioDetails).map(([key, value]) => {
                  // Skip internal fields
                  if (key === 'id' || key === 'created_at' || key === 'updated_at') {
                    return null;
                  }
                  return (
                    <tr key={key}>
                      <td className="field-name">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </td>
                      <td className="field-value">
                        {value === null || value === undefined 
                          ? '-' 
                          : typeof value === 'object' 
                          ? JSON.stringify(value) 
                          : String(value)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Manage portfolios */}
      <div className="portfolio-management">
        <h4>Manage Portfolios</h4>
        {portfolios.length === 0 ? (
          <div className="no-portfolios">No portfolios found</div>
        ) : (
          <ul className="portfolio-list">
            {portfolios.map((p) => (
              <li key={p.id || p.name} className="portfolio-item">
                <span>{p.name}</span>
                <div className="portfolio-actions">
                  <button className="btn-select" onClick={() => setSelectedPortfolio(p.id || p.name)}>Select</button>
                  <button className="btn-delete" onClick={() => handleDeletePortfolio(p.name)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* New Stock Form */}
      {editingStock && !editingStock.id && (
        <div className="stock-card new-stock-card">
          <div className="stock-header">
            <h4 className="stock-symbol">New Stock</h4>
            <div className="edit-actions">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-save"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={handleCancel} className="btn-cancel">
                Cancel
              </button>
            </div>
          </div>

          <div className="stock-model-name">
            <strong>Model:</strong> New Stock Trade
          </div>

          <table className="stock-table">
            <thead>
              <tr>
                <th>Field</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {editableFields.map((field) => (
                <tr key={field}>
                  <td className="field-name">
                    {field.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </td>
                  <td>
                    <input
                      type={field.includes('price') || field.includes('high') || field.includes('low') || field.includes('qty') ? 'number' : 'text'}
                      step={field.includes('price') || field.includes('high') || field.includes('low') ? '0.01' : undefined}
                      value={editingStock[field] || ''}
                      onChange={(e) => handleFieldChange(field, e.target.value)}
                      className="editable-input"
                      placeholder={`Enter ${field.replace(/_/g, ' ')}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Stocks Section */}
      {selectedPortfolio ? (
        // Show stocks for selected portfolio
        stocks.length === 0 && !editingStock ? (
          <div className="no-stocks">No stocks found in this portfolio. Add a new stock to get started.</div>
        ) : (
          <div className="portfolio-stocks-section">
            <h3 className="portfolio-stocks-title">Stocks in Portfolio</h3>
            {stocks.map((stock) => {
              const key = stock.id || stock.symbol;
              const isEditing = editingStock?.id === stock.id;
              const stockData = isEditing ? editingStock : stock;

              return (
                <div key={key} className="stock-card">
                  <div className="stock-header">
                    <h4 className="stock-symbol">{stock.symbol}</h4>
                    <div className="action-buttons">
                        {/* Always show Edit/Delete if stock has editable fields */}
                        <button onClick={() => handleEdit(stock)} className="btn-edit">Edit</button>
                        <button onClick={() => handleDeleteStock(stock)} className="btn-delete">Delete</button>
                        <br />
                        <DownloadReportButton />
                      </div>





                  </div>

                  <div className="stock-model-name">
                    <strong>Model:</strong> {stock.symbol} Stock Trade
                  </div>

                  <table className="stock-table">
                    <thead>
                      <tr>
                        <th>Field</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Editable Fields */}
                      {editableFields.map((field) => (
                        <tr key={field}>
                          <td className="field-name">
                            {field.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                          </td>
                          <td>
                            {isEditing ? (
                              <input
                                type={field.includes('price') || field.includes('high') || field.includes('low') ? 'number' : 'text'}
                                step={field.includes('price') || field.includes('high') || field.includes('low') ? '0.01' : undefined}
                                value={stockData[field] || ''}
                                onChange={(e) => handleFieldChange(field, e.target.value)}
                                className="editable-input"
                                placeholder={`Enter ${field}`}
                              />
                            ) : (
                              <span className="field-value">
                                {field === 'symbol' || field === 'current_portfolio'
                                  ? stockData[field] || '-'
                                  : field.includes('price') || field.includes('high') || field.includes('low')
                                  ? formatCurrency(stockData[field])
                                  : formatNumber(stockData[field])}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}

                      {/* Read-only Fields (Calculated by Backend) */}
                      {readOnlyFields.map((field) => (
                        <tr key={field} className={isEditing ? 'disabled-row' : ''}>
                          <td className="field-name">
                            {field.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                          </td>
                          <td>
                            <span className={`field-value ${isEditing ? 'disabled' : ''}`}>
                              {field.includes('value') || field.includes('cost') || field.includes('profit')
                                ? formatCurrency(stockData[field])
                                : field === 'percent_holding'
                                ? `${formatNumber(stockData[field])}%`
                                : formatNumber(stockData[field])}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {/* Additional Fields */}
                      <tr>
                        <td className="field-name">Date Time</td>
                        <td>
                          <span className="field-value">
                            {stockData.date_time_field
                              ? new Date(stockData.date_time_field).toLocaleString()
                              : '-'}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  {/* Expanded symbol details (one-by-one) */}
                  {expandedSymbol === stock.symbol && expandedDetails[stock.symbol] && (
                    <div className="stock-detail-panel">
                      <h5>Details for {stock.symbol}</h5>
                      <table className="stock-table">
                        <tbody>
                          {Object.entries(expandedDetails[stock.symbol]).map(([k, v]) => (
                            <tr key={k}>
                              <td className="field-name">{k.replace(/_/g, ' ')}</td>
                              <td className="field-value">{v === null || v === undefined ? '-' : (typeof v === 'number' ? formatNumber(v) : String(v))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="detail-actions">
                        <button onClick={() => handleCloseDetail(stock.symbol)} className="btn-close-detail">Close</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        // Show all stocks grouped by portfolio
        Object.keys(groupedStocks).length === 0 && !editingStock ? (
          <div className="no-stocks">No stocks found. Add a new stock to get started.</div>
        ) : (
          Object.entries(groupedStocks).map(([portfolio, portfolioStocks]) => (
            <div key={portfolio} className="portfolio-group">
              <h3 className="portfolio-name">{portfolio}</h3>
              
              {portfolioStocks.map((stock) => {
                const key = stock.id || stock.symbol;
                const isEditing = editingStock?.id === stock.id;
                const stockData = isEditing ? editingStock : stock;

                return (
                  <div key={key} className="stock-card">
                    <div className="stock-header">
                      <h4 className="stock-symbol">{stock.symbol}</h4>
                      <div className="action-buttons">
                        {/* Always show Edit/Delete if stock has editable fields */}
                        <button onClick={() => handleEdit(stock)} className="btn-edit">Edit</button>
                        <button onClick={() => handleDeleteStock(stock)} className="btn-delete">Delete</button>
                        <br />
                        <DownloadReportButton />
                      </div>
                    </div>

                    <div className="stock-model-name">
                      <strong>Model:</strong> {stock.symbol} Stock Trade
                    </div>

                    <table className="stock-table">
                      <thead>
                        <tr>
                          <th>Field</th>
                          <th>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {editableFields.map((field) => (
                          <tr key={field}>
                            <td className="field-name">
                              {field.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                            </td>
                            <td>
                              {isEditing ? (
                                <input
                                  type={field.includes('price') || field.includes('high') || field.includes('low') ? 'number' : 'text'}
                                  step={field.includes('price') || field.includes('high') || field.includes('low') ? '0.01' : undefined}
                                  value={stockData[field] || ''}
                                  onChange={(e) => handleFieldChange(field, e.target.value)}
                                  className="editable-input"
                                  placeholder={`Enter ${field}`}
                                />
                              ) : (
                                <span className="field-value">
                                  {field === 'symbol' || field === 'current_portfolio'
                                    ? stockData[field] || '-'
                                    : field.includes('price') || field.includes('high') || field.includes('low')
                                    ? formatCurrency(stockData[field])
                                    : formatNumber(stockData[field])}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}

                        {readOnlyFields.map((field) => (
                          <tr key={field} className={isEditing ? 'disabled-row' : ''}>
                            <td className="field-name">
                              {field.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                            </td>
                            <td>
                              <span className={`field-value ${isEditing ? 'disabled' : ''}`}>
                                {field.includes('value') || field.includes('cost') || field.includes('profit')
                                  ? formatCurrency(stockData[field])
                                  : field === 'percent_holding'
                                  ? `${formatNumber(stockData[field])}%`
                                  : formatNumber(stockData[field])}
                              </span>
                            </td>
                          </tr>
                        ))}

                        <tr>
                          <td className="field-name">Date Time</td>
                          <td>
                            <span className="field-value">
                              {stockData.date_time_field
                                ? new Date(stockData.date_time_field).toLocaleString()
                                : '-'}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    {expandedSymbol === stock.symbol && expandedDetails[stock.symbol] && (
                      <div className="stock-detail-panel">
                        <h5>Details for {stock.symbol}</h5>
                        <table className="stock-table">
                          <tbody>
                            {Object.entries(expandedDetails[stock.symbol]).map(([k, v]) => (
                              <tr key={k}>
                                <td className="field-name">{k.replace(/_/g, ' ')}</td>
                                <td className="field-value">{v === null || v === undefined ? '-' : (typeof v === 'number' ? formatNumber(v) : String(v))}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="detail-actions">
                          <button onClick={() => handleCloseDetail(stock.symbol)} className="btn-close-detail">Close</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )
      )}
    </div>
  );
};

export default StockPortfolio;

