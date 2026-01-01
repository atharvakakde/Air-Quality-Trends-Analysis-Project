import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GlassPanel from '../common/GlassPanel'
import DarkInputField from '../common/DarkInputField'
import AuroraButton from '../common/AuroraButton'
import GlowyKpi from '../common/GlowyKpi'
import { ForecastCombinedChart, ForecastIndividualCharts } from '../charts/ForecastChart'
import { fmtPM } from '../../utils/formatters'
import ValidationModal from '../common/ValidationModal'

export default function ForecastTab({
                                      fcInput, setFcInput,
                                      horizon, setHorizon,
                                      trainDays, setTrainDays,
                                      doForecast, fcLoading, fcRes,
                                      forecastChartData, forecastCities,
                                      showCI, setShowCI,
                                      fcCombined, setFcCombined,
                                      userPlan
                                    }) {
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [validationData, setValidationData] = useState({})

  const getMaxDays = (plan, field) => {
    const limits = {
      free: {
        'Forecast Horizon (days)': 7,
        'Training Window (days)': 7
      },
      pro: {
        'Forecast Horizon (days)': 7,
        'Training Window (days)': 30
      },
      enterprise: {
        'Forecast Horizon (days)': 30,
        'Training Window (days)': 90
      }
    }
    return limits[plan?.toLowerCase()]?.[field] || limits.free[field] || 7
  }

  const handleHorizonChange = (value) => {
    const maxAllowed = getMaxDays(userPlan, 'Forecast Horizon (days)')
    const newValue = +value

    if (newValue > maxAllowed) {
      setValidationData({
        currentValue: newValue,
        maxValue: maxAllowed,
        plan: userPlan,
        fieldName: 'Forecast Horizon (days)'
      })
      setShowValidationModal(true)
      return
    }

    setHorizon(newValue)
  }

  const handleTrainDaysChange = (value) => {
    const maxAllowed = getMaxDays(userPlan, 'Training Window (days)')
    const newValue = +value

    if (newValue > maxAllowed) {
      setValidationData({
        currentValue: newValue,
        maxValue: maxAllowed,
        plan: userPlan,
        fieldName: 'Training Window (days)'
      })
      setShowValidationModal(true)
      return
    }

    setTrainDays(newValue)
  }
  const [reportLoading, setReportLoading] = useState(false)
  const navigate = useNavigate()

  return (
      <GlassPanel
          title="AI-Powered Forecasting"
          index={2}
          right={
            <div className="flex items-center gap-2 text-sm">
              <label className="flex items-center gap-2 text-gray-400 bg-gray-800/50 px-3 py-2 rounded-lg">
                <input
                    type="checkbox"
                    checked={showCI}
                    onChange={(e) => setShowCI(e.target.checked)}
                    className="w-4 h-4 text-cyan-500 rounded focus:ring-cyan-500 bg-gray-700 border-gray-600"
                />
                Show Confidence Intervals
              </label>
              <label className="flex items-center gap-2 text-gray-400 bg-gray-800/50 px-3 py-2 rounded-lg">
                <input
                    type="checkbox"
                    checked={fcCombined}
                    onChange={(e) => setFcCombined(e.target.checked)}
                    className="w-4 h-4 text-cyan-500 rounded focus:ring-cyan-500 bg-gray-700 border-gray-600"
                />
                Show Combined Chart
              </label>
            </div>
          }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-4">
            <DarkInputField
                label="Cities to Forecast"
                value={fcInput}
                onChange={(e) => setFcInput(e.target.value)}
                className="flex-1 min-w-[300px]"
                placeholder="Colombo,Kandy,Galle"
            />
            <DarkInputField
                label="Forecast Horizon (days)"
                type="number"
                value={horizon}
                onChange={(e) => handleHorizonChange(e.target.value)}
                className="w-40"
            />
            <DarkInputField
                label="Training Window (days)"
                type="number"
                value={trainDays}
                onChange={(e) => handleTrainDaysChange(e.target.value)}
                className="w-44"
            />
            <AuroraButton
                onClick={doForecast}
                disabled={fcLoading}
                loading={fcLoading}
                variant="success"
            >
              Generate Forecast
            </AuroraButton>
          </div>

          {fcRes?.summary && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                {Object.entries(fcRes.summary).map(([c, s]) => (
                    <GlowyKpi
                        key={c}
                        label={c}
                        value={s.mean_yhat != null ? fmtPM(s.mean_yhat) : '-'}
                        sub={`Forecast points: ${s.n_points}`}
                    />
                ))}
              </div>
          )}

          {/* Add this debug code right before rendering the charts */}
          {fcRes?.summary && (
            <>
              {/* Debug logs removed for production */}
            </>
          )}

          {fcCombined && (
            <div id="forecast-combined-chart">
              <ForecastCombinedChart forecastChartData={forecastChartData} forecastCities={forecastCities} showCI={showCI} />
            </div>
          )}
          <div id="forecast-individual-charts">
            <ForecastIndividualCharts byCity={fcRes?.byCity} showCI={showCI} />
          </div>

          {fcRes?.best && (
              <div className="flex gap-6 text-sm font-medium mt-4">
                <span className="text-emerald-400">📈 Best Forecast: <strong>{fcRes.best}</strong></span>
                <span className="text-amber-400">📉 Challenging: <strong>{fcRes.worst}</strong></span>
              </div>
          )}

          {fcRes?.summary && (
              <div className="flex justify-end mt-4">
                <AuroraButton
                    onClick={() => {
                      const cities = fcInput.split(",").map(s => s.trim()).filter(Boolean);
                      if (!Array.isArray(cities) || cities.length === 0) {
                        alert("No cities to include in the report. Please run a forecast first.");
                        return;
                      }

                      // Prepare chart data for the report page
                      const chartData = {
                        individual: fcRes?.byCity || {},
                        combined: fcCombined && forecastChartData ? forecastChartData : null
                      };

                      // Navigate to the print report page with forecast data
                      navigate('/print-forecast-report', {
                        state: {
                          forecastData: fcRes,
                          chartData: chartData,
                          cities: cities,
                          horizonDays: horizon,
                          trainDays: trainDays,
                          showCI: showCI,
                          showCombined: fcCombined,
                          selectedModel: 'sarimax' // Default model, could be made dynamic
                        }
                      });
                    }}
                    variant="success"
                >
                  📄 Download PDF Report
                </AuroraButton>
              </div>
          )}
          {fcRes?.error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl">
                <div className="text-sm text-red-400">{fcRes.error}</div>
              </div>
          )}
        </div>

        <ValidationModal
          isOpen={showValidationModal}
          onClose={() => setShowValidationModal(false)}
          title="Plan Limit Exceeded"
          message={`You've entered ${validationData.currentValue} days, but your ${validationData.plan?.toLowerCase() || 'free'} plan only allows up to ${validationData.maxValue} days for ${validationData.fieldName?.toLowerCase()}. Please reduce the number of days or upgrade your plan for higher limits.`}
          currentValue={validationData.currentValue}
          maxValue={validationData.maxValue}
          plan={validationData.plan}
          fieldName={validationData.fieldName}
        />
      </GlassPanel>
  )
}