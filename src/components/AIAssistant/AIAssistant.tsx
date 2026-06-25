import React, { useState } from 'react';
import { Card, Button, Input, List, Space, Tag, Modal, Divider, Badge } from 'antd';
import { Sparkles, MessageSquare, Send, X, ArrowRight, Bot, Coffee, CalendarRange, DollarSign, FileText, SendHorizontal } from 'lucide-react';
import { showToast } from '../Feedback/ToastAlerts';

interface AIAssistantProps {
  inline?: boolean;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ inline = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<any[]>([
    {
      sender: 'bot',
      text: 'Hello! I am your EventHub 360 AI Event Assistant. How can I help optimize your banquet operations today?',
      timestamp: 'Just now'
    }
  ]);
  const [loading, setLoading] = useState(false);

  const predefinedPrompts = [
    { label: 'Suggest Menu', icon: <Coffee size={14} />, prompt: 'Suggest a premium culinary menu for a luxury corporate gala of 300 guests.' },
    { label: 'Generate Timeline', icon: <CalendarRange size={14} />, prompt: 'Generate an hourly operational timeline for a wedding banquet starting at 4 PM.' },
    { label: 'Estimate Budget', icon: <DollarSign size={14} />, prompt: 'Estimate the banquet event budget for 150 guests at $95 per head package rate.' },
    { label: 'Summarize BEO', icon: <FileText size={14} />, prompt: 'Provide an executive summary of BEO #8842-A.' }
  ];

  const handleSend = (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Add user message
    const userMsg = { sender: 'user', text: textToSend, timestamp: 'Just now' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Simulate AI response delay
    setTimeout(() => {
      let botText = '';
      if (textToSend.toLowerCase().includes('menu') || textToSend.toLowerCase().includes('culinary')) {
        botText = `### 🍽️ AI Suggested Menu: Platinum Signature Package
*   **Hors D'oeuvres:** Truffle Arancini with Saffron Aioli, Seared Wagyu Beef Carpaccio Crostini, and Oyster Shooter with Citrus foam.
*   **Main Courses:** Pan-Seared Chilean Sea Bass with Lemon Herb reduction, and Slow-Roasted Filet Mignon with Asparagus spears.
*   **Dessert:** Chocolate Dome Melt with Warm Salted Caramel, and Raspberry Mousse Tartlets.
*   **Estimated Cost:** $85.00 per cover (culinary margin: ~74%).`;
      } else if (textToSend.toLowerCase().includes('timeline') || textToSend.toLowerCase().includes('schedule')) {
        botText = `### 📅 AI Suggested Event Timeline: Wedding Banquet
*   **15:00 - 16:00** — Vendor Setup & AV Sound checks (Imperial Ballroom).
*   **16:00 - 17:00** — Guest Arrival & Welcome Drinks (Foyer / Zenith Sky Terrace).
*   **17:00 - 17:30** — Official Toasting & Groom/Bride Grand Entry.
*   **18:00 - 19:30** — Appetizer & Hors D'oeuvres tray service.
*   **19:30 - 21:00** — Main Course Buffet / Plated Dinner Service.
*   **21:00 - 22:00** — Cake Cutting, Toasting & First Dance.
*   **22:00 - 23:00** — DJ Live Sets & Late Night Snacks.`;
      } else if (textToSend.toLowerCase().includes('budget') || textToSend.toLowerCase().includes('estimate')) {
        botText = `### 💰 AI Budget Estimation Analysis
*   **F&B Package Costs:** 150 guests × $95/pax = **$14,250**
*   **Room Rental Hold Fee:** Zenith Sky Terrace = **$3,500**
*   **AV & Staging Add-ons:** Projectors, wireless microphones = **$1,200**
*   **Decor & Furnishing Setup:** Gold Chiavari chairs + linen = **$850**
*   **Subtotal:** **$19,800**
*   **Service Charge (18%):** **$3,564**
*   **Est. Grand Total:** **$23,364.00**
*   **Minimum Deposit (50%):** **$11,682.00**`;
      } else if (textToSend.toLowerCase().includes('beo') || textToSend.toLowerCase().includes('summarize')) {
        botText = `### 📝 BEO Executive Summary: Ref #8842-A
*   **Client Name:** Global Tech Solutions (Annual Corporate Gala).
*   **Room Assignment:** Imperial Ballroom (max seating used: 450 Pax).
*   **Timeline Status:** Confirmed starting at 18:00 on Sept 5, 2024.
*   **Stakeholder approvals:** Sales Mgr (Alex), Banquet Mgr (Marc) approved. Kitchen and Finance holds pending.
*   **Notes:** High priority catering. Gluten-free preferences apply to 12 guest seats.`;
      } else {
        botText = `I have logged your request: "${textToSend}". Under EventHub 360 AI modules, I suggest generating an operational event timeline or estimating room packaging budgets. What templates would you like me to populate?`;
      }

      setMessages(prev => [...prev, { sender: 'bot', text: botText, timestamp: 'Just now' }]);
      setLoading(false);
      showToast.success('AI suggestions generated successfully.');
    }, 1200);
  };

  const renderContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: inline ? '450px' : '500px' }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#f8fafc' }}>
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            style={{ 
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              background: msg.sender === 'user' ? '#9e2a2b' : '#fff',
              color: msg.sender === 'user' ? '#fff' : '#1e293b',
              padding: '12px 16px',
              borderRadius: msg.sender === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
              border: msg.sender === 'user' ? '0' : '1px solid #e2e8f0',
              fontSize: '13px',
              whiteSpace: 'pre-line'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', opacity: 0.8, fontSize: '10px' }}>
              {msg.sender === 'bot' ? <Bot size={12} /> : <UserCheckIcon />}
              <span>{msg.sender === 'bot' ? 'EventHub AI' : 'User'}</span>
            </div>
            {msg.text}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', background: '#fff', padding: '12px 16px', borderRadius: '12px 12px 12px 0', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="dot-pulse"></span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>AI is thinking...</span>
          </div>
        )}
      </div>

      <Divider style={{ margin: 0 }} />

      {/* Suggested Prompts */}
      <div style={{ padding: '12px', background: '#fff' }}>
        <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Quick Tasks</span>
        <Space wrap>
          {predefinedPrompts.map((p, idx) => (
            <Button 
              key={idx} 
              size="small" 
              icon={p.icon}
              onClick={() => handleSend(p.prompt)}
              style={{ fontSize: '11px', borderRadius: '16px' }}
            >
              {p.label}
            </Button>
          ))}
        </Space>
      </div>

      {/* Input */}
      <div style={{ padding: '12px', background: '#fff', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', display: 'flex', gap: '8px' }}>
        <Input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI Event Assistant..."
          onPressEnter={() => handleSend(input)}
          style={{ borderRadius: '8px' }}
          disabled={loading}
        />
        <Button 
          type="primary" 
          icon={<SendHorizontal size={16} />}
          onClick={() => handleSend(input)}
          style={{ backgroundColor: '#9e2a2b', borderColor: '#9e2a2b', borderRadius: '8px' }}
          disabled={loading}
        />
      </div>
    </div>
  );

  if (inline) {
    return (
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9e2a2b', fontWeight: 700 }}>
            <Sparkles size={18} />
            <span>AI Event Assistant</span>
          </div>
        }
        style={{ borderRadius: '16px', border: '1px solid #ffe5e5', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}
        bodyStyle={{ padding: 0 }}
      >
        {renderContent()}
      </Card>
    );
  }

  return (
    <>
      {/* Floating Action Button */}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}>
        <Badge status="processing" offset={[-2, 2]}>
          <Button 
            type="primary" 
            shape="circle" 
            size="large"
            icon={<Sparkles size={20} />}
            onClick={() => setIsOpen(true)}
            style={{ 
              width: '56px', 
              height: '56px', 
              backgroundColor: '#9e2a2b', 
              borderColor: '#9e2a2b', 
              boxShadow: '0 10px 15px -3px rgba(158, 42, 43, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          />
        </Badge>
      </div>

      {/* Floating Chat Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a8201a' }}>
            <Sparkles size={18} />
            <strong style={{ fontSize: '15px' }}>AI Operations Copilot</strong>
          </div>
        }
        open={isOpen}
        onCancel={() => setIsOpen(false)}
        footer={null}
        width={420}
        style={{ position: 'fixed', bottom: '80px', right: '24px', margin: 0, paddingBottom: 0 }}
        bodyStyle={{ padding: 0 }}
        modalRender={(modal) => (
          <div style={{ borderRadius: '16px', overflow: 'hidden' }}>{modal}</div>
        )}
      >
        {renderContent()}
      </Modal>
    </>
  );
};

const UserCheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block' }}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
