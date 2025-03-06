import React, { useEffect } from "react";
import { Viewer, Worker, SpecialZoomLevel } from "@react-pdf-viewer/core";
import type { RenderPageProps } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import styles from "./styles.module.scss";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.js?url";

const base64toBlob = (data: string) => {
    // Проверяем, содержит ли строка префикс, и убираем его, если есть
    if (data) {
        const base64WithoutPrefix = data.startsWith("data:application/pdf;base64,")
            ? data.replace("data:application/pdf;base64,", "")
            : data;

        try {
            const bytes = atob(base64WithoutPrefix);
            const out = new Uint8Array(bytes.length);
            for (let i = 0; i < bytes.length; i++) {
                out[i] = bytes.charCodeAt(i);
            }
            return new Blob([out], { type: "application/pdf" });
        } catch (error) {
            console.error("Ошибка декодирования Base64:", error);
            return null;
        }
    }
};


interface PdfViewerProps {
    base64: string;
    style?: React.CSSProperties;
    className?: string;
}

export const PdfViewerrr: React.FC<PdfViewerProps> = ({ base64, style, className }) => {
    const blob = base64toBlob(base64);
    const pdfUrl = blob ? URL.createObjectURL(blob) : "";

    return (
        <Worker workerUrl={workerUrl}>
            <div
                className={className}
                style={{
                    width: "100%",
                    height: "100vh",
                    overflowY: "auto",
                    backgroundColor: "#f5f5f5",
                    ...style,
                }}
            >
                <Viewer
                    fileUrl={pdfUrl}
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