import React from "react";
import { Viewer, Worker, SpecialZoomLevel } from "@react-pdf-viewer/core";
import type { RenderPageProps } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.js?url";
import styles from "./styles.module.scss";

interface PdfViewerProps {
    // Если передан assetUrl — показываем PDF по ссылке из /assets/...
    // Если передан documentData (Uint8Array) — показываем PDF из бинарных данных
    assetUrl?: string;
    documentData?: Uint8Array | null;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ assetUrl, documentData }) => {
    let viewerSource: string | Uint8Array;

    // 1) Если есть assetUrl, используем ссылку
    // 2) Иначе, если есть бинарные данные, используем их
    // 3) Если ничего нет — показываем "Нет данных"
    if (assetUrl) {
        viewerSource = assetUrl;
    } else if (documentData) {
        viewerSource = documentData;
    } else {
        return <div>Нет данных для PDF</div>;
    }

    return (
        <Worker workerUrl={workerUrl}>
            <div style={{ width: "100%", height: "100vh", overflowY: "auto", backgroundColor: "#f5f5f5" }}>
                <Viewer
                    fileUrl={viewerSource}
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
