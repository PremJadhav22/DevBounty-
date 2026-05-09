import { motion, AnimatePresence } from 'framer-motion';
import { FolderGit, ExternalLink, CheckCircle } from 'lucide-react';

export default function HistoryTable({ history }) {
  return (
    <div className="glass rounded-xl overflow-hidden shadow-2xl">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-900/50 border-b border-slate-700">
            <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Repository</th>
            <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Issue</th>
            <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
            <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Link</th>
          </tr>
        </thead>
        <tbody className="text-sm divide-y divide-slate-700/50">
          <AnimatePresence>
            {history.map((item, index) => (
              <motion.tr 
                key={index}
                initial={{ opacity: 0, y: -20, backgroundColor: 'rgba(52, 211, 153, 0.2)' }}
                animate={{ opacity: 1, y: 0, backgroundColor: 'transparent' }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="hover:bg-white/5 transition-colors group"
              >
                <td className="p-4 font-medium text-slate-200 flex items-center">
                  <FolderGit size={16} className="text-slate-400 mr-2 group-hover:text-white transition-colors" />
                  {item.repo || 'unknown/repo'}
                </td>
                <td className="p-4 text-slate-400 group-hover:text-slate-300 transition-colors">
                  {item.issue_title}
                </td>
                <td className="p-4">
                  <span className="px-2 py-1 flex items-center w-max bg-emerald-500/10 text-emerald-400 rounded text-xs font-bold border border-emerald-500/20">
                    <CheckCircle size={12} className="mr-1" />
                    Merged
                  </span>
                </td>
                <td className="p-4">
                  <a href={item.pr_url} target="_blank" rel="noreferrer" className="text-cyan-400 hover:text-emerald-400 transition-colors">
                    <ExternalLink size={16} />
                  </a>
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
          {history.length === 0 && (
            <tr>
              <td colSpan="4" className="p-8 text-center text-slate-500 italic">
                No bugs squashed yet. Deploy the agent to begin.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
