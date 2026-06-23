import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const group = searchParams.get('group');

  // 判断是徒弟组还是师父组
  const groupId = group === 'apprentice' 
    ? '24ERA1wloghvtgl00' 
    : '24ERA1wloghvtc600';

  // 注意：将 ps 设置为 50 以一次性获取全部数据
  const targetUrl = `https://api.bilibili.com/x/activity_components/vote_new/rank?csrf=149352f0b206ed3cfdf3ee6ee2ab4b76&group_id=${groupId}&pn=1&ps=50&random_version=&type=0&vote_id=23ERA1wloghvxay00&web_location=888.148305`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://live.bilibili.com/',
      },
      next: { revalidate: 0 } // 禁用缓存，确保实时获取
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: '获取数据失败' }, { status: 500 });
  }
}