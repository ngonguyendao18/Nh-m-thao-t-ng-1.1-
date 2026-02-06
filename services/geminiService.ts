
import { GoogleGenAI, Type } from "@google/genai";
import { 
  CoinData, 
  HistoricalData, 
  TradeOpportunity, 
  SMCReport,
  AnalysisSnapshot,
  NewsCatalyst,
  BtcCorrelationReport,
  MarketConclusion,
  FullMarketReportData
} from "../types";

const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSMCReport = async (coin: CoinData, historicalData: HistoricalData[], history: AnalysisSnapshot[] = []): Promise<SMCReport> => {
  const ai = getClient();
  const currentPrice = parseFloat(coin.lastPrice);
  
  const priceContext = historicalData.slice(-60).map(d => ({
    o: d.open, h: d.high, l: d.low, c: d.close, v: d.volume
  }));

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `
      VAI TRÒ: CHUYÊN GIA GIẢI MÃ DÒNG TIỀN (SMART MONEY STRATEGIST).
      ĐỐI TƯỢNG: ${coin.symbol} | GIÁ HIỆN TẠI: ${currentPrice}.
      DỮ LIỆU NẾN (4H): ${JSON.stringify(priceContext)}.

      NHIỆM VỤ NGHIÊM NGẶT:
      1. GIẢI PHẪU THỊ TRƯỜNG: Xác định MM đang Tích lũy hay Phân phối dựa trên Volume và cấu trúc nến.
      2. CHỈ BÁO SELASOR (Sentiment-Latent-Orderflow): 
         - Tính toán điểm Selasor (0-100) dựa trên: Volume đột biến (30%), Biến động RSI (20%), Funding Rate (20%) và Phân kỳ giá (30%).
         - 0-30: CHARGING (Gom hàng lặng lẽ - Tăng vị thế Spot).
         - 31-70: STABLE (Xây dựng thanh khoản - Đặt Sniper tại các vùng Liquidity Sweep).
         - 71-90: IGNITION (Kích nổ - Whale đang quét mạnh, đi lệnh Aggressive theo xu hướng).
         - 91-100: EXHAUSTION (Cạn kiệt/Đảo chiều - Tuyệt đối không Fomo, chốt lời hoặc đánh ngược).
      3. CHI TIẾT HÀNH ĐỘNG: Phải đưa ra lệnh thực thi cực kỳ cụ thể (Vd: "Chờ giá quét qua đáy cũ rồi Long Sniper", "Xả hàng ngay khi chạm vùng Supply vì Selasor đang ở mức Exhaustion").
      4. THIẾT LẬP KỸ THUẬT: Cung cấp các mức giá Entry, TP, SL dựa trên SMC (Smart Money Concepts).
      
      YÊU CẦU NGÔN NGỮ: TIẾNG VIỆT 100%, PHONG CÁCH QUÂN ĐỘI/TỔ CHỨC, QUYẾT ĐOÁN.
    `,
    config: {
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          detailedAnalysis: {
            type: Type.OBJECT,
            properties: {
              marketStructure: { type: Type.STRING },
              manipulationPhase: { type: Type.STRING, enum: ['TÍCH LŨY', 'THAO TÚNG', 'PHÂN PHỐI', 'ĐÈ GIÁ (MARKDOWN)'] },
              marketRegime: { type: Type.STRING, enum: ['BULLISH', 'BEARISH', 'RANGING'] },
              trueTrend: { type: Type.STRING },
              fomoDefinition: { type: Type.STRING },
              trapZone: { type: Type.STRING },
              selasorScore: { type: Type.NUMBER },
              selasorStatus: { type: Type.STRING, enum: ['CHARGING', 'IGNITION', 'EXHAUSTION', 'STABLE'] },
              selasorAction: { type: Type.STRING, description: "Hành động chiến thuật cụ thể dựa trên chỉ số Selasor" },
              pivotReasoning: { type: Type.STRING },
              technicalIndicators: {
                type: Type.OBJECT,
                properties: {
                  rsiStatus: { type: Type.STRING },
                  volumeAnomalies: { type: Type.STRING },
                  fundingRateImplication: { type: Type.STRING }
                }
              },
              longTermOutlook: {
                type: Type.OBJECT,
                properties: { h4: { type: Type.STRING }, d1: { type: Type.STRING }, masterTrend: { type: Type.STRING }, w1: { type: Type.STRING } }
              },
              crowdSentiment: {
                type: Type.OBJECT,
                properties: { retailBias: { type: Type.STRING }, fomoLevel: { type: Type.NUMBER }, mmCounterMove: { type: Type.STRING } }
              },
              liquidityPools: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { priceLevel: { type: Type.STRING }, type: { type: Type.STRING } }
                }
              }
            }
          },
          masterThesis: {
            type: Type.OBJECT,
            properties: { optimizedThesis: { type: Type.STRING }, baitAnalysis: { type: Type.STRING }, howToEnter: { type: Type.STRING }, executionSafety: { type: Type.STRING } }
          },
          signal: {
            type: Type.OBJECT,
            properties: {
              winProbability: { type: Type.NUMBER },
              primaryPlan: {
                type: Type.OBJECT,
                properties: {
                  direction: { type: Type.STRING, enum: ['LONG', 'SHORT', 'NEUTRAL'] },
                  retailBaitPrice: { type: Type.STRING },
                  stopHuntLevel: { type: Type.STRING },
                  whaleLimitEntry: { type: Type.STRING },
                  estimatedProfitPercent: { type: Type.STRING },
                  winProbability: { type: Type.NUMBER },
                  takeProfitTargets: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: { price: { type: Type.STRING }, mmAction: { type: Type.STRING }, harvestVolume: { type: Type.STRING } }
                    }
                  },
                  stopLossPrice: { type: Type.STRING },
                  slLogic: { type: Type.STRING },
                  liquidationTarget: { type: Type.STRING },
                  estimatedLiquidationAmount: { type: Type.STRING }
                }
              },
              whaleWarning: { type: Type.STRING }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const findTopOpportunities = async (coins: CoinData[]): Promise<{ opportunities: TradeOpportunity[], conclusion: MarketConclusion }> => {
  const ai = getClient();
  const targetCoins = [...coins]
    .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
    .slice(0, 15)
    .map(c => ({
      s: c.symbol,
      p: c.lastPrice,
      ch: c.priceChangePercent,
      v: (parseFloat(c.quoteVolume) / 1000000).toFixed(2) + "M",
      f: c.lastFundingRate
    }));

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `QUÉT RADAR: ${JSON.stringify(targetCoins)}. Tìm 3 bẫy thanh khoản tốt nhất. Trả về JSON Tiếng Việt.`,
    config: {
      temperature: 0.15,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          opportunities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                symbol: { type: Type.STRING },
                direction: { type: Type.STRING, enum: ['LONG', 'SHORT'] },
                optimizedEntry: { type: Type.STRING },
                takeProfitPrice: { type: Type.STRING },
                stopLossPrice: { type: Type.STRING },
                trapLogic: { type: Type.STRING },
                huntTarget: { type: Type.STRING },
                winProbability: { type: Type.NUMBER },
                estProfit: { type: Type.STRING },
                whaleIntensity: { type: Type.NUMBER },
                whaleTactic: { type: Type.STRING }
              },
              required: ['symbol', 'direction', 'optimizedEntry', 'takeProfitPrice', 'stopLossPrice', 'trapLogic', 'huntTarget', 'winProbability', 'whaleIntensity', 'whaleTactic']
            }
          },
          conclusion: {
            type: Type.OBJECT,
            properties: {
              bias: { type: Type.STRING, enum: ['BULLISH', 'BEARISH', 'NEUTRAL'] },
              summary: { type: Type.STRING },
              directive: { type: Type.STRING },
              riskWarning: { type: Type.STRING }
            },
             required: ['bias', 'summary', 'directive', 'riskWarning']
          }
        },
        required: ['opportunities', 'conclusion']
      }
    }
  });
  
  try {
    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return {
      opportunities: parsed.opportunities || [],
      conclusion: parsed.conclusion || { bias: 'NEUTRAL', summary: 'Không có nhận định.', directive: 'Chờ đợi.', riskWarning: 'N/A' }
    };
  } catch (e) {
    throw new Error("Lỗi Radar: Không thể giải mã ý đồ MM.");
  }
};

export const generateNewsCatalystReport = async (): Promise<NewsCatalyst[]> => {
  const ai = getClient();
  const res = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: "Phân tích 5 sự kiện vĩ mô ảnh hưởng thanh khoản. Trả về JSON Tiếng Việt.",
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            evidence: { type: Type.STRING },
            whaleIntent: { type: Type.STRING },
            actionableBenefit: { type: Type.STRING },
            impactLevel: { type: Type.STRING, enum: ['CRITICAL', 'HIGH', 'MEDIUM'] },
            sentiment: { type: Type.STRING, enum: ['Positive', 'Negative', 'Neutral'] },
            source: { type: Type.STRING }
          }
        }
      }
    }
  });
  return JSON.parse(res.text || '[]');
};

export const analyzeBtcInfluence = async (btcCoin: CoinData, klines: HistoricalData[]): Promise<BtcCorrelationReport> => {
  const ai = getClient();
  const res = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Phân tích tương quan BTC. Dữ liệu: ${JSON.stringify(klines.slice(-24))}. Trả về JSON Tiếng Việt.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          analysis: { type: Type.STRING },
          marketPhase: { type: Type.STRING },
          dominanceLevel: { type: Type.STRING },
          correlationStrategy: { type: Type.STRING },
          conclusionBenefit: { type: Type.STRING },
          chartEvents: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { timestamp: { type: Type.NUMBER }, label: { type: Type.STRING }, type: { type: Type.STRING } } } }
        }
      }
    }
  });
  return JSON.parse(res.text || '{}');
};

export const fetchWhaleIntel = async (coins: CoinData[]): Promise<string> => {
  const ai = getClient();
  const res = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Tóm tắt nhanh ý đồ Nhà cái cho: ${JSON.stringify(coins.slice(0,5))}. Viết bằng Tiếng Việt súc tích.`,
  });
  return res.text || "Đang quét...";
};

export const analyzeWhaleIntent = async (prompt: string, imageBase64?: string, mimeType?: string, context?: string): Promise<string> => {
  const ai = getClient();
  const parts: any[] = [{ text: `PHÒNG GIẢI MÃ WHALE: ${prompt}. BỐI CẢNH: ${context}. TRẢ LỜI BẰNG TIẾNG VIỆT.` }];
  if (imageBase64 && mimeType) parts.push({ inlineData: { data: imageBase64, mimeType } });
  const res = await ai.models.generateContent({ model: "gemini-3-pro-preview", contents: { parts } });
  return res.text || "";
};

export const analyzeCrowdSentiment = async (coin: CoinData, historicalData: HistoricalData[]): Promise<any> => {
  const ai = getClient();
  const res = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Giải mã tâm lý đám đông cho ${coin.symbol}. Trả về JSON Tiếng Việt.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: { trapLevel: { type: Type.STRING }, longPercent: { type: Type.NUMBER }, shortPercent: { type: Type.NUMBER }, sentimentReasoning: { type: Type.STRING }, exchangeAction: { type: Type.STRING }, smartMoneyThesis: { type: Type.STRING } }
      }
    }
  });
  return JSON.parse(res.text || "{}");
};

export const getTradingAssistantChat = (systemInstruction: string) => {
  const ai = getClient();
  return ai.chats.create({ model: "gemini-3-flash-preview", config: { systemInstruction } });
};

export const evaluateBacktestPerformance = async (snapshot: AnalysisSnapshot, futureKlines: HistoricalData[]): Promise<string> => {
  const ai = getClient();
  const res = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `GIẢI PHẪU KẾT QUẢ: ${JSON.stringify(snapshot.analysis)}. GIÁ THỰC TẾ: ${JSON.stringify(futureKlines.slice(0, 50))}. TRẢ LỜI TIẾNG VIỆT.`,
    config: { temperature: 0.2 }
  });
  return res.text || "Lỗi thẩm định.";
};

export const analyzeMarketSentiment = async (coins: CoinData[]): Promise<string> => {
  const ai = getClient();
  const coinSummary = coins.slice(0, 10).map(c => `${c.symbol}: ${c.priceChangePercent}%`).join(', ');
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Phân tích tâm lý thị trường dựa trên dữ liệu các đồng coin sau: ${coinSummary}. Trả về bằng tiếng Việt dưới dạng Markdown. Tập trung vào hành vi của Smart Money.`,
  });
  return response.text || "Không thể thực hiện phân tích tâm lý lúc này.";
};

export const askFollowUpQuestion = async (context: string, question: string): Promise<string> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Dựa trên bối cảnh phân tích này: ${context}, hãy trả lời câu hỏi sau: ${question}. Trả lời bằng tiếng Việt, ngắn gọn, súc tích và tập trung vào kỹ thuật SMC.`,
  });
  return response.text || "Xin lỗi, tôi không thể trả lời câu hỏi này.";
};

export const generateFullMarketReportWithConclusion = async (): Promise<FullMarketReportData> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: 'Hãy tạo một báo cáo thị trường vĩ mô chi tiết (5 bài phân tích) và đưa ra một kết luận thị trường tổng quát (bias, summary, directive, riskWarning). Trả về kết quả hoàn toàn bằng JSON tiếng Việt.',
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          articles: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                summary: { type: Type.STRING },
                sentiment: { type: Type.STRING },
                sourceName: { type: Type.STRING }
              },
              required: ["title", "summary", "sentiment", "sourceName"]
            }
          },
          conclusion: {
            type: Type.OBJECT,
            properties: {
              bias: { type: Type.STRING, enum: ['BULLISH', 'BEARISH', 'NEUTRAL'] },
              summary: { type: Type.STRING },
              directive: { type: Type.STRING },
              riskWarning: { type: Type.STRING }
            },
            required: ["bias", "summary", "directive", "riskWarning"]
          }
        },
        required: ["articles", "conclusion"]
      }
    }
  });
  
  try {
    return JSON.parse(response.text || '{"articles": [], "conclusion": {"bias": "NEUTRAL", "summary": "N/A", "directive": "N/A", "riskWarning": "N/A"}}');
  } catch (e) {
    throw new Error("Lỗi giải mã dữ liệu báo cáo vĩ mô.");
  }
};
