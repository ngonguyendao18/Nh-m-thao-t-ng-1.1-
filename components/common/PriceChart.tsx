
import React, { useEffect, useRef, memo, useState } from 'react';
import { Chart, registerables, ChartConfiguration } from 'chart.js';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import 'chartjs-adapter-date-fns';
import annotationPlugin from 'chartjs-plugin-annotation';

import { HistoricalData, ChartAnnotation } from '../../types';

// Đăng ký các thành phần cần thiết cho Chart.js
Chart.register(...registerables, CandlestickController, CandlestickElement, annotationPlugin);

interface PriceChartProps {
  data: HistoricalData[];
  annotations: ChartAnnotation[];
  symbol: string;
}

/**
 * Tính toán dữ liệu Selasor (Power & Flow) dựa trên OHLCV
 */
const calculateSelasorData = (data: HistoricalData[]) => {
  if (data.length === 0) return { power: [], flow: [] };

  const power = data.map((d) => {
    // Logic Selasor Power: Kết hợp biến động giá và khối lượng (Scale 0-100)
    const range = d.high - d.low || 1;
    const momentum = Math.abs(d.close - d.open) / range;
    const volScore = Math.min(1, d.volume / 5000000); // Giả định volume trung bình
    const value = Math.min(100, (momentum * 50) + (volScore * 50));
    return { x: d.time * 1000, y: value };
  });

  const flow = data.map((d) => {
    // Logic Selasor Flow: Hướng đi của dòng tiền (Scale -100 to 100)
    const diff = d.close - d.open;
    const range = d.high - d.low || 1;
    const value = (diff / range) * 100;
    return { x: d.time * 1000, y: value };
  });

  return { power, flow };
};

const PriceChart: React.FC<PriceChartProps> = ({ data, annotations, symbol }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<Chart | null>(null);
    const [chartHeight, setChartHeight] = useState('850px');

    // Quản lý chiều cao biểu đồ theo thiết bị
    useEffect(() => {
        const updateHeight = () => {
            const h = window.innerWidth < 768 ? '700px' : '1050px';
            setChartHeight(h);
        };
        updateHeight();
        window.addEventListener('resize', updateHeight);
        return () => window.removeEventListener('resize', updateHeight);
    }, []);

    // Khởi tạo Chart instance duy nhất
    useEffect(() => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        if (chartRef.current) {
            chartRef.current.destroy();
            chartRef.current = null;
        }
        
        const config: ChartConfiguration = {
            type: 'candlestick' as any,
            data: { datasets: [] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                layout: {
                  padding: { right: 85, bottom: 30, top: 20 }
                },
                scales: {
                    x: { 
                      type: 'time', 
                      time: { unit: 'day', displayFormats: { day: 'MMM yyyy' } }, 
                      grid: { color: 'rgba(255, 255, 255, 0.03)', drawOnChartArea: true }, 
                      ticks: { color: '#4b5563', font: { size: 10 } } 
                    },
                    y: { 
                      type: 'linear',
                      position: 'right',
                      grid: { color: 'rgba(255, 255, 255, 0.05)' }, 
                      ticks: { color: '#9ca3af', font: { size: 10 } },
                      stack: 'p1',
                      stackWeight: 10, // Pane 1 chiếm không gian lớn nhất
                    },
                    yPower: {
                      type: 'linear',
                      position: 'right',
                      min: 0,
                      max: 105,
                      grid: { 
                        color: 'rgba(255, 255, 255, 0.08)', 
                        borderDash: [2, 2],
                        drawTicks: false
                      },
                      ticks: { display: false },
                      stack: 'p1',
                      stackWeight: 3.5, // Pane 2 (Power)
                      offset: true,
                      border: { display: false }
                    },
                    yFlow: {
                      type: 'linear',
                      position: 'right',
                      min: -110,
                      max: 110,
                      grid: { 
                        color: 'rgba(255, 255, 255, 0.08)', 
                        borderDash: [2, 2],
                        drawTicks: false
                      },
                      ticks: { display: false },
                      stack: 'p1',
                      stackWeight: 3.5, // Pane 3 (Flow)
                      offset: true,
                      border: { display: false }
                    }
                },
                plugins: { 
                  legend: { display: false }, 
                  tooltip: { enabled: true, intersect: false, mode: 'index' }, 
                  annotation: { annotations: {} } 
                },
            },
        };

        chartRef.current = new Chart(ctx, config);

        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
                chartRef.current = null;
            }
        };
    }, []);

    // Cập nhật dữ liệu và chú thích
    useEffect(() => {
        const chart = chartRef.current;
        if (!chart || !data || data.length === 0) return;

        const { power, flow } = calculateSelasorData(data);
        const lastPower = power[power.length - 1]?.y || 0;
        const lastFlow = flow[flow.length - 1]?.y || 0;

        // Tạo Gradient cho Selasor Power (Vàng sang Đỏ)
        const ctx = chart.ctx;
        // Tính toán vị trí gradient dựa trên pane Power
        const gradient = ctx.createLinearGradient(0, 550, 0, 750);
        gradient.addColorStop(0, 'rgba(239, 68, 68, 0.8)'); // Đỏ
        gradient.addColorStop(0.6, 'rgba(245, 158, 11, 0.4)'); // Cam
        gradient.addColorStop(1, 'rgba(250, 204, 21, 0.1)'); // Vàng

        chart.data.datasets = [
            // Dataset 1: Nến giá
            { 
              type: 'candlestick' as any, 
              label: `${symbol}`, 
              data: data.map(d => ({ x: d.time * 1000, o: d.open, h: d.high, l: d.low, c: d.close })), 
              yAxisID: 'y', 
              color: { up: '#22c55e', down: '#ef4444' } 
            },
            // Dataset 2: Selasor Power (Pane 2)
            {
              type: 'line',
              label: 'Selasor Power',
              data: power,
              borderColor: '#facc15',
              borderWidth: 2,
              pointRadius: 0,
              yAxisID: 'yPower',
              fill: true,
              backgroundColor: gradient,
              tension: 0.15
            },
            // Dataset 3: Selasor Flow (Pane 3)
            {
              type: 'line',
              label: 'Selasor Flow',
              data: flow,
              borderColor: '#06b6d4',
              borderWidth: 2,
              pointRadius: 0,
              yAxisID: 'yFlow',
              fill: false,
              tension: 0.2
            }
        ];

        // Cập nhật Annotations
        const dynamicAnns: any = {};

        // Nhãn giá trị Power hiện tại
        dynamicAnns.powerLabel = {
            type: 'label',
            yScaleID: 'yPower',
            yValue: lastPower,
            xValue: power[power.length - 1].x,
            backgroundColor: lastPower > 70 ? '#ef4444' : '#f59e0b',
            borderRadius: 4,
            color: 'white',
            content: lastPower.toFixed(1),
            font: { size: 11, weight: 'bold' },
            position: 'right',
            xAdjust: 55
        };

        // Nhãn giá trị Flow hiện tại
        dynamicAnns.flowLabel = {
            type: 'label',
            yScaleID: 'yFlow',
            yValue: lastFlow,
            xValue: flow[flow.length - 1].x,
            backgroundColor: '#06b6d4',
            borderRadius: 4,
            color: 'white',
            content: lastFlow.toFixed(1),
            font: { size: 11, weight: 'bold' },
            position: 'right',
            xAdjust: 55
        };

        // Đường Zero cho Flow
        dynamicAnns.flowZero = {
            type: 'line',
            yScaleID: 'yFlow',
            yMin: 0,
            yMax: 0,
            borderColor: 'rgba(255,255,255,0.2)',
            borderWidth: 1,
            borderDash: [5, 5]
        };

        // Annotation từ Props (SMC Zones, User Markers)
        if (annotations) {
            annotations.forEach((ann, index) => {
                const id = `ann-${index}-${ann.label}`;
                if (ann.type === 'line' && ann.yValue) {
                    dynamicAnns[id] = { 
                        type: 'line', 
                        yMin: ann.yValue, 
                        yMax: ann.yValue, 
                        borderColor: ann.color, 
                        borderWidth: 1.5, 
                        borderDash: [4, 4], 
                        label: { 
                            content: ann.label, 
                            display: true, 
                            position: 'end', 
                            backgroundColor: 'rgba(0,0,0,0.8)', 
                            font: { size: 9, weight: 'bold' } 
                        } 
                    };
                } else if (ann.type === 'box' && ann.yMin && ann.yMax) {
                    dynamicAnns[id] = { 
                        type: 'box', 
                        yMin: ann.yMin, 
                        yMax: ann.yMax, 
                        backgroundColor: ann.color, 
                        borderColor: 'rgba(255,255,255,0.05)', 
                        borderWidth: 1, 
                        label: { 
                            content: ann.label, 
                            display: true, 
                            position: "start", 
                            font: { size: 9, weight: 'bold' } 
                        } 
                    };
                } else if (ann.type === 'verticalLine' && ann.xValue) {
                    dynamicAnns[id] = {
                        type: 'line',
                        xMin: ann.xValue,
                        xMax: ann.xValue,
                        borderColor: ann.color || '#06b6d4',
                        borderWidth: 2,
                        borderDash: [6, 6],
                        label: {
                            content: ann.label,
                            display: true,
                            position: 'start',
                            backgroundColor: 'rgba(6, 182, 212, 0.9)',
                            color: 'white',
                            font: { size: 10, weight: 'bold' },
                            padding: 4
                        }
                    };
                }
            });
        }

        if (chart.options.plugins?.annotation) {
            chart.options.plugins.annotation.annotations = dynamicAnns;
        }

        chart.update('none');
    }, [data, symbol, annotations]);

    return (
        <div className="relative bg-[#020617] border border-white/5 rounded-[4rem] p-4 shadow-3xl overflow-hidden" style={{ height: chartHeight }}>
             <canvas ref={canvasRef} />
             
             {/* Header Labels */}
             <div className="absolute top-8 left-10 flex flex-col gap-1 pointer-events-none">
               <div className="text-[14px] text-gray-400 font-black uppercase tracking-widest bg-black/40 px-3 py-1 rounded-lg border border-white/5">
                  {symbol.includes('XAU') ? 'Gold Spot / USD' : symbol.replace('USDT','')} • THỜI_GIAN_THỰC • BINANCE
               </div>
               <div className="flex items-center gap-4 mt-2">
                  <span className="text-3xl font-black text-white italic tracking-tighter uppercase">{symbol.replace('USDT','')}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-emerald-500 font-mono tracking-tighter">
                        {data[data.length-1]?.close.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-black text-emerald-500 uppercase bg-emerald-500/10 px-2 py-1 rounded">
                        LIVE_FEED
                    </span>
                  </div>
               </div>
             </div>

             {/* Pane Titles as Labels */}
             <div className="absolute bottom-[35%] left-10 pointer-events-none text-[11px] font-black text-amber-500 uppercase tracking-[0.4em] italic opacity-80">
                <span className="w-4 h-0.5 bg-amber-500 inline-block align-middle mr-2"></span>
                SELASOR_POWER_INDEX (0-100)
             </div>
             <div className="absolute bottom-[10%] left-10 pointer-events-none text-[11px] font-black text-cyan-400 uppercase tracking-[0.4em] italic opacity-80">
                <span className="w-4 h-0.5 bg-cyan-400 inline-block align-middle mr-2"></span>
                FLOW_MOMENTUM_DELTA (-100-100)
             </div>

             {/* Branding */}
             <div className="absolute bottom-10 left-10 opacity-30 pointer-events-none flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                    <span className="text-black font-black text-2xl tracking-tighter italic">17</span>
                </div>
                <span className="text-sm text-white font-black tracking-[0.4em] uppercase italic">WhaleSniper AI</span>
             </div>
        </div>
    );
};

export default memo(PriceChart);
