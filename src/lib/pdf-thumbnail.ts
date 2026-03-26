/**
 * Generates a JPEG thumbnail of the first page of a PDF file.
 * Uses dynamic import of pdfjs-dist to avoid top-level issues in Vite.
 * @param file The PDF file object
 * @param scale The scale factor for the thumbnail resolution (default 1.0)
 * @returns A promise that resolves to a Blob of the thumbnail image
 */
export const generatePdfThumbnail = async (file: File, scale = 1.0): Promise<Blob> => {
    try {
        // Dynamic import to handle Vite's potential issues with pdfjs-dist at top-level
        const pdfjsLib = await import('pdfjs-dist');

        // Configure the worker - using unpkg as a reliable CDN
        const version = pdfjsLib.version || '4.0.379';
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        // Get the first page
        const page = await pdf.getPage(1);

        // Calculate viewport based on requested scale
        const viewport = page.getViewport({ scale });

        // Create canvas to render the page
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
            throw new Error('Could not create canvas context');
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render the page onto the canvas
        const renderContext = {
            canvasContext: context,
            viewport: viewport,
        };

        await page.render(renderContext).promise;

        // Convert canvas to Blob
        return new Promise((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to convert canvas to blob'));
                    }
                },
                'image/jpeg',
                0.85 // Quality factor
            );
        });
    } catch (error) {
        console.error('Error generating PDF thumbnail:', error);
        throw error;
    }
};
