import React, { useMemo } from "react";
import {
    Viewer,
    Worker,
    SpecialZoomLevel,
    RenderPageProps,
} from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.js?url";
import styles from "./styles.module.scss";

interface MyPdfViewerProps {
    /** Если есть ссылка на PDF */
    pdfUrl?: string;
    /** Если есть base64 без data:application/pdf;base64, */
    pdfBase64?: string;
    /** Если есть бинарные данные PDF */
    pdfBinary?: Uint8Array;
}

/**
 * Преобразуем base64 (без префикса) в Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
    const raw = atob(base64);
    const uint8Array = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
        uint8Array[i] = raw.charCodeAt(i);
    }
    return uint8Array;
}

export const PdfViewer: React.FC<MyPdfViewerProps> = ({
    pdfUrl,
    pdfBase64,
    pdfBinary,
}) => {
    /**
     * Готовим «безопасный» source.
     * 1.  pdfBinary → создаём ПОЛНУЮ копию (new Uint8Array),
     *     чтобы исходный буфер в Redux НЕ детачился.
     * 2.  pdfBase64 → обычное преобразование.
     * 3.  pdfUrl    → передаём как есть.
     */
    const viewerSource: string | Uint8Array | null = useMemo(() => {
        if (pdfBinary) {
            try {
                // ⚠️ Полная копия данных
                return new Uint8Array(pdfBinary);
            } catch (e) {
                // Если буфер уже оторван (маловероятно после фикса) —
                // просто покажем ошибку ниже.
                console.error("Detached ArrayBuffer", e);
                return null;
            }
        }
        if (pdfBase64) {
            return base64ToUint8Array(pdfBase64);
        }
        if (pdfUrl) {
            return pdfUrl;
        }
        return null;
    }, [pdfUrl, pdfBase64, pdfBinary]);

    if (!viewerSource) {
        return <div>Нет данных для PDF</div>;
    }

    return (
        <Worker workerUrl={workerUrl}>
            <div
                style={{
                    width: "100%",
                    height: "100vh",
                    overflowY: "auto",
                    ...(pdfUrl && { paddingLeft: "10px" }),
                }}
            >
                <Viewer
                    fileUrl={viewerSource}
                    defaultScale={SpecialZoomLevel.PageWidth}
                    renderPage={(props: RenderPageProps) => {
                        const { canvasLayer, textLayer, annotationLayer } = props;
                        return (
                            <div>
                                <div
                                    className={`${styles.pdf__container} ${!pdfUrl
                                            ? styles.pdf__page
                                            : styles.pdf__page_preview
                                        }`}
                                >
                                    <div>{canvasLayer.children}</div>
                                    <div>{textLayer.children}</div>
                                    <div>{annotationLayer.children}</div>
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
