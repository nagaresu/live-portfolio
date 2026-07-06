import { NextResponse } from 'next/server';
import { organizePhotos } from '@/lib/photo-organizer';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { inputDir, logContent, dryRun } = body;

        if (!inputDir || !logContent) {
            return NextResponse.json(
                { success: false, message: 'Missing inputDir or logContent' },
                { status: 400 }
            );
        }

        const result = await organizePhotos(inputDir, logContent, dryRun);

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
