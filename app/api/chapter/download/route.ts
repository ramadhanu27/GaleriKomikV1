import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for large PDFs

async function fetchImageAsBase64(url: string, baseUrl: string, retries = 3): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      // Use internal image proxy API to bypass CORS
      const proxyUrl = `${baseUrl}/api/image-to-base64?url=${encodeURIComponent(url)}`;
      
      console.log(`[fetchImageAsBase64] Attempt ${i + 1}/${retries} - Fetching: ${url.substring(0, 100)}...`);
      console.log(`[fetchImageAsBase64] Proxy URL: ${proxyUrl.substring(0, 150)}...`);
      
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        console.error(`[fetchImageAsBase64] HTTP ${response.status} - ${response.statusText}`);
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.data.base64) {
        console.error(`[fetchImageAsBase64] Invalid response:`, data);
        throw new Error('Failed to get base64 image');
      }

      console.log(`[fetchImageAsBase64] ✅ Success - Base64 length: ${data.data.base64.length}`);
      
      // Return base64 string (already includes data:image/...;base64,...)
      return data.data.base64;
    } catch (error) {
      console.error(`[fetchImageAsBase64] Error on attempt ${i + 1}:`, error);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('Failed to fetch image');
}

async function base64ToArrayBuffer(base64: string): Promise<ArrayBuffer> {
  // Remove data URL prefix if present
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  const buffer = Buffer.from(base64Data, 'base64');
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

async function convertImageToJpeg(imageBuffer: ArrayBuffer, isWebP: boolean): Promise<Buffer> {
  if (!isWebP) {
    // If not WebP, return as is
    return Buffer.from(imageBuffer);
  }
  
  try {
    console.log('[convertImageToJpeg] Converting WebP to JPEG...');
    // Convert WebP to JPEG using sharp
    const jpegBuffer = await sharp(Buffer.from(imageBuffer))
      .jpeg({ quality: 90 })
      .toBuffer();
    
    console.log(`[convertImageToJpeg] ✅ Converted - Original: ${imageBuffer.byteLength} bytes, JPEG: ${jpegBuffer.length} bytes`);
    return jpegBuffer;
  } catch (error) {
    console.error('[convertImageToJpeg] Conversion failed:', error);
    // Fallback to original buffer
    return Buffer.from(imageBuffer);
  }
}

async function getImageDimensions(imageBytes: ArrayBuffer): Promise<{ width: number; height: number }> {
  // Simple image dimension detection for JPEG and PNG
  const bytes = new Uint8Array(imageBytes);
  
  // PNG detection
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    const width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
    const height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
    return { width, height };
  }
  
  // JPEG detection
  if (bytes[0] === 0xFF && bytes[1] === 0xD8) {
    let offset = 2;
    while (offset < bytes.length) {
      if (bytes[offset] !== 0xFF) break;
      const marker = bytes[offset + 1];
      if (marker === 0xC0 || marker === 0xC2) {
        const height = (bytes[offset + 5] << 8) | bytes[offset + 6];
        const width = (bytes[offset + 7] << 8) | bytes[offset + 8];
        return { width, height };
      }
      const segmentLength = (bytes[offset + 2] << 8) | bytes[offset + 3];
      offset += segmentLength + 2;
    }
  }
  
  // Default dimensions if detection fails
  return { width: 800, height: 1200 };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const chapter = searchParams.get('chapter') || 'unknown';
    const manhwaTitle = searchParams.get('title') || 'Manhwa';
    const images = searchParams.getAll('img');

    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      );
    }

    console.log(`[PDF Download] Starting generation for ${manhwaTitle} - Chapter ${chapter}`);
    console.log(`[PDF Download] Total images: ${images.length}`);
    console.log(`[PDF Download] Request URL: ${request.url}`);
    
    // Get base URL from request
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    console.log(`[PDF Download] Base URL: ${baseUrl}`);

    // Create new PDF document
    const pdfDoc = await PDFDocument.create();

    // Process all images first to get dimensions and buffers
    console.log('[PDF Download] Step 1: Fetching and processing all images...');
    const processedImages: Array<{
      buffer: Buffer;
      width: number;
      height: number;
      isPng: boolean;
    }> = [];

    for (let i = 0; i < images.length; i++) {
      const imgUrl = images[i];
      console.log(`[PDF Download] Processing image ${i + 1}/${images.length}: ${imgUrl.substring(0, 80)}...`);

      try {
        // Fetch image as base64 via proxy
        const base64Image = await fetchImageAsBase64(imgUrl, baseUrl);
        const imageBytes = await base64ToArrayBuffer(base64Image);
        
        // Check if image is WebP
        const isWebP = imgUrl.toLowerCase().includes('.webp') || imgUrl.toLowerCase().includes('webp');
        const isPng = imgUrl.toLowerCase().includes('.png') || imgUrl.toLowerCase().includes('png');
        
        console.log(`[PDF Download] Image ${i + 1} format: ${isWebP ? 'WebP' : isPng ? 'PNG' : 'JPEG'}`);
        
        // Convert WebP to JPEG (pdf-lib doesn't support WebP)
        const processedBuffer = await convertImageToJpeg(imageBytes, isWebP);
        
        // Get dimensions using sharp (more reliable)
        const metadata = await sharp(processedBuffer).metadata();
        const dimensions = {
          width: metadata.width || 800,
          height: metadata.height || 1200
        };
        
        console.log(`[PDF Download] Image ${i + 1} dimensions: ${dimensions.width}x${dimensions.height}`);
        
        processedImages.push({
          buffer: processedBuffer,
          width: dimensions.width,
          height: dimensions.height,
          isPng: isPng && !isWebP
        });
        
        console.log(`[PDF Download] ✅ Image ${i + 1}/${images.length} processed`);
      } catch (error) {
        console.error(`[PDF Download] ❌ Failed to process image ${i + 1}:`, error);
        // Continue with other images
      }
    }

    console.log(`[PDF Download] Step 2: Creating single long page with ${processedImages.length} images...`);

    // Calculate total height and max width
    let totalHeight = 0;
    let maxWidth = 0;
    
    for (const img of processedImages) {
      totalHeight += img.height;
      maxWidth = Math.max(maxWidth, img.width);
    }

    console.log(`[PDF Download] Page dimensions: ${maxWidth}x${totalHeight} (${(totalHeight / 1000).toFixed(1)}k pixels)`);

    // Create single page with total height
    const page = pdfDoc.addPage([maxWidth, totalHeight]);
    
    // Draw all images vertically
    let currentY = totalHeight; // Start from top (PDF coordinates are bottom-up)
    
    for (let i = 0; i < processedImages.length; i++) {
      const imgData = processedImages[i];
      
      try {
        // Embed image
        let image;
        if (imgData.isPng) {
          image = await pdfDoc.embedPng(imgData.buffer);
        } else {
          image = await pdfDoc.embedJpg(imgData.buffer);
        }

        // Calculate Y position (PDF uses bottom-up coordinates)
        currentY -= imgData.height;
        
        // Center image horizontally if narrower than page
        const x = (maxWidth - imgData.width) / 2;
        
        // Draw image
        page.drawImage(image, {
          x: x,
          y: currentY,
          width: imgData.width,
          height: imgData.height,
        });
        
        console.log(`[PDF Download] ✅ Image ${i + 1}/${processedImages.length} drawn at Y=${currentY}`);
      } catch (error) {
        console.error(`[PDF Download] ❌ Failed to draw image ${i + 1}:`, error);
      }
    }

    console.log('[PDF Download] Step 3: All images added to single page!');

    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save();

    console.log(`[PDF Download] PDF generated successfully. Size: ${(pdfBytes.length / 1024 / 1024).toFixed(2)} MB`);

    // Create safe filename
    const safeTitle = manhwaTitle.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
    const filename = `${safeTitle}_Chapter_${chapter}.pdf`;

    // Return PDF as downloadable file
    // Convert Uint8Array to Buffer for Response compatibility
    return new Response(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBytes.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('[PDF Download] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
