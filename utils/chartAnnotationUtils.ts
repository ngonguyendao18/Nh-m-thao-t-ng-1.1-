
import { ChartAnnotation, SMCReport } from '../types';

/**
 * Parses an SMC report to create annotations for the price chart.
 * Extracts key levels from trade plans, key zones, and Fair Value Gaps (FVGs).
 */
export const createAnnotationsFromReport = (report: SMCReport | null): ChartAnnotation[] => {
    const annotations: ChartAnnotation[] = [];
    if (!report) return annotations;

    const { signal, detailedAnalysis } = report;

    // 1. Trade Plan Levels
    if (signal.primaryPlan) {
        const plan = signal.primaryPlan;
        
        // Retail Entry (Inducement)
        // Correcting property access for trade plan levels: entryPrice -> retailBaitPrice
        if (plan.retailBaitPrice) {
            annotations.push({
                label: `Dụ dỗ (${plan.direction})`,
                type: 'line',
                color: '#f97316',
                yValue: parseFloat(plan.retailBaitPrice),
            });
        }

        // Smart Entry (Whale)
        // Correcting property access for smart entry: postHuntEntry -> whaleLimitEntry
        if (plan.whaleLimitEntry) {
            annotations.push({
                label: `Whale (${plan.direction})`,
                type: 'line',
                color: '#38bdf8',
                yValue: parseFloat(plan.whaleLimitEntry),
            });
        }

        // Fix: Ensure we iterate through the takeProfitTargets array as defined in TradePlan interface
        if (plan.takeProfitTargets && plan.takeProfitTargets.length > 0) {
            plan.takeProfitTargets.forEach((target, index) => {
                annotations.push({
                    label: `TP${index + 1}: ${target.price}`,
                    type: 'line',
                    color: '#34d399',
                    yValue: parseFloat(target.price),
                });
            });
        }

        if (plan.stopLossPrice) {
            annotations.push({
                label: 'Dừng lỗ (SL)',
                type: 'line',
                color: '#f87171',
                yValue: parseFloat(plan.stopLossPrice),
            });
        }
    }

    // 2. Supply/Demand Zones
    // Fix: keyZones does not exist in DetailedAnalysis, using marketStructure to parse text analysis
    if (detailedAnalysis.marketStructure) {
        const zoneRegex = /(Vùng Cung|Vùng Cầu|Supply|Demand)[\s\w]*:\s*([\d,]+\.?[\d]*)\s*-\s*([\d,]+\.?[\d]*)/gi;
        let match;
        while ((match = zoneRegex.exec(detailedAnalysis.marketStructure)) !== null) {
            const type = match[1].toLowerCase();
            const val1 = parseFloat(match[2].replace(/,/g, ''));
            const val2 = parseFloat(match[3].replace(/,/g, ''));
            
            if (!isNaN(val1) && !isNaN(val2)) {
                annotations.push({
                    label: match[1],
                    type: 'box',
                    // Đậm hơn: red-800 và green-800 với độ alpha cao hơn (0.4)
                    color: type.includes('cung') || type.includes('supply') ? 'rgba(153, 27, 27, 0.4)' : 'rgba(20, 83, 45, 0.4)',
                    yMin: Math.min(val1, val2),
                    yMax: Math.max(val1, val2),
                });
            }
        }
    }
    
    // 3. Fair Value Gaps (FVG) - Khoảng trống giá
    // Fix: imbalances does not exist in DetailedAnalysis, using marketStructure to parse text analysis
    if (detailedAnalysis.marketStructure) {
        // Regex to find FVG like: "FVG Tăng: 42100.5 - 42350.2"
        const fvgRegex = /(FVG|Khoảng trống giá|Khoảng trống)[\s\w]*:\s*([\d,]+\.?[\d]*)\s*-\s*([\d,]+\.?[\d]*)/gi;
        let match;
        while ((match = fvgRegex.exec(detailedAnalysis.marketStructure)) !== null) {
            const text = match[0].toLowerCase();
            const val1 = parseFloat(match[2].replace(/,/g, ''));
            const val2 = parseFloat(match[3].replace(/,/g, ''));
            
            if (!isNaN(val1) && !isNaN(val2)) {
                // Determine color based on type - cũng làm đậm hơn cho đồng bộ
                let color = 'rgba(245, 158, 11, 0.35)'; // Amber
                if (text.includes('tăng') || text.includes('bullish')) color = 'rgba(21, 128, 61, 0.35)'; // Darker Green
                if (text.includes('giảm') || text.includes('bearish')) color = 'rgba(185, 28, 28, 0.35)'; // Darker Red

                annotations.push({
                    label: 'FVG (Khoảng trống)',
                    type: 'box',
                    color: color,
                    yMin: Math.min(val1, val2),
                    yMax: Math.max(val1, val2),
                });
            }
        }
    }

    // 4. Liquidity Levels (BSL/SSL)
    // Fix: Using the structured liquidityPools array now available on DetailedAnalysis
    if (detailedAnalysis.liquidityPools && detailedAnalysis.liquidityPools.length > 0) {
        detailedAnalysis.liquidityPools.forEach(pool => {
            const yValue = parseFloat(pool.priceLevel.replace(/,/g, ''));
            if (!isNaN(yValue)) {
                annotations.push({
                    label: pool.type,
                    type: 'line',
                    color: pool.type === 'BSL' ? '#22d3ee' : '#fb7185',
                    yValue: yValue,
                });
            }
        });
    }

    return annotations;
};
