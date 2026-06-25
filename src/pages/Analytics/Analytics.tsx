import React, { useState } from 'react';
import { Card, Row, Col, Progress, Table, Tag, Button, Divider, Space, Tooltip } from 'antd';
import { 
  BarChart3, 
  TrendingUp, 
  Landmark, 
  Sparkles, 
  DollarSign, 
  Download, 
  Layers, 
  PieChart, 
  CalendarDays, 
  Activity,
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import { showToast } from '../../components/Feedback/ToastAlerts';

export const BIAnalytics: React.FC = () => {
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);

  // Table Columns for spaces
  const plColumns = [
    {
      title: 'Banquet Space',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <strong style={{ color: '#1e293b' }}>{text}</strong>
    },
    {
      title: 'Occupancy Rate',
      dataIndex: 'utilization',
      key: 'utilization',
      render: (rate: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Progress percent={rate} size="small" strokeColor="#a8201a" showInfo={false} style={{ width: '80px' }} />
          <span style={{ fontWeight: 600 }}>{rate}%</span>
        </div>
      )
    },
    {
      title: 'Gross Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (rev: number) => <span style={{ fontWeight: 600, color: '#0f766e' }}>${rev.toLocaleString()}</span>
    },
    {
      title: 'Culinary Cost (F&B)',
      dataIndex: 'cost',
      key: 'cost',
      render: (cost: number) => <span style={{ color: '#dc2626', fontWeight: 500 }}>${cost.toLocaleString()}</span>
    },
    {
      title: 'Profit Margin',
      dataIndex: 'margin',
      key: 'margin',
      render: (margin: number) => {
        const isHigh = margin >= 65;
        return <Tag color={isHigh ? 'green' : 'orange'} style={{ fontWeight: 600 }}>{margin}% Margin</Tag>;
      }
    }
  ];

  const plData = [
    { key: '1', name: 'Imperial Grand Ballroom', utilization: 78, revenue: 165000, cost: 58000, margin: 65 },
    { key: '2', name: 'Zenith Sky Terrace', utilization: 45, revenue: 68000, cost: 21000, margin: 69 },
    { key: '3', name: 'Royal Dining Wing', utilization: 92, revenue: 42000, cost: 18000, margin: 57 },
    { key: '4', name: 'Emerald Pavilion', utilization: 60, revenue: 38000, cost: 12000, margin: 68 }
  ];

  // Seasonal Trends Forecast Coordinates (Jan to Dec)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Actual values (current year is compiled up to June)
  const actualOccupancy = [48, 55, 70, 82, 88, 94]; 
  // Forecasted values
  const forecastOccupancy = [46, 52, 66, 80, 90, 96, 92, 84, 80, 86, 92, 96];

  // Helper function to export CSVs
  const downloadCSV = (filename: string, headers: string[], rows: any[][]) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => {
        const str = String(val).replace(/"/g, '""');
        return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast.success(`Export successful: ${filename}`);
  };

  const handleExportOccupancy = () => {
    const headers = ["Month", "Year", "Actual Occupancy %", "Forecast Occupancy %", "Estimated Events", "Revenue Goal ($)"];
    const rows = months.map((month, idx) => [
      month,
      "2026",
      actualOccupancy[idx] !== undefined ? `${actualOccupancy[idx]}%` : "N/A",
      `${forecastOccupancy[idx]}%`,
      Math.round(forecastOccupancy[idx] * 0.3),
      `$${(forecastOccupancy[idx] * 2200).toLocaleString()}`
    ]);
    downloadCSV("EventHub_Occupancy_Forecast_Report.csv", headers, rows);
  };

  const handleExportRevenue = () => {
    const headers = ["Revenue Category", "Q1 Actual ($)", "Q2 Actual ($)", "Q3 Projection ($)", "Q4 Projection ($)", "Annual Estimated ($)"];
    const rows = [
      ["Ballroom Space Rental", "45,000", "52,000", "58,000", "65,000", "220,000"],
      ["Food & Beverage Catering", "85,000", "98,000", "110,000", "125,000", "418,000"],
      ["Audio Visual & Stage Setup", "18,000", "22,000", "24,000", "30,000", "94,000"],
      ["Decor & Layout Design Services", "12,000", "15,000", "16,000", "18,000", "61,000"],
      ["Valet & Guest Operations", "5,000", "6,500", "8,000", "10,000", "29,500"]
    ];
    downloadCSV("EventHub_Revenue_Projection_Matrix.csv", headers, rows);
  };

  const handleExportClients = () => {
    const headers = ["Client Name", "Organization", "Events Hosted", "Total Value ($)", "Last Event Date", "Account Status"];
    const rows = [
      ["Sophia Loren", "Vanderbilt Gala Foundation", "3", "74,500", "2026-05-12", "Active"],
      ["Arthur Pendragon", "Camelot Financial Corp", "5", "125,000", "2026-06-18", "Active"],
      ["Marcus Aurelius", "Stoic Tech Summit", "2", "38,000", "2026-04-05", "Dormant"],
      ["Guinevere du Lac", "Rose Garden Florals", "4", "48,200", "2026-06-01", "Active"],
      ["Galahad Vance", "Holy Grail Society", "1", "15,600", "2026-03-24", "Active"]
    ];
    downloadCSV("EventHub_Top_Clients_Directory.csv", headers, rows);
  };

  const handleExportFBCost = () => {
    const headers = ["Culinary Package", "Base Charge per Head ($)", "Ingredient Cost ($)", "Staffing Overhead ($)", "Profit Yield ($)", "Net Profit Margin %"];
    const rows = [
      ["Royal Platinum Feast", "125", "38.50", "20.00", "66.50", "53.2%"],
      ["Gourmet Diamond Banquet", "95", "28.00", "16.00", "51.00", "53.6%"],
      ["Sapphire High-Tea & Hors d'oeuvres", "65", "15.50", "12.00", "37.50", "57.7%"],
      ["Emerald Country Buffet", "75", "22.00", "14.00", "39.00", "52.0%"],
      ["Imperial Gold Brunch", "85", "24.50", "15.00", "45.50", "53.5%"]
    ];
    downloadCSV("EventHub_Culinary_FB_Cost_Audit.csv", headers, rows);
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Business Intelligence
        </span>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b', margin: '4px 0 0 0' }}>
          BI Analytics Center
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
          Executive dashboard tracking conversion funnels, seasonal occupancy forecasts, and F&B cost structures.
        </p>
      </div>

      {/* Metrics Row */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: '16px', border: '1px solid #eef0f2', background: '#fff' }} bodyStyle={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Occupancy Forecast</span>
              <div style={{ padding: '6px', background: 'rgba(158, 42, 43, 0.08)', borderRadius: '8px' }}>
                <CalendarDays size={18} color="#9e2a2b" />
              </div>
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#1e293b' }}>86% Peak</h3>
            <span style={{ fontSize: '12px', color: '#22c55e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
              <TrendingUp size={14} /> +8% vs. Last Quarter
            </span>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: '16px', border: '1px solid #eef0f2', background: '#fff' }} bodyStyle={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Lead Conversion Ratio</span>
              <div style={{ padding: '6px', background: 'rgba(139, 92, 246, 0.08)', borderRadius: '8px' }}>
                <Activity size={18} color="#8b5cf6" />
              </div>
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#1e293b' }}>15.0%</h3>
            <span style={{ fontSize: '12px', color: '#22c55e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
              <TrendingUp size={14} /> +2.1% Industry Avg (12.9%)
            </span>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: '16px', border: '1px solid #eef0f2', background: '#fff' }} bodyStyle={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Total Bookings Value</span>
              <div style={{ padding: '6px', background: 'rgba(13, 148, 136, 0.08)', borderRadius: '8px' }}>
                <DollarSign size={18} color="#0d9488" />
              </div>
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#1e293b' }}>$313,200</h3>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, display: 'block', marginTop: '6px' }}>
              Progress to target: 89.4%
            </span>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: '16px', border: '1px solid #eef0f2', background: '#fff' }} bodyStyle={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>F&B Culinary Margin</span>
              <div style={{ padding: '6px', background: 'rgba(217, 119, 6, 0.08)', borderRadius: '8px' }}>
                <TrendingUp size={18} color="#d97706" />
              </div>
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#1e293b' }}>64.8%</h3>
            <span style={{ fontSize: '12px', color: '#ea580c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
              <TrendingDown size={14} /> -1.2% food cost index inflation
            </span>
          </Card>
        </Col>
      </Row>

      {/* Main Analytics Graph row */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        {/* Left Side: Seasonal Trend Forecast */}
        <Col xs={24} xl={16}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 size={18} color="#a8201a" />
                <span>Seasonal Trends & Occupancy Forecast (2026-2027)</span>
              </div>
            }
            extra={
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                  <span style={{ display: 'inline-block', width: '12px', height: '4px', backgroundColor: '#9e2a2b', borderRadius: '2px' }}></span>
                  Actual 2026
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                  <span style={{ display: 'inline-block', width: '12px', height: '4px', borderTop: '2px dashed #8b5cf6' }}></span>
                  AI Forecast 2026/27
                </span>
              </div>
            }
            style={{ borderRadius: '16px', border: '1px solid #eef0f2', minHeight: '390px' }}
          >
            <div style={{ position: 'relative', width: '100%', height: '280px', padding: '10px 0' }}>
              {/* Custom SVG Line Chart */}
              <svg viewBox="0 0 800 250" width="100%" height="100%" style={{ overflow: 'visible' }}>
                {/* Definitions for gradients */}
                <defs>
                  <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#9e2a2b" stopOpacity="0.25"/>
                    <stop offset="100%" stopColor="#9e2a2b" stopOpacity="0.00"/>
                  </linearGradient>
                  <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.10"/>
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.00"/>
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                <line x1="60" y1="40" x2="760" y2="40" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                <text x="50" y="44" textAnchor="end" fontSize="10" fill="#94a3b8" fontWeight="600">100%</text>

                <line x1="60" y1="90" x2="760" y2="90" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                <text x="50" y="94" textAnchor="end" fontSize="10" fill="#94a3b8" fontWeight="600">75%</text>

                <line x1="60" y1="140" x2="760" y2="140" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                <text x="50" y="144" textAnchor="end" fontSize="10" fill="#94a3b8" fontWeight="600">50%</text>

                <line x1="60" y1="190" x2="760" y2="190" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                <text x="50" y="194" textAnchor="end" fontSize="10" fill="#94a3b8" fontWeight="600">25%</text>

                <line x1="60" y1="240" x2="760" y2="240" stroke="#cbd5e1" strokeWidth="1.5" />
                <text x="50" y="244" textAnchor="end" fontSize="10" fill="#94a3b8" fontWeight="600">0%</text>

                {/* X Axis Month Labels */}
                {months.map((month, idx) => {
                  const x = 60 + idx * (700 / 11);
                  const isHovered = selectedMonthIndex === idx;
                  return (
                    <g key={idx}>
                      <text 
                        x={x} 
                        y="262" 
                        textAnchor="middle" 
                        fontSize="11" 
                        fill={isHovered ? '#1e293b' : '#64748b'} 
                        fontWeight={isHovered ? '700' : '500'}
                        style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={() => setSelectedMonthIndex(idx)}
                        onMouseLeave={() => setSelectedMonthIndex(null)}
                      >
                        {month}
                      </text>
                      {/* Vertical line indicator on hover */}
                      {isHovered && (
                        <line x1={x} y1="40" x2={x} y2="240" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
                      )}
                    </g>
                  );
                })}

                {/* Shaded Area under Actual path (gradient) */}
                <path 
                  d="M 60,240 L 60,144 L 123.6,130 L 187.3,100 L 250.9,76 L 314.5,64 L 378.2,52 L 378.2,240 Z" 
                  fill="url(#actualGradient)" 
                />

                {/* Shaded Area under Forecast path (gradient) */}
                <path 
                  d="M 60,240 L 60,148 L 123.6,136 L 187.3,108 L 250.9,80 L 314.5,60 L 378.2,48 L 441.8,56 L 505.5,72 L 569.1,80 L 632.7,68 L 696.4,56 L 760,48 L 760,240 Z" 
                  fill="url(#forecastGradient)" 
                />

                {/* AI Forecast Dotted Line */}
                <path 
                  d="M 60,148 L 123.6,136 L 187.3,108 L 250.9,80 L 314.5,60 L 378.2,48 L 441.8,56 L 505.5,72 L 569.1,80 L 632.7,68 L 696.4,56 L 760,48" 
                  fill="none" 
                  stroke="#8b5cf6" 
                  strokeWidth="2.5" 
                  strokeDasharray="5 5" 
                />

                {/* Actual Solid Line */}
                <path 
                  d="M 60,144 L 123.6,130 L 187.3,100 L 250.9,76 L 314.5,64 L 378.2,52" 
                  fill="none" 
                  stroke="#9e2a2b" 
                  strokeWidth="3.5" 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Circle markers for Forecast values */}
                {forecastOccupancy.map((val, idx) => {
                  const x = 60 + idx * (700 / 11);
                  const y = 240 - (val / 100) * 200;
                  const isHovered = selectedMonthIndex === idx;
                  
                  return (
                    <g key={`f-${idx}`}>
                      <circle 
                        cx={x} 
                        cy={y} 
                        r={isHovered ? 6 : 4} 
                        fill="#ffffff" 
                        stroke="#8b5cf6" 
                        strokeWidth={isHovered ? 3 : 2} 
                        style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={() => setSelectedMonthIndex(idx)}
                        onMouseLeave={() => setSelectedMonthIndex(null)}
                      />
                      {isHovered && (
                        <g>
                          <rect x={x - 28} y={y - 28} width="56" height="20" rx="4" fill="#8b5cf6" />
                          <text x={x} y={y - 15} textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="700">F: {val}%</text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* Circle markers for Actual values */}
                {actualOccupancy.map((val, idx) => {
                  const x = 60 + idx * (700 / 11);
                  const y = 240 - (val / 100) * 200;
                  const isHovered = selectedMonthIndex === idx;
                  
                  return (
                    <g key={`a-${idx}`}>
                      <circle 
                        cx={x} 
                        cy={y} 
                        r={isHovered ? 7 : 5} 
                        fill="#9e2a2b" 
                        stroke="#ffffff" 
                        strokeWidth="2"
                        style={{ cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                        onMouseEnter={() => setSelectedMonthIndex(idx)}
                        onMouseLeave={() => setSelectedMonthIndex(null)}
                      />
                      {isHovered && (
                        <g>
                          <rect x={x - 28} y={y - 28} width="56" height="20" rx="4" fill="#9e2a2b" />
                          <text x={x} y={y - 15} textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="700">A: {val}%</text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', marginTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="#8b5cf6" />
                <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: 600 }}>AI Forecast Prediction:</span>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                  November & December 2026 are forecasted at <strong>92% & 96% occupancy</strong>. We suggest triggering early-bird corporate package reservations.
                </p>
              </div>
              <Tag color="purple" style={{ fontWeight: 700 }}>High Reliability</Tag>
            </div>
          </Card>
        </Col>

        {/* Right Side: Booking Conversion Funnel */}
        <Col xs={24} xl={8}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color="#a8201a" />
                <span>Lead Conversion Funnel</span>
              </div>
            }
            style={{ borderRadius: '16px', border: '1px solid #eef0f2', minHeight: '390px' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '310px', justifyContent: 'space-between', padding: '10px 0' }}>
              <svg viewBox="0 0 420 280" width="100%" height="100%" style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="funnel1" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#bd3a42"/><stop offset="100%" stopColor="#9e2a2b"/>
                  </linearGradient>
                  <linearGradient id="funnel2" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f59e0b"/><stop offset="100%" stopColor="#d97706"/>
                  </linearGradient>
                  <linearGradient id="funnel3" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#a855f7"/><stop offset="100%" stopColor="#8b5cf6"/>
                  </linearGradient>
                  <linearGradient id="funnel4" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0d9488"/><stop offset="100%" stopColor="#0f766e"/>
                  </linearGradient>
                </defs>

                {/* Stage 1: Inquiries */}
                <polygon points="40,10 320,10 290,60 70,60" fill="url(#funnel1)" opacity="0.95" />
                <text x="180" y="36" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="700">1. Inquiries — 1,200 leads</text>
                <text x="305" y="36" textAnchor="start" fill="#9e2a2b" fontSize="11" fontWeight="800">100%</text>

                {/* Arrow & Drop-off 1 */}
                <text x="330" y="65" textAnchor="start" fill="#64748b" fontSize="10" fontWeight="600">➔ 37.5% Holds</text>

                {/* Stage 2: Holds */}
                <polygon points="75,70 285,70 255,120 105,120" fill="url(#funnel2)" opacity="0.95" />
                <text x="180" y="96" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="700">2. Holds & Holds — 450</text>
                <text x="272" y="96" textAnchor="start" fill="#d97706" fontSize="11" fontWeight="800">37.5%</text>

                {/* Arrow & Drop-off 2 */}
                <text x="315" y="125" textAnchor="start" fill="#64748b" fontSize="10" fontWeight="600">➔ 46.6% Deposit</text>

                {/* Stage 3: Deposit Paid */}
                <polygon points="110,130 250,130 225,180 135,180" fill="url(#funnel3)" opacity="0.95" />
                <text x="180" y="156" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="700">3. Deposit Paid — 210</text>
                <text x="240" y="156" textAnchor="start" fill="#8b5cf6" fontSize="11" fontWeight="800">17.5%</text>

                {/* Arrow & Drop-off 3 */}
                <text x="290" y="185" textAnchor="start" fill="#64748b" fontSize="10" fontWeight="600">➔ 85.7% Confirmed</text>

                {/* Stage 4: Confirmed */}
                <polygon points="140,190 220,190 205,240 155,240" fill="url(#funnel4)" opacity="0.95" />
                <text x="180" y="218" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="700">4. Confirmed — 180</text>
                <text x="210" y="218" textAnchor="start" fill="#0d9488" fontSize="11" fontWeight="800">15.0%</text>
              </svg>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Donut Chart & Export Center Row */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        {/* Left Side: Top Client Profiles & Event Distribution */}
        <Col xs={24} md={12}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PieChart size={18} color="#a8201a" />
                <span>Event Segment Distribution</span>
              </div>
            }
            style={{ borderRadius: '16px', border: '1px solid #eef0f2', minHeight: '320px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '220px' }}>
              <div style={{ width: '45%', display: 'flex', justifyContent: 'center' }}>
                <svg viewBox="0 0 200 200" width="100%" height="100%">
                  {/* Gray Background Circle */}
                  <circle cx="100" cy="100" r="60" fill="transparent" stroke="#f8fafc" strokeWidth="22" />
                  
                  {/* Corporate segment (40%) - Circumference is 377 */}
                  {/* length = 377 * 0.4 = 150.8, offset = 0 */}
                  <circle cx="100" cy="100" r="60" fill="transparent" stroke="#9e2a2b" strokeWidth="22" 
                    strokeDasharray="150.8 377" strokeDashoffset="0" transform="rotate(-90 100 100)" strokeLinecap="round" />
                  
                  {/* Weddings & Socials (35%) */}
                  {/* length = 377 * 0.35 = 131.95, offset = -150.8 */}
                  <circle cx="100" cy="100" r="60" fill="transparent" stroke="#d97706" strokeWidth="22" 
                    strokeDasharray="131.95 377" strokeDashoffset="-150.8" transform="rotate(-90 100 100)" strokeLinecap="round" />
                  
                  {/* Conferences & Govt Associations (15%) */}
                  {/* length = 377 * 0.15 = 56.55, offset = -282.75 */}
                  <circle cx="100" cy="100" r="60" fill="transparent" stroke="#8b5cf6" strokeWidth="22" 
                    strokeDasharray="56.55 377" strokeDashoffset="-282.75" transform="rotate(-90 100 100)" strokeLinecap="round" />
                  
                  {/* Others (10%) */}
                  {/* length = 377 * 0.1 = 37.7, offset = -339.3 */}
                  <circle cx="100" cy="100" r="60" fill="transparent" stroke="#0d9488" strokeWidth="22" 
                    strokeDasharray="37.7 377" strokeDashoffset="-339.3" transform="rotate(-90 100 100)" strokeLinecap="round" />
                  
                  {/* Inner text details */}
                  <text x="100" y="94" textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="600">Total Booked</text>
                  <text x="100" y="118" textAnchor="middle" fontSize="22" fill="#1e293b" fontWeight="800">384</text>
                </svg>
              </div>

              {/* Legends list */}
              <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', backgroundColor: '#9e2a2b', borderRadius: '50%' }}></span>
                    <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: 500 }}>Corporate Accounts</span>
                  </div>
                  <strong style={{ color: '#9e2a2b' }}>40%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', backgroundColor: '#d97706', borderRadius: '50%' }}></span>
                    <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: 500 }}>Weddings & Socials</span>
                  </div>
                  <strong style={{ color: '#d97706' }}>35%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', backgroundColor: '#8b5cf6', borderRadius: '50%' }}></span>
                    <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: 500 }}>Conferences & Govt</span>
                  </div>
                  <strong style={{ color: '#8b5cf6' }}>15%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', backgroundColor: '#0d9488', borderRadius: '50%' }}></span>
                    <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: 500 }}>Other Ceremonies</span>
                  </div>
                  <strong style={{ color: '#0d9488' }}>10%</strong>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* Right Side: Export Center Integration */}
        <Col xs={24} md={12}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Download size={18} color="#a8201a" />
                <span>Executive Export Center</span>
              </div>
            }
            style={{ borderRadius: '16px', border: '1px solid #eef0f2', minHeight: '320px' }}
          >
            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>
              Compile local database registries into standard CSV spreadsheets for offline bookkeeping or billing reviews.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '13px', color: '#1e293b' }}>Space Occupancy Forecast Logs</strong>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Includes 12-month projections & capacity targets</span>
                </div>
                <Button type="primary" size="small" icon={<Download size={14} />} onClick={handleExportOccupancy} style={{ backgroundColor: '#1e293b', borderColor: '#1e293b', borderRadius: '6px' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '13px', color: '#1e293b' }}>Revenue & Cash Projection Matrix</strong>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Quarterly breakdown of gross contract values</span>
                </div>
                <Button type="primary" size="small" icon={<Download size={14} />} onClick={handleExportRevenue} style={{ backgroundColor: '#1e293b', borderColor: '#1e293b', borderRadius: '6px' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '13px', color: '#1e293b' }}>Top Enterprise Client Profiles</strong>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Gala foundations & business client directories</span>
                </div>
                <Button type="primary" size="small" icon={<Download size={14} />} onClick={handleExportClients} style={{ backgroundColor: '#1e293b', borderColor: '#1e293b', borderRadius: '6px' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '13px', color: '#1e293b' }}>Food & Beverage Cost & Profit Audit</strong>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Ingredient margins per head for catering logs</span>
                </div>
                <Button type="primary" size="small" icon={<Download size={14} />} onClick={handleExportFBCost} style={{ backgroundColor: '#1e293b', borderColor: '#1e293b', borderRadius: '6px' }} />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* P&L Table (Existing details retained & extended styling) */}
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Landmark size={18} color="#a8201a" />
            <span>Revenue per Space (P&L Aggregates)</span>
          </div>
        }
        style={{ borderRadius: '16px', border: '1px solid #eef0f2', background: '#fff' }}
      >
        <Table 
          dataSource={plData} 
          columns={plColumns} 
          pagination={false} 
          style={{ borderRadius: '8px', overflow: 'hidden' }}
        />
      </Card>
    </div>
  );
};
