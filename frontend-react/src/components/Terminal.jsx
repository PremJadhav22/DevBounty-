import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal as TermIcon } from 'lucide-react';

export default function Terminal({ logs, isHunting }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="glass rounded-xl overflow-hidden shadow-2xl border border-slate-700/50 flex flex-col h-[400px]">
      <div className="bg-slate-900/80 px-4 py-3 flex items-center justify-between border-b border-slate-700/50">
        <div className="flex items-center space-x-2">
          <TermIcon size={16} className="text-slate-400" />
          <span className="text-sm font-medium text-slate-300 font-mono tracking-wider">devbounty_agent_sys.exe</span>
        </div>
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-slate-700"></div>
          <div className="w-3 h-3 rounded-full bg-slate-700"></div>
          <div className="w-3 h-3 rounded-full bg-slate-700"></div>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 p-5 font-mono text-sm overflow-y-auto bg-slate-950/50"
      >
        <AnimatePresence>
          {logs.length === 0 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-slate-500 italic">
              Awaiting deployment orders...
            </motion.p>
          )}
          {logs.map((log) => {
            let color = "text-slate-400";
            if (log.type === "action") color = "text-blue-400 font-medium";
            if (log.type === "success") color = "text-emerald-400 font-bold drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]";
            if (log.type === "error") color = "text-red-400 font-bold";
            if (log.type === "thought") color = "text-violet-400 font-medium italic";

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className={`mb-2 ${color} break-words`}
              >
                <span className="opacity-50 mr-2">{'>'}</span>
                {log.message}
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {isHunting && (
          <motion.div 
            animate={{ opacity: [1, 0, 1] }} 
            transition={{ repeat: Infinity, duration: 1 }}
            className="mt-2 w-2 h-4 bg-emerald-400 inline-block"
          />
        )}
      </div>
    </div>
  );
}
