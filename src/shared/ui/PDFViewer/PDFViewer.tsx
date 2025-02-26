import React from 'react';
import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';

// Стили (обязательно)
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

// Импорт воркера (если не хотим CDN)
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';

interface PdfViewerProps {
    fileUrl: string;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ fileUrl }) => {
    // Создаём экземпляр defaultLayoutPlugin
    // и указываем, как изначально масштабировать PDF
    const defaultLayoutPluginInstance = defaultLayoutPlugin({
        // defaultScale: SpecialZoomLevel.PageWidth,
        // или SpecialZoomLevel.PageFit
    });

    return (
        // Оборачиваем в <Worker>, чтобы не было конфликтов с воркером
        <Worker workerUrl={workerUrl}>
            <div style={{ width: '100%', height: '100vh' }}>
                <Viewer
                    fileUrl={fileUrl}
                    plugins={[defaultLayoutPluginInstance]}
                />
            </div>
        </Worker>
    );
};
