import { NextRequest, NextResponse } from 'next/server';
import { get, getAll, has } from '@vercel/edge-config';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: {},
    edgeConfigTests: {},
    errors: []
  };

  try {
    // Check environment variables
    diagnostics.environment = {
      EDGE_CONFIG_exists: !!process.env.EDGE_CONFIG,
      EDGE_CONFIG_preview: process.env.EDGE_CONFIG?.substring(0, 60) + '...',
      EDGE_CONFIG_ID_exists: !!process.env.EDGE_CONFIG_ID,
      EDGE_CONFIG_ID_value: process.env.EDGE_CONFIG_ID,
      VERCEL_TOKEN_exists: !!process.env.VERCEL_TOKEN,
      VERCEL_TOKEN_prefix: process.env.VERCEL_TOKEN?.substring(0, 15) + '...',
    };

    // Test 1: Check if Edge Config is accessible
    try {
      console.log('🧪 Test 1: Checking Edge Config connection...');
      const allKeys = await getAll();
      diagnostics.edgeConfigTests.allKeys = Object.keys(allKeys || {});
      diagnostics.edgeConfigTests.keyCount = Object.keys(allKeys || {}).length;
      console.log('✅ Edge Config accessible, keys:', diagnostics.edgeConfigTests.allKeys);
    } catch (error: any) {
      diagnostics.errors.push({
        test: 'getAll',
        error: error.message,
        stack: error.stack?.split('\n').slice(0, 3)
      });
      console.error('❌ Test 1 failed:', error.message);
    }

    // Test 2: Check if 'game-data' key exists
    try {
      console.log('🧪 Test 2: Checking for game-data key...');
      const hasGameData = await has('game-data');
      diagnostics.edgeConfigTests.hasGameData = hasGameData;
      console.log(hasGameData ? '✅ game-data key exists' : '⚠️ game-data key NOT found');
    } catch (error: any) {
      diagnostics.errors.push({
        test: 'has(game-data)',
        error: error.message,
        stack: error.stack?.split('\n').slice(0, 3)
      });
      console.error('❌ Test 2 failed:', error.message);
    }

    // Test 3: Try to get 'game-data'
    try {
      console.log('🧪 Test 3: Trying to get game-data...');
      const gameData = await get('game-data');
      diagnostics.edgeConfigTests.gameData = gameData ? {
        type: typeof gameData,
        keys: Object.keys(gameData as any),
        hasLeaderboard: !!(gameData as any).leaderboard,
        hasPrizePool: !!(gameData as any).prizePool,
      } : null;
      console.log('✅ game-data retrieved:', diagnostics.edgeConfigTests.gameData);
    } catch (error: any) {
      diagnostics.errors.push({
        test: 'get(game-data)',
        error: error.message,
        stack: error.stack?.split('\n').slice(0, 3)
      });
      console.error('❌ Test 3 failed:', error.message);
    }

    // Test 4: Check greeting key (default Edge Config test key)
    try {
      console.log('🧪 Test 4: Checking for greeting key...');
      const greeting = await get('greeting');
      diagnostics.edgeConfigTests.greeting = greeting;
      console.log('✅ greeting key:', greeting);
    } catch (error: any) {
      diagnostics.errors.push({
        test: 'get(greeting)',
        error: error.message,
        stack: error.stack?.split('\n').slice(0, 3)
      });
      console.error('❌ Test 4 failed:', error.message);
    }

    // Provide recommendations
    diagnostics.recommendations = [];

    if (!diagnostics.environment.EDGE_CONFIG_exists) {
      diagnostics.recommendations.push('❌ EDGE_CONFIG environment variable is missing!');
    }

    if (diagnostics.errors.length > 0) {
      diagnostics.recommendations.push('⚠️ Edge Config connection failed. Check EDGE_CONFIG URL format.');
    }

    if (diagnostics.edgeConfigTests.hasGameData === false) {
      diagnostics.recommendations.push('⚠️ game-data key not found. You need to initialize Edge Config.');
      diagnostics.recommendations.push('📝 Go to Vercel Edge Config UI and add the game-data key manually.');
    }

    if (diagnostics.edgeConfigTests.hasGameData === true && !diagnostics.edgeConfigTests.gameData) {
      diagnostics.recommendations.push('⚠️ game-data key exists but is empty or malformed.');
    }

    if (diagnostics.errors.length === 0 && diagnostics.edgeConfigTests.hasGameData) {
      diagnostics.recommendations.push('✅ Edge Config is working correctly!');
    }

    return NextResponse.json(diagnostics, { status: 200 });

  } catch (error: any) {
    console.error('❌ Diagnostic error:', error);
    return NextResponse.json({
      error: 'Diagnostic failed',
      message: error.message,
      diagnostics
    }, { status: 500 });
  }
}

