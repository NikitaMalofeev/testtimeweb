import React from 'react';
import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core';
import type { RenderPageProps } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import styles from './styles.module.scss'

// Если используете свой локальный воркер pdf.js
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';

interface PdfViewerProps {
    fileUrl: string;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ fileUrl }) => {
    return (
        <Worker workerUrl={workerUrl}>
            {/* Общий контейнер, чтобы страницы можно было прокручивать */}
            <div
                style={{
                    width: '100%',
                    height: '100vh',
                    overflowY: 'auto',
                    backgroundColor: '#f5f5f5', // фон (опционально)
                }}
            >
                <Viewer
                    fileUrl={fileUrl}
                    defaultScale={SpecialZoomLevel.PageWidth}
                    // Выводим каждую страницу в отдельном «обёрточном» div
                    renderPage={(props: RenderPageProps) => {
                        const { canvasLayer, textLayer, annotationLayer } = props;

                        return (
                            // Контейнер, отвечающий за «центрирование»
                            <div

                            >
                                {/* Контейнер самой страницы со слоями */}
                                <div className={styles.pdf__page}>
                                    {/* Canvas (основное изображение PDF-страницы) */}
                                    <div >
                                        {canvasLayer.children}
                                    </div>
                                    {/* Текстовый слой (для выделения текста) */}
                                    <div >
                                        {textLayer.children}
                                    </div>
                                    {/* Аннотации (ссылки, поля форм) */}
                                    <div >
                                        {annotationLayer.children}
                                    </div>

                                </div>
                                <div className={styles.pdf__line}></div>
                            </div>
                        );
                    }}
                />
            </div>
        </Worker>
    );
};
