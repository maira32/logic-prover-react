import React, { useState, useRef, useEffect } from 'react';
import { solveProof } from './logicSolver';
import { Send, User, Bot, Trash2, Eraser } from 'lucide-react';

const LogicProver = () => {
  // State to store the chat history
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      type: 'text',
      content: "Hello! I am your Logic Prover bot. Enter your premises and conclusion below, and I will generate a formal proof for you."
    }
  ]);

  // Inputs
  const [premises, setPremises] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Auto-scroll to bottom
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSolve = (e) => {
    e.preventDefault();
    if (!premises.trim() || !conclusion.trim()) return;

    // 1. Add User Message
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      premises: premises,
      conclusion: conclusion
    };
    
    setMessages(prev => [...prev, userMsg]);
    setPremises('');
    setConclusion('');
    setIsTyping(true);

    // 2. Simulate Bot Thinking & Solve
    setTimeout(() => {
      const result = solveProof(userMsg.premises, userMsg.conclusion);
      
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        type: 'result',
        result: result
      };

      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 600);
  };

  const clearChat = () => {
    setMessages([{
      id: 1,
      sender: 'bot',
      type: 'text',
      content: "Chat cleared. Ready for new logic problems!"
    }]);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans text-slate-800">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl text-slate-900">LogicBot</h1>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Online
            </p>
          </div>
        </div>
        <button 
          onClick={clearChat}
          className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-slate-100"
          title="Clear History"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[85%] md:max-w-[70%] gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.sender === 'user' ? 'bg-indigo-100' : 'bg-slate-200'}`}>
                {msg.sender === 'user' ? <User className="w-5 h-5 text-indigo-600" /> : <Bot className="w-5 h-5 text-slate-600" />}
              </div>

              {/* Message Bubble */}
              <div className={`rounded-2xl p-4 shadow-sm ${
                msg.sender === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-white border border-slate-200 rounded-tl-none'
              }`}>
                
                {/* User Message Content */}
                {msg.sender === 'user' && (
                  <div className="text-sm">
                    <div className="font-semibold text-indigo-200 text-xs uppercase mb-1">Request</div>
                    <p><span className="opacity-75">Premises:</span> {msg.premises}</p>
                    <p><span className="opacity-75">Conclusion:</span> {msg.conclusion}</p>
                  </div>
                )}

                {/* Bot Text Content */}
                {msg.sender === 'bot' && msg.type === 'text' && (
                  <p className="text-slate-700 leading-relaxed">{msg.content}</p>
                )}

                {/* Bot Result Content (The Proof Table) */}
                {msg.sender === 'bot' && msg.type === 'result' && (
                  <div className="space-y-3">
                    {msg.result.success ? (
                      <>
                        <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
                          <span>✅ Proof Valid</span>
                        </div>
                        <div className="bg-slate-50 rounded-lg border border-slate-100 overflow-hidden">
                          <table className="w-full text-sm text-left">
                            <thead className="bg-slate-100 text-slate-600 font-semibold">
                              <tr>
                                <th className="px-3 py-2 w-10">#</th>
                                <th className="px-3 py-2">Expression</th>
                                <th className="px-3 py-2 text-right">Rule</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {msg.result.steps.map((step) => (
                                <tr key={step.index}>
                                  <td className="px-3 py-2 text-slate-400 text-xs">{step.index}</td>
                                  <td className="px-3 py-2 font-mono text-slate-800">{step.expression}</td>
                                  <td className="px-3 py-2 text-right text-slate-500 text-xs">
                                    <span className="font-semibold mr-1">{step.rule}</span>
                                    {step.ref}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : (
                      <div className="text-red-600">
                        <p className="font-bold text-sm mb-1">❌ Unable to Prove</p>
                        <p className="text-xs opacity-90">{msg.result.message}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start w-full">
            <div className="flex gap-3 max-w-[85%]">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
              <Bot className="w-5 h-5 text-slate-600" />
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
            </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-slate-200 p-4">
        <form onSubmit={handleSolve} className="max-w-4xl mx-auto flex flex-col md:flex-row gap-3">
          
          <div className="flex-1 space-y-2 md:space-y-0 md:flex md:gap-3">
            <input
              type="text"
              value={premises}
              onChange={(e) => setPremises(e.target.value)}
              placeholder="Premises (e.g., P > Q, P)"
              className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            <input
              type="text"
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
              placeholder="Conclusion (e.g., Q)"
              className="md:w-1/3 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={!premises || !conclusion || isTyping}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white rounded-xl px-6 py-3 font-semibold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            <Send className="w-5 h-5" />
            <span className="hidden md:inline">Send</span>
          </button>
        </form>
        <div className="text-center mt-2 text-xs text-slate-400">
          Syntax: . (AND), v (OR), &gt; (IF), ~ (NOT)
        </div>
      </div>

    </div>
  );
};

export default LogicProver;