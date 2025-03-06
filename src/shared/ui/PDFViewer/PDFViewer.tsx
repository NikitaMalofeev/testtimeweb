import React, { useMemo } from "react";
import { Viewer, Worker, SpecialZoomLevel } from "@react-pdf-viewer/core";
import type { RenderPageProps } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.js?url";
import styles from "./styles.module.scss";

interface PdfViewerProps {
    fileUrl?: string;
    documentData?: string;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ fileUrl, documentData }) => {
    const pdfFileUrl = useMemo((): string | Uint8Array => {
        if (documentData) {
            // Если получен сырой PDF, начинающийся с '%PDF'
            if (documentData.startsWith("%PDF")) {
                const bytes = new TextEncoder().encode(documentData);
                return bytes; // Uint8Array
            } else {
                // Иначе считаем, что это Base64
                const base64Str = documentData.replace(/^data:application\/pdf;base64,/, "");
                const raw = atob(base64Str);
                const array = new Uint8Array(raw.length);
                for (let i = 0; i < raw.length; i++) {
                    array[i] = raw.charCodeAt(i);
                }
                return array; // Uint8Array
            }
        }
        // Если documentData не задан, используем строку URL
        return fileUrl || "";
    }, [documentData, fileUrl]);

    return (
        <Worker workerUrl={workerUrl}>
            <div style={{ width: "100%", height: "100vh", overflowY: "auto", backgroundColor: "#f5f5f5" }}>
                <Viewer
                    fileUrl={pdfFileUrl}
                    defaultScale={SpecialZoomLevel.PageWidth}
                    renderPage={(props: RenderPageProps) => {
                        const { canvasLayer, textLayer, annotationLayer } = props;
                        return (
                            <div>
                                <div className={styles.pdf__page}>
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
