declare module 'pdfjs-dist/build/pdf.mjs' {
  export interface GlobalWorkerOptions {
    workerSrc: string;
    workerPort: any;
  }

  export const GlobalWorkerOptions: {
    workerSrc: string;
    workerPort: any;
  };

  export function getDocument(source: any): any;
  export const version: string;
  export const build: string;

  export const AbortException: any;
  export const AnnotationLayer: any;
  export const AnnotationMode: any;
  export const AnnotationType: any;
  export const PermissionFlag: any;
  export const UnknownErrorException: any;
  export const InvalidPDFException: any;
  export const MissingPDFException: any;
  export const UnexpectedResponse: any;

  export namespace globalThis {
    let pdfjsWorker: any;
  }

  export interface PDFDocument {
    numPages: number;
    getPage(pageNum: number): Promise<PDFPage>;
  }

  export interface PDFPage {
    getTextContent(): Promise<any>;
    render(params: any): any;
    getViewport(params: { scale: number }): any;
  }

  export interface PDFTextContent {
    items: Array<any>;
  }
}
