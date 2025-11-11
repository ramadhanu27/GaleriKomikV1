import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb } from 'pdf-lib';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('[TEST PDF] Starting test PDF generation...');
    
    // Create simple PDF with text
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    
    page.drawText('Test PDF - ArKomik', {
      x: 50,
      y: 800,
      size: 30,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('If you can see this, PDF generation works!', {
      x: 50,
      y: 750,
      size: 16,
      color: rgb(0, 0, 0),
    });
    
    // Test image fetch
    const testImageUrl = 'https://img.komiku.org/upload5/fair-trade-committee/35/2025-11-09/1_part1.webp';
    console.log('[TEST PDF] Testing image fetch:', testImageUrl);
    
    try {
      // Test proxy API
      const proxyUrl = `http://localhost:3000/api/image-to-base64?url=${encodeURIComponent(testImageUrl)}`;
      console.log('[TEST PDF] Proxy URL:', proxyUrl);
      
      const response = await fetch(proxyUrl);
      console.log('[TEST PDF] Proxy response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[TEST PDF] Proxy success:', data.success);
        console.log('[TEST PDF] Base64 length:', data.data?.base64?.length || 0);
        
        if (data.success && data.data.base64) {
          // Convert base64 to buffer
          const base64Data = data.data.base64.split(',')[1];
          const buffer = Buffer.from(base64Data, 'base64');
          
          // Embed image
          const image = await pdfDoc.embedJpg(buffer);
          const dims = image.scale(0.5);
          
          page.drawImage(image, {
            x: 50,
            y: 400,
            width: dims.width,
            height: dims.height,
          });
          
          page.drawText('✅ Image loaded successfully!', {
            x: 50,
            y: 350,
            size: 16,
            color: rgb(0, 0.5, 0),
          });
        }
      } else {
        page.drawText(`❌ Proxy failed: ${response.status}`, {
          x: 50,
          y: 700,
          size: 16,
          color: rgb(1, 0, 0),
        });
      }
    } catch (error) {
      console.error('[TEST PDF] Image fetch error:', error);
      page.drawText(`❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`, {
        x: 50,
        y: 700,
        size: 12,
        color: rgb(1, 0, 0),
      });
    }
    
    // Generate PDF
    const pdfBytes = await pdfDoc.save();
    console.log('[TEST PDF] PDF generated, size:', pdfBytes.length);
    
    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="test.pdf"',
      },
    });
  } catch (error) {
    console.error('[TEST PDF] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
