import { ChartAnnotation } from '../types';

/**
 * Parses markdown analysis text to extract structured data for chart annotations.
 * Looks for specific patterns like "Vùng Cung/Cầu" and "Thanh khoản".
 * @param analysisText The markdown text from the Gemini API.
 * @returns An array of ChartAnnotation objects.
 */
export const parseAnalysisForAnnotations = (analysisText: string): ChartAnnotation[] => {
    const annotations: ChartAnnotation[] = [];
    if (!analysisText) return annotations;

    const lines = analysisText.split('\n');

    // Regex to capture zones like "Vùng Cung H4: 123.45 - 120.00" or "BSL: 123.45"
    const zoneRegex = /(Vùng Cung|Vùng Cầu|Supply|Demand)[\s\w]*:\s*([\d,]+\.?[\d]*)\s*-\s*([\d,]+\.?[\d]*)/gi;
    const liquidityRegex = /(BSL|SSL|Thanh khoản\s(bên\s)?mua|Thanh khoản\s(bên\s)?bán)[\s\w]*:\s*([\d,]+\.?[\d]*)/gi;

    for (const line of lines) {
        let match;

        // Match Supply/Demand Zones
        while ((match = zoneRegex.exec(line)) !== null) {
            const type = match[1].toLowerCase();
            const val1 = parseFloat(match[2].replace(/,/g, ''));
            const val2 = parseFloat(match[3].replace(/,/g, ''));
            
            if (!isNaN(val1) && !isNaN(val2)) {
                annotations.push({
                    label: match[1],
                    type: 'box',
                    color: type.includes('cung') || type.includes('supply') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)', // red for supply, green for demand
                    yMin: Math.min(val1, val2),
                    yMax: Math.max(val1, val2),
                });
            }
        }

        // Match Liquidity Levels
        while ((match = liquidityRegex.exec(line)) !== null) {
            const type = match[1].toLowerCase();
            const yValue = parseFloat(match[2].replace(/,/g, ''));

            if (!isNaN(yValue)) {
                annotations.push({
                    label: match[1],
                    type: 'line',
                    color: type.includes('bsl') || type.includes('mua') ? '#34d399' : '#f87171', // green for BSL, red for SSL
                    yValue: yValue,
                });
            }
        }
    }

    return annotations;
};
