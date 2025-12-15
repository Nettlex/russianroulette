"use client";
import { motion } from 'framer-motion';

interface StatsCardProps {
  label: string;
  value: number | string;
  icon?: string;
  color?: 'default' | 'green' | 'red' | 'yellow';
}

export default function StatsCard({ label, value, icon, color = 'default' }: StatsCardProps) {
  const colorClasses = {
    default: 'border-gray-900 bg-black/50 backdrop-blur-sm',
    green: 'border-green-900 bg-green-950/30 backdrop-blur-sm',
    red: 'border-red-900 bg-red-950/30 backdrop-blur-sm',
    yellow: 'border-yellow-900 bg-yellow-950/30 backdrop-blur-sm',
  };

  const valueColorClasses = {
    default: 'text-white',
    green: 'text-green-400',
    red: 'text-red-400',
    yellow: 'text-yellow-400',
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`p-4 rounded-xl text-center border-2 ${colorClasses[color]} shadow-lg`}
    >
      <div className="flex items-center justify-center gap-1 mb-1">
        {icon && <span className="text-sm">{icon}</span>}
        <p className="text-gray-400 text-sm">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${valueColorClasses[color]}`}>{value}</p>
    </motion.div>
  );
}


