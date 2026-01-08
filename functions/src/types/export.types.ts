export interface ExportReportImageRequest {
  reportId: string;
}

export interface ExportReportImageResponse {
  success: boolean;
  imageUrls?: string[];
  error?: string;
}
