import { NextRequest, NextResponse } from 'next/server';
import { calculatePrizeDistributionForLeaderboard } from '../../../utils/prizeDistribution';
import fs from 'fs';
import path from 'path';

/**
 * API endpoint to trigger prize distribution
 * This should be called manually or via cron job
 */
export async function POST(request: NextRequest) {
  try {
    // Get paid leaderboard from localStorage (client-side) or database
    // For now, we'll read from a shared state or require leaderboard data in request
    
    const body = await request.json();
    const { leaderboardEntries, prizePoolAmount } = body;

    if (!leaderboardEntries || !Array.isArray(leaderboardEntries) || leaderboardEntries.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid leaderboard entries' 
      }, { status: 400 });
    }

    if (!prizePoolAmount || prizePoolAmount <= 0) {
      return NextResponse.json({ 
        error: 'Invalid prize pool amount' 
      }, { status: 400 });
    }

    // Calculate distributions
    const distributions = calculatePrizeDistributionForLeaderboard(
      prizePoolAmount,
      leaderboardEntries
    );

    if (distributions.length === 0) {
      return NextResponse.json({ 
        error: 'No distributions calculated' 
      }, { status: 400 });
    }

    // Create distribution log
    const distributionLog = {
      distributionId: distributions[0].distributionId,
      timestamp: Date.now(),
      prizePoolAmount,
      participants: leaderboardEntries.length,
      distributions,
    };

    // Save log (server-side)
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const logFile = path.join(logsDir, 'prize_distributions.json');
    let logs: any[] = [];
    
    if (fs.existsSync(logFile)) {
      try {
        const content = fs.readFileSync(logFile, 'utf-8');
        logs = JSON.parse(content);
      } catch (error) {
        console.error('Error reading distribution logs:', error);
      }
    }

    logs.push(distributionLog);
    
    try {
      fs.writeFileSync(logFile, JSON.stringify(logs, null, 2), 'utf-8');
      console.log(`✅ Prize distribution logged: ${distributionLog.distributionId}`);
    } catch (error) {
      console.error('Error writing distribution log:', error);
      // Continue even if logging fails
    }

    return NextResponse.json({ 
      success: true, 
      distribution: distributionLog,
      message: 'Prizes distributed and logged. Users can now see pending prizes in their balance.'
    });
  } catch (error: any) {
    console.error('Distribution error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

/**
 * GET endpoint to view distribution logs
 */
export async function GET(request: NextRequest) {
  try {
    const logFile = path.join(process.cwd(), 'logs', 'prize_distributions.json');
    
    if (!fs.existsSync(logFile)) {
      return NextResponse.json({ logs: [] });
    }

    const content = fs.readFileSync(logFile, 'utf-8');
    const logs = JSON.parse(content);

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error('Error reading logs:', error);
    return NextResponse.json({ 
      error: 'Error reading logs',
      details: error.message 
    }, { status: 500 });
  }
}

