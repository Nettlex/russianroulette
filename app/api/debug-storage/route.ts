import { NextRequest, NextResponse } from 'next/server';
import { getData, loadData } from '../../lib/storage';

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const envCheck = {
      EDGE_CONFIG: !!process.env.EDGE_CONFIG,
      EDGE_CONFIG_ID: !!process.env.EDGE_CONFIG_ID,
      VERCEL_TOKEN: !!process.env.VERCEL_TOKEN,
      VERCEL_URL: !!process.env.VERCEL_URL,
    };

    console.log('🔍 Environment check:', envCheck);

    // Try to load data
    let loadError = null;
    let loadedData = null;
    try {
      loadedData = await loadData();
      console.log('✅ Data loaded successfully');
    } catch (error) {
      loadError = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to load data:', loadError);
    }

    // Get current cached data
    const cachedData = getData();

    return NextResponse.json({
      environment: envCheck,
      loadError,
      cachedData: {
        freeLeaderboard: cachedData.leaderboard?.free?.length || 0,
        paidLeaderboard: cachedData.leaderboard?.paid?.length || 0,
        playerStats: Object.keys(cachedData.playerStats || {}).length,
        prizePool: cachedData.prizePool,
      },
      loadedData: loadedData ? {
        freeLeaderboard: loadedData.leaderboard?.free?.length || 0,
        paidLeaderboard: loadedData.leaderboard?.paid?.length || 0,
        playerStats: Object.keys(loadedData.playerStats || {}).length,
      } : null,
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}



