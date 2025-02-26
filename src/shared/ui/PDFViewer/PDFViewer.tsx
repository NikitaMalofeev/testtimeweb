import React from 'react';
import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';

// Стили (обязательно)
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

// Импорт worker
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';

interface PdfViewerProps {
    fileUrl: string;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ fileUrl }) => {
    const defaultLayoutPluginInstance = defaultLayoutPlugin();

    return (
        <Worker workerUrl={workerUrl}>
            <div style={{ width: '100%', height: '100vh' }}>
                <Viewer
                    fileUrl={fileUrl}
                    // Вместо передачи defaultScale в плагин, указываем его
                    // прямо в Viewer:
                    defaultScale={SpecialZoomLevel.PageWidth}
                // plugins={[defaultLayoutPluginInstance]}
                />
            </div>
        </Worker>
    );
};
