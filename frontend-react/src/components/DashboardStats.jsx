import { motion } from 'framer-motion';
import { Target, Bug, GitPullRequest } from 'lucide-react';

export default function DashboardStats({ history }) {
  const bugCount = history.length;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-panel p-6 flex items-center justify-between group hover:border-emerald-500/50 transition-colors"
      >
        <div>
          <p className="text-sm font-medium text-slate-400 mb-1 uppercase tracking-wider">Bugs Squashed</p>
          <div className="text-4xl font-black text-white group-hover:text-emerald-400 transition-colors">
            {bugCount}
          </div>
        </div>
        <div className="p-4 bg-emerald-500/10 rounded-full text-emerald-400 group-hover:scale-110 transition-transform">
          <Bug size={32} />
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass-panel p-6 flex items-center justify-between group hover:border-cyan-500/50 transition-colors"
      >
        <div>
          <p className="text-sm font-medium text-slate-400 mb-1 uppercase tracking-wider">PRs Submitted</p>
          <div className="text-4xl font-black text-white group-hover:text-cyan-400 transition-colors">
            {bugCount}
          </div>
        </div>
        <div className="p-4 bg-cyan-500/10 rounded-full text-cyan-400 group-hover:scale-110 transition-transform">
          <GitPullRequest size={32} />
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="glass-panel p-6 flex flex-col justify-center"
      >
        <p className="text-sm font-medium text-slate-400 mb-2 uppercase tracking-wider flex items-center">
          <Target size={16} className="mr-2 text-violet-400" /> Current Target
        </p>
        <div className="text-sm font-bold text-slate-200 truncate">
          {history.length > 0 ? history[0].issue_title : "Waiting for deployment..."}
        </div>
      </motion.div>
    </div>
  );
}
