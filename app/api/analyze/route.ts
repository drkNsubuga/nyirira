import { NextRequest, NextResponse } from 'next/server';
import { analyzeImageWithFallback } from '@/lib/youcamClient';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageData = formData.get('image') as string;
    
    if (!imageData) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    console.log('Processing image analysis...');
    
    // Analyze the image
    const result = await analyzeImageWithFallback(imageData);
    
    console.log('Analysis completed successfully');
    console.log('Result has complete analysis:', {
      hasSkinAnalysis: !!result.skinAnalysis,
      hasVTO: !!result.vto,
      lipShadesCount: result.vto?.recommendedLipShades?.length || 0,
      hasOutfitPalette: !!result.vto?.outfitPalette,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Analysis failed:', error);
    return NextResponse.json(
      { error: 'Analysis failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}