import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body;
    
    // Get Edge Config credentials from environment
    const edgeConfigId = process.env.EDGE_CONFIG_ID;
    const vercelToken = process.env.VERCEL_TOKEN;
    
    if (!edgeConfigId || !vercelToken) {
      console.error('❌ Missing EDGE_CONFIG_ID or VERCEL_TOKEN environment variables');
      return NextResponse.json({ 
        error: 'Edge Config not configured properly',
        missing: {
          edgeConfigId: !edgeConfigId,
          vercelToken: !vercelToken
        }
      }, { status: 500 });
    }
    
    console.log('🔄 Updating Edge Config:', { key, edgeConfigId });
    
    // Update Edge Config via Vercel API
    const response = await fetch(
      `https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${vercelToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              operation: 'upsert',
              key,
              value,
            },
          ],
        }),
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Edge Config update failed:', {
        status: response.status,
        statusText: response.statusText,
        error
      });
      return NextResponse.json({ 
        error: 'Failed to update Edge Config',
        status: response.status,
        details: error 
      }, { status: 500 });
    }
    
    const result = await response.json();
    console.log('✅ Edge Config updated successfully');
    
    return NextResponse.json({ 
      success: true,
      result 
    });
  } catch (error) {
    console.error('❌ Edge Config update error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}




