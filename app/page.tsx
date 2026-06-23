'use client';

import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Player {
  item_id: string;
  vote: number;
  item: { title: string; pic: string; jump_url: string; };
}

// 动态生成足够多的、可区分的色值数组，不局限于蓝紫调
const generateColorPalette = (count: number) => {
  const palette = [];
  for (let i = 0; i < count; i++) {
    palette.push(`hsl(${(i * 360 / count) % 360}, 75%, 50%)`);
  }
  return palette;
};

// 分组色盘 (为师父组和徒弟组分别准备一个色盘，确保同组内不重复)
const MASTER_PALETTE = generateColorPalette(50); // 预留50个容量，确保绝对够用
const APPRENTICE_PALETTE = generateColorPalette(50);

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
      
      // 全员数据写入快照
      apprentices.forEach(p => {
        currentSnapshot[`徒弟_${p.item.title}`] = p.vote;
      });
      masters.forEach(p => {
        currentSnapshot[`师父_${p.item.title}`] = p.vote;
      });

      const newHistory = [...historyRef.current, currentSnapshot].slice(-60);
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

  // 【核心修复】：直接从当前的实时全员名单里提取 Keys，而不是去读可能不全的历史快照
  // 这样保证哪怕是刚加进来的选手，也会立刻被分配一条专属折线！
  const masterKeys = masterData.map(p => `师父_${p.item.title}`);
  const apprenticeKeys = apprenticeData.map(p => `徒弟_${p.item.title}`);

  const renderCompactList = (data: Player[], cutoffRank: number, title: string, themeColor: string) => {
    const cutoffVote = data[cutoffRank - 1]?.vote || 0;

    return (
      <div className="flex flex-col bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden h-full">
        <div className={`text-center py-2 text-white font-black text-base tracking-widest ${themeColor} shadow-inner`}>
          {title}
        </div>
        
        <div className="flex text-xs text-gray-500 bg-gray-50/50 py-1.5 px-3 border-b font-medium sticky top-0 z-10 backdrop-blur-sm">
          <span className="w-6 text-center">排名</span>
          <span className="w-8"></span>
          <span className="flex-1 ml-2">选手</span>
          <span className="w-20 text-right font-bold">票数</span>
          <span className="w-20 text-right font-bold">距晋级线</span>
        </div>

        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          {data.map((player, index) => {
            const rank = index + 1;
            const isPromoted = rank <= cutoffRank;
            const picUrl = player.item.pic.startsWith('//') ? `https:${player.item.pic}` : player.item.pic;
            
            const voteDiff = player.vote - cutoffVote;
            let gapElement;
            if (rank < cutoffRank) {
              gapElement = <span className="text-green-600">+{voteDiff.toLocaleString()}</span>;
            } else if (rank === cutoffRank) {
              gapElement = <span className="text-purple-600 font-extrabold text-[13px]">守门员</span>;
            } else {
              gapElement = <span className="text-red-500">{voteDiff.toLocaleString()}</span>;
            }

            let rankStyle = "text-gray-500";
            if (rank === 1) rankStyle = "text-yellow-500 font-extrabold";
            if (rank === 2) rankStyle = "text-gray-400 font-extrabold";
            if (rank === 3) rankStyle = "text-amber-700 font-extrabold";

            return (
              <React.Fragment key={player.item_id}>
                {rank === cutoffRank + 1 && (
                  <div className="border-t-2 border-red-300 border-dashed w-full relative"></div>
                )}
                <div className={`flex items-center text-sm py-1 px-3 border-b border-gray-50 hover:bg-gray-100/70 transition-colors ${!isPromoted ? 'opacity-70 bg-gray-50/30' : ''}`}>
                  <span className={`w-6 text-center font-black text-base ${rankStyle}`}>{rank}</span>
                  <img 
                    src={picUrl} 
                    referrerPolicy="no-referrer"
                    alt="avatar" 
                    className="w-7 h-7 rounded-xl object-cover border-2 border-white shadow-sm ml-2" 
                  />
                  <a 
                    href={player.item.jump_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex-1 ml-3 truncate font-bold text-gray-800 hover:text-blue-600 hover:underline decoration-blue-200"
                  >
                    {player.item.title}
                  </a>
                  <span className="w-20 text-right font-mono font-black text-base text-gray-700">
                    {player.vote.toLocaleString()}
                  </span>
                  <span className="w-20 text-right font-mono text-xs font-medium">
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
    <main className="w-screen min-h-screen bg-[#F9FBFC] flex flex-col p-4 md:p-6 font-sans">
      
      {/* 顶部标题栏 */}
      <div className="flex-none flex justify-between items-center bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100 mb-4 backdrop-blur-sm bg-white/95 sticky top-0 z-50">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-black text-gray-950 tracking-tighter shadow-text-xs">🏆 瓦哩师徒杯 S3 · 数据监控看板</h1>
          <span className="text-sm text-gray-400 font-medium">全员监控实时大盘</span>
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
            className="text-[11px] text-gray-400 hover:text-red-500 px-3 py-1.5 border border-gray-100 rounded-lg hover:border-red-100 hover:bg-red-50/50 transition-all font-medium"
          >
            清空历史
          </button>
          <div className="relative flex items-center bg-purple-50/70 px-4 py-2 rounded-full border border-purple-100/50 shadow-inner">
            <span className="animate-ping absolute h-2.5 w-2.5 rounded-full bg-purple-400 opacity-60"></span>
            <span className="relative rounded-full h-2.5 w-2.5 bg-purple-600 mr-2.5 shadow"></span>
            <span className="text-xs text-purple-800 font-extrabold tracking-tight">10s 刷新 | 更新于 {lastUpdated}</span>
          </div>
        </div>
      </div>

      {/* 核心数据区：上部两列列表 */}
      <div className="flex-none grid grid-cols-2 gap-4 h-[65vh] min-h-[480px]">
        {renderCompactList(masterData, 11, "师父组", "bg-blue-600")}
        {renderCompactList(apprenticeData, 13, "徒弟组", "bg-purple-600")}
      </div>

      <div className='flex-none text-center pt-8 pb-3'>
        <h2 className='text-3xl font-black text-gray-900 tracking-tight'>📊 历史全员票数涨势总览</h2>
        <p className='text-gray-500 mt-2 text-sm'>所有选手的历史波动将持久化存储在本地</p>
      </div>

      {/* 底部折线图：分为上下两个大图 */}
      <div className="flex-none flex flex-col gap-4">
        
        {/* 上方：师父组全员趋势图 */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 flex flex-col h-[400px]">
          <div className="text-lg font-black text-blue-700 mb-2.5 ml-1 tracking-tight border-b-2 border-blue-50 pb-1 flex justify-between items-center">
            📈 师父组全员票数波动 
            <span className='font-mono text-xs text-gray-400 font-medium'>{masterKeys.length} 位选手</span>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData} margin={{ top: 5, right: 15, left: 15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f2f2f2" />
                <XAxis dataKey="time" tick={{ fill: '#9CA3AF', fontSize: 11 }} tickMargin={8} />
                <YAxis domain={['auto', 'auto']} tick={{ fill: '#9CA3AF', fontSize: 11 }} width={60} axisLine={false} tickLine={false}/>
                <Tooltip 
                  contentStyle={{ fontSize: '11px', padding: '12px', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ padding: 0, margin: '1px 0' }}
                  cursor={{ stroke: '#E5E7EB', strokeWidth: 2 }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px', maxHeight: '120px', overflowY: 'auto' }} iconType="circle" iconSize={8} />
                {masterKeys.map((key, i) => (
                  <Line 
                    key={key} 
                    type="monotone" 
                    dataKey={key} 
                    name={key.replace('师父_', '')} 
                    stroke={MASTER_PALETTE[i % MASTER_PALETTE.length]} 
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false} 
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 下方：徒弟组全员趋势图 */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 flex flex-col h-[400px]">
          <div className="text-lg font-black text-purple-700 mb-2.5 ml-1 tracking-tight border-b-2 border-purple-50 pb-1 flex justify-between items-center">
            📈 徒弟组全员票数波动
            <span className='font-mono text-xs text-gray-400 font-medium'>{apprenticeKeys.length} 位选手</span>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData} margin={{ top: 5, right: 15, left: 15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f2f2f2" />
                <XAxis dataKey="time" tick={{ fill: '#9CA3AF', fontSize: 11 }} tickMargin={8} />
                <YAxis domain={['auto', 'auto']} tick={{ fill: '#9CA3AF', fontSize: 11 }} width={60} axisLine={false} tickLine={false}/>
                <Tooltip 
                  contentStyle={{ fontSize: '11px', padding: '12px', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ padding: 0, margin: '1px 0' }}
                  cursor={{ stroke: '#E5E7EB', strokeWidth: 2 }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px', maxHeight: '120px', overflowY: 'auto' }} iconType="circle" iconSize={8} />
                {apprenticeKeys.map((key, i) => (
                  <Line 
                    key={key} 
                    type="monotone" 
                    dataKey={key} 
                    name={key.replace('徒弟_', '')}
                    stroke={APPRENTICE_PALETTE[i % APPRENTICE_PALETTE.length]} 
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false} 
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 底部说明 */}
      <div className='flex-none text-center pt-10 pb-6'>
        <p className='text-xs text-gray-400'>数据仅供参考，请以官方为准。</p>
      </div>

    </main>
  );
}