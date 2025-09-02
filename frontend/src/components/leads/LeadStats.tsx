interface LeadStatsProps {
  stats: {
    total: number;
    needsPhone: number;
    bySource: Record<string, number>;
  };
}

export default function LeadStats({ stats }: LeadStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="card p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">Total Leads</p>
        <p className="text-2xl font-bold">{stats.total}</p>
      </div>
      
      <div className="card p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">Need Phone</p>
        <p className="text-2xl font-bold text-yellow-600">{stats.needsPhone}</p>
      </div>
      
      <div className="card p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">Zillow</p>
        <p className="text-2xl font-bold">{stats.bySource.zillow || 0}</p>
      </div>
      
      <div className="card p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">Realtor</p>
        <p className="text-2xl font-bold">{stats.bySource.realtor || 0}</p>
      </div>
    </div>
  );
}