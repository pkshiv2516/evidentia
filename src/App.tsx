/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  FileText, 
  History, 
  Link as LinkIcon, 
  ChevronRight, 
  Download, 
  Loader2, 
  Sparkles,
  AlertCircle,
  Info,
  ArrowRight,
  Sliders,
  CheckCircle2,
  TrendingUp,
  Target
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { analyzeProblem } from './services/gemini';
import { CIPFReport } from './lib/cipf';
import { cn } from './lib/utils';

export default function App() {
  const [problem, setProblem] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<CIPFReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Simulation State
  const [simValues, setSimValues] = useState<Record<string, number>>({});
  const [psi, setPsi] = useState(0);

  useEffect(() => {
    if (report) {
      const initial: Record<string, number> = {};
      Object.entries(report.variable_mapping).forEach(([key, val]) => {
        initial[key] = val.initial_value;
      });
      setSimValues(initial);
    }
  }, [report]);

  useEffect(() => {
    if (Object.keys(simValues).length > 0) {
      const { CCI, ERC, RQ, SRC, IFA, DRC, IAQ, TPM } = simValues;
      const pcc = Math.pow(CCI * ERC * RQ * SRC, 0.25);
      const ics = Math.pow(IFA * DRC * IAQ * TPM, 0.25);
      const calculatedPsi = (pcc * 0.4 + ics * 0.6);
      setPsi(calculatedPsi);
    }
  }, [simValues]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problem.trim()) return;

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const result = await analyzeProblem(problem);
      setReport(result);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during analysis.");
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!report) return;
    const content = JSON.stringify({ ...report, simulation_results: { simValues, psi } }, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evidentia-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getPsiColor = (val: number) => {
    if (val > 0.7) return 'text-emerald-600';
    if (val > 0.4) return 'text-amber-600';
    return 'text-red-600';
  };

  const getPsiStatus = (val: number) => {
    if (val > 0.7) return 'High Coordination Probability';
    if (val > 0.4) return 'Marginal/Fragile Coordination';
    return 'High Risk of Failure';
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#1A1A1A] font-sans selection:bg-[#5A5A40] selection:text-white pb-24">
      {/* Navigation */}
      <nav className="border-b border-black/10 px-6 py-4 flex justify-between items-center sticky top-0 bg-[#F5F5F0]/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#1A1A1A] rounded-full flex items-center justify-center">
            <Sparkles className="text-white w-4 h-4" />
          </div>
          <span className="font-serif italic text-xl tracking-tight">Evidentia</span>
        </div>
        <div className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">
          CIPF v4.0 Engine
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-16">
        {/* Hero & Input */}
        <section className="text-center space-y-12">
          <div className="space-y-4">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-6xl md:text-7xl font-serif font-light tracking-tighter leading-none"
            >
              Evidence-Based <br />
              <span className="italic">Reasoning.</span>
            </motion.h1>
            <p className="max-w-xl mx-auto text-lg opacity-60 font-light">
              Input a coordination problem. Evidentia will retrieve historical evidence and map it to the CIPF framework.
            </p>
          </div>

          <form onSubmit={handleAnalyze} className="max-w-3xl mx-auto relative group">
            <input 
              type="text"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="e.g. 'The 2021 Suez Canal blockage coordination failure'..."
              className="w-full bg-white border border-black/10 rounded-2xl px-8 py-6 pr-20 text-xl focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all shadow-sm group-hover:shadow-md"
            />
            <button 
              type="submit"
              disabled={loading || !problem.trim()}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-[#1A1A1A] text-white rounded-xl flex items-center justify-center hover:bg-[#5A5A40] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ArrowRight className="w-6 h-6" />}
            </button>
          </form>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-xl mx-auto p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm"
            >
              <AlertCircle className="w-4 h-4" />
              {error}
            </motion.div>
          )}
        </section>

        <AnimatePresence mode="wait">
          {report && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-24"
            >
              {/* Report Header */}
              <div className="flex justify-between items-end border-b border-black/10 pb-8">
                <div className="space-y-2">
                  <h2 className="text-4xl font-serif italic">Analytical Report</h2>
                  <p className="text-sm opacity-40 uppercase tracking-widest">Synthesized from {report.historical_timeline.length} historical sources</p>
                </div>
                <button 
                  onClick={downloadReport}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-white border border-black/10 px-6 py-3 rounded-full hover:bg-black hover:text-white transition-all"
                >
                  <Download className="w-4 h-4" />
                  Export Data
                </button>
              </div>

              {/* Executive Summary */}
              <div className="grid md:grid-cols-3 gap-12">
                <div className="md:col-span-1 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] opacity-40">Executive Summary</h3>
                  <div className="w-12 h-1 bg-[#5A5A40]" />
                </div>
                <div className="md:col-span-2 text-2xl font-light leading-relaxed opacity-80">
                  <ReactMarkdown>{report.executive_summary}</ReactMarkdown>
                </div>
              </div>

              {/* Simulation & Variables */}
              <div className="space-y-12">
                <div className="flex items-center gap-4">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] opacity-40">Dynamic Simulation</h3>
                  <div className="flex-1 h-px bg-black/5" />
                  <div className="flex items-center gap-2 px-4 py-1 bg-white rounded-full border border-black/5 text-[10px] font-bold uppercase tracking-wider">
                    <Sliders className="w-3 h-3" />
                    Interactive
                  </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-12">
                  {/* Sliders */}
                  <div className="lg:col-span-7 space-y-8">
                    <div className="grid md:grid-cols-2 gap-x-12 gap-y-10">
                      {Object.entries(report.variable_mapping).map(([key, val]) => (
                        <div key={key} className="space-y-4">
                          <div className="flex justify-between items-end">
                            <div className="space-y-1">
                              <span className="text-xs font-bold uppercase tracking-widest">{key}</span>
                              <p className="text-[10px] opacity-40 leading-tight max-w-[200px]">{val.justification.split('.')[0]}.</p>
                            </div>
                            <span className="text-sm font-mono font-bold">{(simValues[key] || 0).toFixed(2)}</span>
                          </div>
                          <input 
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={simValues[key] || 0}
                            onChange={(e) => setSimValues({ ...simValues, [key]: parseFloat(e.target.value) })}
                            className="w-full h-1 bg-black/5 rounded-lg appearance-none cursor-pointer accent-[#5A5A40]"
                          />
                          <div className="flex flex-wrap gap-1">
                            {val.evidence_ids.map(id => (
                              <span key={id} className="text-[8px] font-bold px-1.5 py-0.5 bg-[#F5F5F0] border border-black/5 rounded uppercase opacity-40">Ev-{id}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Outcome Display */}
                  <div className="lg:col-span-5">
                    <div className="bg-white p-10 rounded-[3rem] border border-black/5 shadow-sm sticky top-24 space-y-8">
                      <div className="text-center space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">Unified Coordination Capacity</span>
                        <div className={cn("text-8xl font-serif italic transition-colors duration-500", getPsiColor(psi))}>
                          Ψ {psi.toFixed(3)}
                        </div>
                        <p className="text-sm font-medium opacity-60">{getPsiStatus(psi)}</p>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-black/5">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40">Simulation Insight</h4>
                        <p className="text-sm leading-relaxed opacity-70 italic">
                          {psi > 0.7 
                            ? "Current parameters suggest high resilience. Focus on maintaining institutional transparency (IFA) to prevent algorithmic lock-in."
                            : psi > 0.4 
                            ? "Coordination is fragile. A slight decrease in trust (SRC) or clarity (DRC) could trigger a cascade failure signature."
                            : "Systemic breakdown is likely. Urgent intervention in Layer 2 (Institutional Design) is required to provide scaffolding for individual actors."}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40">Recommendations</h4>
                        {report.recommendations.map((rec, i) => (
                          <div key={i} className="flex gap-3 items-start">
                            <CheckCircle2 className="w-4 h-4 text-[#5A5A40] shrink-0 mt-0.5" />
                            <p className="text-xs font-medium opacity-80">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Historical Evidence Timeline */}
              <div className="space-y-12">
                <div className="flex items-center gap-4">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] opacity-40">Historical Evidence</h3>
                  <div className="flex-1 h-px bg-black/5" />
                </div>
                <div className="grid md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    {report.historical_timeline.map((item, i) => (
                      <div key={item.id} id={`ev-${item.id}`} className="group relative pl-12 pb-8 border-l border-black/10 last:border-0">
                        <div className="absolute left-[-9px] top-0 w-4 h-4 bg-white border-2 border-[#5A5A40] rounded-full group-hover:scale-125 transition-transform" />
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-black text-white rounded uppercase tracking-tighter">Ev-{item.id}</span>
                            <span className="text-xs font-bold tracking-widest opacity-40">{item.date}</span>
                          </div>
                          <p className="text-lg font-light leading-snug group-hover:opacity-100 opacity-70 transition-opacity">{item.event}</p>
                          <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#5A5A40] hover:underline">
                            <LinkIcon className="w-3 h-3" />
                            Verify Source
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-[#1A1A1A] text-white p-12 rounded-[3rem] h-fit sticky top-24 space-y-6">
                    <History className="w-8 h-8 opacity-20" />
                    <h3 className="text-2xl font-serif italic">Evidence Synthesis</h3>
                    <p className="text-lg font-light opacity-60 leading-relaxed">
                      Evidentia has converted these historical events into quantitative variables by analyzing the 
                      <span className="text-white opacity-100 font-medium"> cognitive load (CCI)</span>, 
                      <span className="text-white opacity-100 font-medium"> institutional friction (DRC)</span>, and 
                      <span className="text-white opacity-100 font-medium"> social capital (SRC)</span> 
                      manifested in each recorded interaction.
                    </p>
                    <div className="pt-6 border-t border-white/10">
                      <div className="text-sm font-light opacity-80 leading-relaxed">
                        <ReactMarkdown>{report.conclusion}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>


      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 py-12 border-t border-black/10 mt-24">
        <div className="grid md:grid-cols-4 gap-12">
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#1A1A1A] rounded-full flex items-center justify-center">
                <Sparkles className="text-white w-3 h-3" />
              </div>
              <span className="font-serif italic text-lg tracking-tight">Evidentia</span>
            </div>
            <p className="text-sm opacity-40 max-w-sm">
              Powered by the Comprehensive Integrated Predictive Framework (CIPF). 
              A domain-general coordination prediction science validated across the full spectrum of human collective action problems.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40">Framework</h4>
            <ul className="text-xs space-y-2 font-medium opacity-60">
              <li>Layer 1: Individual Substrate</li>
              <li>Layer 2: Coordination Architecture</li>
              <li>Layer 3: System Dynamics</li>
              <li>Failure Signatures (Δ)</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40">Legal</h4>
            <ul className="text-xs space-y-2 font-medium opacity-60">
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
              <li>Research Ethics</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-12 border-t border-black/5 flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.3em] opacity-20">
          <span>© 2026 Evidentia Insight Engine</span>
          <span>Version 4.0 Ecological Validation</span>
        </div>
      </footer>
    </div>
  );
}
