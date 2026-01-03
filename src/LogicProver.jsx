// LogicProver.jsx
import React, { useState } from 'react';
import { solveProof } from './logicSolver'; // Import the logic file created above
import { ArrowRight, BrainCircuit, RefreshCcw, Info } from 'lucide-react';

const LogicProver = () => {
  const [premises, setPremises] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSolve = () => {
    setLoading(true);
    setResult(null);

    // Using setTimeout to allow UI to update loading state before heavy calculation
    setTimeout(() => {
      try {
        const output = solveProof(premises, conclusion);
        setResult(output);
      } catch (e) {
        setResult({ success: false, message: "An unexpected error occurred." });
      }
      setLoading(false);
    }, 100);
  };

  const handleClear = () => {
    setPremises('');
    setConclusion('');
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans text-slate-800">
      
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-2xl shadow-lg mb-4">
          <BrainCircuit className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Logic Prover</h1>
        <p className="text-slate-500 mt-2">Automated Propositional Logic Solver</p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        
        {/* Legend / Info Bar */}
        <div className="bg-slate-100 px-6 py-3 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500 uppercase tracking-wider font-semibold">
          <span className="flex items-center gap-2"><Info className="w-4 h-4" /> Syntax Guide</span>
          <div className="space-x-4">
            <span>. (AND)</span>
            <span>v (OR)</span>
            <span>&gt; (IF)</span>
            <span>~ (NOT)</span>
          </div>
        </div>

        <div className="p-8 space-y-6">
          
          {/* Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Premises</label>
              <input 
                type="text" 
                placeholder="P > Q, P"
                value={premises}
                onChange={(e) => setPremises(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
              />
              <p className="text-xs text-slate-400">Separate multiple with commas</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Conclusion</label>
              <input 
                type="text" 
                placeholder="Q"
                value={conclusion}
                onChange={(e) => setConclusion(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button 
              onClick={handleSolve}
              disabled={!premises || !conclusion || loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Solving...' : 'Generate Proof'} <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={handleClear}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium py-3 px-4 rounded-xl transition-all"
              aria-label="Clear inputs"
            >
              <RefreshCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Results Area */}
        {result && (
          <div className={`border-t ${result.success ? 'bg-indigo-50/50' : 'bg-red-50/50'} p-8 animate-in fade-in slide-in-from-bottom-4 duration-500`}>
            
            {result.success ? (
              <div>
                <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span> Proof Found
                </h3>
                <div className="bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-indigo-50 text-indigo-900 font-semibold border-b border-indigo-100">
                      <tr>
                        <th className="px-4 py-3 w-16">Step</th>
                        <th className="px-4 py-3">Expression</th>
                        <th className="px-4 py-3 text-right">Rule</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {result.steps.map((step) => (
                        <tr key={step.index} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-slate-500">{step.index}</td>
                          <td className="px-4 py-3 font-mono text-slate-700 font-medium tracking-wide">
                            {step.expression}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-500">
                            <span className="bg-slate-100 px-2 py-1 rounded text-xs font-semibold text-slate-600 mr-2">
                              {step.rule}
                            </span>
                            <span className="text-xs">{step.ref}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                 <h3 className="text-lg font-bold text-red-900 mb-2">Unable to Prove</h3>
                 <p className="text-red-600">{result.message}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LogicProver;