import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Zap, Code, ShieldCheck } from 'lucide-react';

export default function MissionModal({ report, onClose }) {
  if (!report) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-slate-800/50 p-6 flex justify-between items-center border-b border-slate-700/50">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center">
                <CheckCircle className="text-emerald-400 mr-3" />
                Mission Accomplished
              </h2>
              <p className="text-slate-400 mt-1">DevBounty Agent successfully squashed the bug.</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2 bg-slate-800 rounded-full hover:bg-slate-700">
              <X size={24} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Target</div>
                <div className="font-bold text-white truncate">{report.repo}</div>
              </div>
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 flex flex-col items-start">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1 flex items-center"><Zap size={12} className="mr-1 text-yellow-400"/> Time</div>
                <div className="font-bold text-white">{report.time_taken || 0}s</div>
              </div>
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1 flex items-center"><Code size={12} className="mr-1 text-cyan-400"/> Tokens</div>
                <div className="font-bold text-white">{report.tokens_used || '--'}</div>
              </div>
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1 flex items-center"><ShieldCheck size={12} className="mr-1 text-emerald-400"/> Cost</div>
                <div className="font-bold text-emerald-400">${(report.cost || 0).toFixed(4)}</div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Agent Analysis</h3>
              <div className="bg-slate-950 rounded-xl p-4 text-sm text-slate-300 font-mono border border-slate-800 shadow-inner">
                {report.analysis}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-2">Original Code</h3>
                <div className="bg-slate-950 rounded-xl p-4 text-xs font-mono text-red-300 overflow-x-auto border border-red-900/30 max-h-64 custom-scrollbar">
                  <pre>{report.original_code}</pre>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-2">Fixed Code</h3>
                <div className="bg-slate-950 rounded-xl p-4 text-xs font-mono text-emerald-300 overflow-x-auto border border-emerald-900/30 max-h-64 custom-scrollbar">
                  <pre>{report.fixed_code}</pre>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-800/50 p-6 border-t border-slate-700/50 flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-sm text-slate-400 mr-3">System Confidence:</span>
              <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${report.confidence || 0}%` }} 
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-emerald-400"
                ></motion.div>
              </div>
              <span className="text-sm font-bold text-emerald-400 ml-3">{report.confidence || 0}%</span>
            </div>
            <a 
              href={report.pr_url} 
              target="_blank" 
              rel="noreferrer"
              className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]"
            >
              View Live PR
            </a>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
