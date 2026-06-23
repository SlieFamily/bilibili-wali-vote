'use client';

import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import ReactECharts from 'echarts-for-react';

interface Player {
  item_id: string;
  vote: number;
  item: { title: string; pic: string; jump_url: string; };
}

// 👑 精调高辨识度色盘
const PREMIUM_COLORS = [
  '#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', 
  '#F43F5E', '#84CC16', '#6366F1', '#EA580C', '#14B8A6', '#D946EF', 
  '#EAB308', '#0EA5E9', '#F97316', '#22C55E', '#A855F7', '#EF4444', 
  '#0284C7', '#C026D3', '#65A30D', '#2563EB', '#BE123C', '#059669'
];

export default function Home() {
  const [apprenticeData, setApprenticeData] = useState<Player[]>([]);
  const [masterData, setMasterData] = useState<Player[]>([]);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  
  const historyRef = useRef<any[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('shituVoteHistory');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setHistoryData(parsed);
        historyRef.current = parsed;
      } catch (e) {
        console.error("历史数据解析失败", e);
      }
    }
  }, []);

  const fetchVotes = async () => {
    try {
      const [appRes, masRes] = await Promise.all([
        axios.get('/api/vote?group=apprentice'),
        axios.get('/api/vote?group=master')
      ]);

      const apprentices: Player[] = appRes.data?.data?.items || [];
      const masters: Player[] = masRes.data?.data?.items || [];

      apprentices.sort((a, b) => b.vote - a.vote);
      masters.sort((a, b) => b.vote - a.vote);

      setApprenticeData(apprentices);
      setMasterData(masters);

      const currentTime = new Date().toLocaleTimeString('zh-CN', { hour12: false });
      setLastUpdated(currentTime);

      const currentSnapshot: any = { time: currentTime };
      apprentices.forEach(p => { currentSnapshot[`徒弟_${p.item.title}`] = p.vote; });
      masters.forEach(p => { currentSnapshot[`师父_${p.item.title}`] = p.vote; });

      const newHistory = [...historyRef.current, currentSnapshot].slice(-100);
      setHistoryData(newHistory);
      historyRef.current = newHistory;
      
      localStorage.setItem('shituVoteHistory', JSON.stringify(newHistory));
    } catch (error) {
      console.error("数据拉取失败:", error);
    }
  };

  useEffect(() => {
    fetchVotes();
    const interval = setInterval(fetchVotes, 10000);
    return () => clearInterval(interval);
  }, []);

  const masterKeys = masterData.map(p => `师父_${p.item.title}`);
  const apprenticeKeys = apprenticeData.map(p => `徒弟_${p.item.title}`);

  // ========== 🚀 ECharts 核心配置函数 ==========
  const getEChartsOption = (keys: string[], groupPrefix: string, history: any[]) => {
    return {
      color: PREMIUM_COLORS, 
      tooltip: {
        trigger: 'item', 
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: [10, 14],
        textStyle: { color: '#1F2937' },
        extraCssText: 'box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border-radius: 8px;',
        formatter: (params: any) => {
          return `
            <div style="font-size: 11px; color: #6B7280; margin-bottom: 4px; border-bottom: 1px solid #F3F4F6; padding-bottom: 4px;">
              ⏰ ${params.name}
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${params.color}; box-shadow: 0 0 6px ${params.color}80;"></span>
              <span style="font-weight: 900; color: #111827; font-size: 13px;">${params.seriesName}</span>
              <span style="font-family: monospace; font-weight: 900; font-size: 15px; color: ${params.color}; margin-left: 6px;">
                ${params.value.toLocaleString()} 票
              </span>
            </div>
          `;
        }
      },
      legend: {
        type: 'scroll',
        top: 0,
        data: keys.map(k => k.replace(groupPrefix, '')),
        icon: 'circle',
        itemGap: 12,
        textStyle: { fontSize: 11, color: '#4B5563', fontWeight: 500 },
      },
      grid: { top: 35, left: 10, right: 20, bottom: 35, containLabel: true },
      dataZoom: [
        {
          type: 'inside',
          yAxisIndex: 0,
          start: 0, end: 100
        },
        { 
          type: 'slider', 
          show: true, 
          bottom: 0, 
          height: 14,
          borderColor: 'transparent', 
          backgroundColor: '#F8FAFC',
          fillerColor: 'rgba(59, 130, 246, 0.15)',
          handleStyle: { color: '#3B82F6', borderWidth: 0 }
        }
      ],
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: history.map(d => d.time),
        axisLine: { show: false }, 
        axisTick: { show: false },
        axisLabel: { color: '#9CA3AF', fontSize: 10, margin: 10 }
      },
      yAxis: {
        type: 'value',
        scale: true, 
        splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } }, 
        axisLabel: { color: '#9CA3AF', fontSize: 10, fontFamily: 'monospace' }
      },
      series: keys.map((key) => ({
        name: key.replace(groupPrefix, ''),
        type: 'line',
        smooth: 0.3, 
        
        // 📌 核心修改：展示数据圆点，并增加白色描边提升质感
        showSymbol: true, 
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: { 
          borderColor: '#ffffff', // 圆点白色描边
          borderWidth: 1.5 
        },
        lineStyle: { width: 3 }, 
        
        emphasis: {
          focus: 'series',
          lineStyle: { width: 5, shadowColor: 'rgba(0,0,0,0.2)', shadowBlur: 8 },
          // 悬浮时，圆点瞬间放大，交互反馈更强
          itemStyle: { symbolSize: 10, borderWidth: 2 } 
        },
        data: history.map(d => d[key] || null),
      }))
    };
  };

  // ========== 🚀 极致紧凑版列表渲染 ==========
  const renderCompactList = (data: Player[], cutoffRank: number, title: string, themeColor: string) => {
    const cutoffVote = data[cutoffRank - 1]?.vote || 0;

    return (
      <div className="flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full">
        <div className={`text-center py-1.5 text-white font-black text-sm tracking-widest ${themeColor}`}>
          {title} <span className='font-medium text-[10px] opacity-90'>(前 {cutoffRank} 晋级)</span>
        </div>
        
        {/* 表头 */}
        <div className="flex text-[11px] text-gray-500 bg-gray-50 py-1 px-2 border-b font-semibold sticky top-0 z-10">
          <span className="w-5 text-center"> </span>
          <span className="w-6"></span>
          <span className="flex-1 ml-1.5">选手</span>
          <span className="w-16 text-right font-bold">实时票数</span>
          <span className="w-16 text-right font-bold">距线差值</span>
        </div>

        {/* 列表主体：压缩 Padding，缩小字号 */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          {data.map((player, index) => {
            const rank = index + 1;
            const isPromoted = rank <= cutoffRank;
            const picUrl = player.item.pic.startsWith('//') ? `https:${player.item.pic}` : player.item.pic;
            
            const voteDiff = player.vote - cutoffVote;
            let gapElement;
            if (rank < cutoffRank) {
              gapElement = <span className="text-green-500 font-bold">+{voteDiff.toLocaleString()}</span>;
            } else if (rank === cutoffRank) {
              gapElement = <span className="text-purple-600 font-black text-[11px]">守门员</span>;
            } else {
              gapElement = <span className="text-red-500 font-bold">{voteDiff.toLocaleString()}</span>;
            }

            let rankStyle = "text-gray-400 font-bold";
            if (rank === 1) rankStyle = "text-yellow-500 font-black text-[13px]";
            if (rank === 2) rankStyle = "text-slate-400 font-black text-[13px]";
            if (rank === 3) rankStyle = "text-amber-700 font-black text-[13px]";

            return (
              <React.Fragment key={player.item_id}>
                {rank === cutoffRank + 1 && (
                  <div className="border-t-[1.5px] border-red-300 border-dashed w-full relative"></div>
                )}
                {/* 极限压缩行高：py-1 (4px) */}
                <div className={`flex items-center text-xs py-1 px-2 border-b border-gray-50 hover:bg-gray-100 transition-colors ${!isPromoted ? 'opacity-60 bg-gray-50/50' : ''}`}>
                  <span className={`w-5 text-center ${rankStyle}`}>{rank}</span>
                  <img src={picUrl} referrerPolicy="no-referrer" alt="avatar" className="w-6 h-6 rounded object-cover border border-gray-200 ml-1.5" />
                  <a href={player.item.jump_url} target="_blank" rel="noreferrer" className="flex-1 ml-2 truncate font-bold text-gray-800 hover:text-blue-600">
                    {player.item.title}
                  </a>
                  <span className="w-16 text-right font-mono font-black text-[13px] text-gray-800 tracking-tighter">
                    {player.vote.toLocaleString()}
                  </span>
                  <span className="w-16 text-right font-mono text-[11px]">
                    {gapElement}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <main className="w-screen min-h-screen bg-[#F4F6F8] flex flex-col p-3 md:p-4 font-sans overflow-x-hidden" suppressHydrationWarning>
      
      {/* 顶部导航 */}
      <div className="flex-none flex justify-between items-center bg-white/95 px-4 py-2.5 rounded-xl shadow-sm border border-gray-200 mb-3 sticky top-2 z-50">
        <div className="flex items-baseline gap-2">
          <h1 className="text-xl font-black text-gray-900 tracking-tight">🏆 瓦哩师徒杯 S3</h1>
          <span className="text-xs text-gray-500 font-medium">全景数据大屏</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if(confirm('确定要清除本地历史趋势图记录吗？')) {
                localStorage.removeItem('shituVoteHistory');
                setHistoryData([]);
                historyRef.current = [];
              }
            }}
            className="text-[11px] text-gray-400 hover:text-red-500 font-medium transition-colors border px-2 py-1 rounded"
          >
            清空历史记录
          </button>
          <div className="relative flex items-center bg-gray-900 px-3 py-1 rounded-full shadow-md">
            <span className="animate-ping absolute h-1.5 w-1.5 rounded-full bg-green-400 opacity-75"></span>
            <span className="relative rounded-full h-1.5 w-1.5 bg-green-500 mr-2"></span>
            <span className="text-[10px] text-white font-bold tracking-widest">LIVE | {lastUpdated}</span>
          </div>
        </div>
      </div>

      {/* 核心数据区：上部两列列表 */}
      <div className="flex-none grid grid-cols-1 lg:grid-cols-2 gap-3 h-[70vh] min-h-[500px]">
        {renderCompactList(masterData, 11, "师父组排名大盘", "bg-gradient-to-r from-blue-600 to-blue-500")}
        {renderCompactList(apprenticeData, 13, "徒弟组排名大盘", "bg-gradient-to-r from-purple-600 to-purple-500")}
      </div>

      <div className='flex-none text-center pt-8 pb-2'>
        <h2 className='text-2xl font-black text-gray-900 tracking-tight'>📈 选手走势</h2>
        <p className='text-gray-500 mt-1 text-xs'>
          交互技巧：<strong className="text-blue-500">点击图例</strong>可过滤选手 / <strong className="text-blue-500">鼠标悬浮点</strong>可查看瞬间票数 / <strong className="text-blue-500">滚轮</strong>可缩放 y 轴
        </p>
      </div>

      {/* 底部折线图：双栏并排 */}
      <div className="flex-none grid grid-cols-1 lg:grid-cols-2 gap-3 mt-2">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col h-[450px]">
          <div className="text-base font-black text-blue-700 pb-2 flex justify-between items-center border-b border-gray-50">
            师父组 · 历史票数曲线
            <span className='font-mono text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded'>共 {masterKeys.length} 人</span>
          </div>
          <div className="flex-1 w-full mt-2">
            {masterKeys.length > 0 && historyData.length > 0 && (
              <ReactECharts 
                option={getEChartsOption(masterKeys, "师父_", historyData)} 
                style={{ height: '100%', width: '100%' }}
                notMerge={false}
                lazyUpdate={true}
              />
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col h-[450px]">
          <div className="text-base font-black text-purple-700 pb-2 flex justify-between items-center border-b border-gray-50">
            徒弟组 · 历史票数曲线
            <span className='font-mono text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded'>共 {apprenticeKeys.length} 人</span>
          </div>
          <div className="flex-1 w-full mt-2">
            {apprenticeKeys.length > 0 && historyData.length > 0 && (
              <ReactECharts 
                option={getEChartsOption(apprenticeKeys, "徒弟_", historyData)} 
                style={{ height: '100%', width: '100%' }}
                notMerge={false}
                lazyUpdate={true}
              />
            )}
          </div>
        </div>
      </div>

      {/* 页面尾部：作者信息 */}
      <footer className='flex-none text-center pt-10 pb-6'>
        <div className="w-16 h-1 bg-gray-200 mx-auto rounded-full mb-4"></div>
        <p className='text-xs text-gray-500 font-medium'>
          Made with <span className="text-red-500">❤️</span> by <span className="font-bold text-gray-700">Slie-wdy</span>
        </p>
        <p className='text-[10px] text-gray-400 mt-1'>
          瓦哩师徒杯 S3 实时数据监控看板 · 数据源自官方 API 仅供参考
        </p>
      </footer>

    </main>
  );
}