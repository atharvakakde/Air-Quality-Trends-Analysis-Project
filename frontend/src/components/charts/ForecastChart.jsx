import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts'

export function ForecastCombinedChart({ forecastChartData, forecastCities, showCI }) {
  if (!Array.isArray(forecastChartData) || forecastChartData.length === 0) return null
  
  const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444']
  return (
    <div className="h-[400px] w-full mt-6 bg-gray-900/50 rounded-2xl p-4 border border-gray-700/30">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={forecastChartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="ts" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickFormatter={(v) => `${v} µg/m³`} domain={[0, 'auto']} />
          <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '12px', color: '#F9FAFB' }} formatter={(value, name) => [`${value} µg/m³`, name]} />
          <Legend />
          {forecastCities.map((name, index) => (
            <Line key={name} type="monotone" dataKey={name} stroke={colors[index % colors.length]} strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
          ))}
          {showCI &&
            forecastCities.map((name, index) => (
              <Line key={`${name}-hi`} type="monotone" dataKey={`${name}_hi`} stroke={colors[index % colors.length]} strokeDasharray="4 3" opacity={0.7} dot={false} />
            ))}
          {showCI &&
            forecastCities.map((name, index) => (
              <Line key={`${name}-lo`} type="monotone" dataKey={`${name}_lo`} stroke={colors[index % colors.length]} strokeDasharray="4 3" opacity={0.4} dot={false} />
            ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ForecastIndividualCharts({ byCity, showCI }) {
  if (!byCity || typeof byCity !== 'object') return null
  
  const colorPalette = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444']
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {Object.entries(byCity).map(([cityName, series], idx) => {
        // Ensure series is an array and has valid data
        const chartData = Array.isArray(series) && series.length > 0
          ? series.map((p) => ({
              ...p,
              yhat: Number(p.yhat ?? p.y ?? 0),
              yhat_lower: Math.max(0, Number(p.yhat_lower ?? p.lower ?? p.yhat ?? 0)),
              yhat_upper: Math.max(0, Number(p.yhat_upper ?? p.upper ?? p.yhat ?? 0))
            }))
          : []
        
        // Don't render chart if no valid data
        if (chartData.length === 0) {
          return (
            <div key={cityName} className="h-[350px] w-full bg-gray-900/50 rounded-2xl p-4 border border-gray-700/30">
              <h4 className="text-white mb-4 font-medium">{cityName} Forecast</h4>
              <div className="flex items-center justify-center h-full text-gray-400">
                No forecast data available
              </div>
            </div>
          )
        }
        
        return (
          <div key={cityName} data-city={cityName} className="h-[350px] w-full bg-gray-900/50 rounded-2xl p-4 border border-gray-700/30">
            <h4 className="text-white mb-4 font-medium">{cityName} Forecast</h4>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="ts" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickFormatter={(v) => `${v} µg/m³`} domain={[0, 'auto']} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '12px', color: '#F9FAFB' }} formatter={(value, name) => [`${value} µg/m³`, name]} />
                {showCI && <Line type="monotone" dataKey="yhat_upper" stroke="#10B981" strokeDasharray="4 3" opacity={0.7} dot={false} />}
                {showCI && <Line type="monotone" dataKey="yhat_lower" stroke="#10B981" strokeDasharray="4 3" opacity={0.4} dot={false} />}
                <Line type="monotone" dataKey="yhat" stroke={colorPalette[idx % colorPalette.length]} strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )
      })}
    </div>
  )
}


