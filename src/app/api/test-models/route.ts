import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/models');
    const data = await res.json();
    const models = data.data.map((m: any) => m.id);
    const freeModels = models.filter((m: string) => m.includes('free'));
    
    return NextResponse.json({
      allFreeModels: freeModels,
      isLlama38bFreeAvailable: freeModels.includes('meta-llama/llama-3.3-70b-instruct:free'),
      isLlama3211bFreeAvailable: freeModels.includes('nvidia/nemotron-nano-12b-v2-vl:free')
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
