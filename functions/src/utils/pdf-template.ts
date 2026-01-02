/**
 * 리포트 PDF 템플릿
 */

export interface ReportPDFData {
  // 기본 정보
  reportId: string;
  vehicleBrand: string;
  vehicleName: string;
  vehicleYear?: string;
  diagnosisDate: string;

  // 배터리 정보
  sohPercentage: number;
  cellCount: number;
  defectiveCellCount: number;
  normalChargeCount?: number;
  fastChargeCount?: number;
  realDrivableDistance?: string;

  // 사고/수리 이력
  accidentRecords?: Array<{
    date: string;
    summary?: string;
    repairParts?: Array<{
      partName: string;
      repairTypes?: string[];
    }>;
    repairCost?: number;
  }>;

  // 검사 항목 요약
  inspectionSummary?: {
    totalItems: number;
    goodItems: number;
    defectItems: number;
  };
}

export function generateReportHTML(data: ReportPDFData): string {
  const repairTypeColors: Record<string, { bg: string; text: string; border: string }> = {
    '도장': { bg: '#faf5ff', text: '#a855f7', border: '#c084fc' },
    '탈착': { bg: '#eff6ff', text: '#3b82f6', border: '#60a5fa' },
    '교환': { bg: '#fef2f2', text: '#ef4444', border: '#f87171' },
    '판금': { bg: '#fff7ed', text: '#f97316', border: '#fb923c' },
    '수리': { bg: '#f0fdf4', text: '#22c55e', border: '#4ade80' },
    '기타': { bg: '#f9fafb', text: '#6b7280', border: '#9ca3af' },
  };

  const getSohColor = (soh: number) => {
    if (soh >= 90) return '#22c55e';
    if (soh >= 80) return '#06b6d4';
    if (soh >= 70) return '#f59e0b';
    return '#ef4444';
  };

  const getSohGrade = (soh: number) => {
    if (soh >= 95) return 'S';
    if (soh >= 90) return 'A+';
    if (soh >= 85) return 'A';
    if (soh >= 80) return 'B+';
    if (soh >= 75) return 'B';
    if (soh >= 70) return 'C';
    return 'D';
  };

  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Charzing 배터리 진단 리포트</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #1f2937;
      background: #fff;
      padding: 40px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #06b6d4;
    }

    .logo {
      font-size: 28px;
      font-weight: 700;
      color: #06b6d4;
    }

    .report-info {
      text-align: right;
      font-size: 12px;
      color: #6b7280;
    }

    .vehicle-info {
      background: linear-gradient(135deg, #ecfeff 0%, #e0f2fe 100%);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }

    .vehicle-name {
      font-size: 24px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }

    .vehicle-year {
      font-size: 14px;
      color: #64748b;
    }

    .section {
      margin-bottom: 24px;
    }

    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
    }

    .battery-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .battery-card {
      background: #f9fafb;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }

    .battery-card.main {
      grid-column: span 2;
      background: linear-gradient(135deg, #ecfeff 0%, #e0f2fe 100%);
    }

    .battery-label {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 8px;
    }

    .battery-value {
      font-size: 36px;
      font-weight: 700;
    }

    .battery-value.small {
      font-size: 24px;
    }

    .soh-grade {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-left: 8px;
    }

    .accident-record {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
    }

    .accident-date {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 8px;
    }

    .accident-summary {
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 12px;
    }

    .repair-parts {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .repair-part {
      display: flex;
      align-items: center;
      gap: 4px;
      background: #fff;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 12px;
    }

    .repair-type {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      font-size: 10px;
      font-weight: 700;
      border-width: 2px;
      border-style: solid;
    }

    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 11px;
      color: #9ca3af;
    }

    .footer-logo {
      color: #06b6d4;
      font-weight: 600;
    }

    .no-accident {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      color: #16a34a;
    }

    .inspection-summary {
      display: flex;
      gap: 16px;
    }

    .inspection-item {
      flex: 1;
      background: #f9fafb;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }

    .inspection-item.good {
      background: #f0fdf4;
    }

    .inspection-item.defect {
      background: #fef2f2;
    }

    .inspection-count {
      font-size: 28px;
      font-weight: 700;
    }

    .inspection-count.good {
      color: #22c55e;
    }

    .inspection-count.defect {
      color: #ef4444;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Charzing</div>
    <div class="report-info">
      <div>진단일: ${data.diagnosisDate}</div>
      <div>리포트 ID: ${data.reportId.slice(0, 8).toUpperCase()}</div>
    </div>
  </div>

  <div class="vehicle-info">
    <div class="vehicle-name">${data.vehicleBrand} ${data.vehicleName}</div>
    ${data.vehicleYear ? `<div class="vehicle-year">${data.vehicleYear}년식</div>` : ''}
  </div>

  <div class="section">
    <div class="section-title">배터리 상태</div>
    <div class="battery-grid">
      <div class="battery-card main">
        <div class="battery-label">배터리 건강도 (SOH)</div>
        <div class="battery-value" style="color: ${getSohColor(data.sohPercentage)}">
          ${data.sohPercentage}%
          <span class="soh-grade" style="background: ${getSohColor(data.sohPercentage)}20; color: ${getSohColor(data.sohPercentage)}">
            ${getSohGrade(data.sohPercentage)}등급
          </span>
        </div>
      </div>
      <div class="battery-card">
        <div class="battery-label">총 셀 개수</div>
        <div class="battery-value small">${data.cellCount}개</div>
      </div>
      <div class="battery-card">
        <div class="battery-label">불량 셀</div>
        <div class="battery-value small" style="color: ${data.defectiveCellCount > 0 ? '#ef4444' : '#22c55e'}">
          ${data.defectiveCellCount}개
        </div>
      </div>
      ${data.normalChargeCount !== undefined ? `
      <div class="battery-card">
        <div class="battery-label">일반 충전</div>
        <div class="battery-value small">${data.normalChargeCount}회</div>
      </div>
      ` : ''}
      ${data.fastChargeCount !== undefined ? `
      <div class="battery-card">
        <div class="battery-label">급속 충전</div>
        <div class="battery-value small">${data.fastChargeCount}회</div>
      </div>
      ` : ''}
    </div>
  </div>

  ${data.inspectionSummary ? `
  <div class="section">
    <div class="section-title">검사 항목 요약</div>
    <div class="inspection-summary">
      <div class="inspection-item">
        <div class="battery-label">총 검사 항목</div>
        <div class="inspection-count">${data.inspectionSummary.totalItems}</div>
      </div>
      <div class="inspection-item good">
        <div class="battery-label">정상</div>
        <div class="inspection-count good">${data.inspectionSummary.goodItems}</div>
      </div>
      <div class="inspection-item defect">
        <div class="battery-label">이상</div>
        <div class="inspection-count defect">${data.inspectionSummary.defectItems}</div>
      </div>
    </div>
  </div>
  ` : ''}

  <div class="section">
    <div class="section-title">사고/수리 이력</div>
    ${!data.accidentRecords || data.accidentRecords.length === 0 ? `
      <div class="no-accident">
        ✓ 사고/수리 이력이 없습니다
      </div>
    ` : data.accidentRecords.map(record => `
      <div class="accident-record">
        <div class="accident-date">${record.date}</div>
        ${record.summary ? `<div class="accident-summary">${record.summary}</div>` : ''}
        ${record.repairParts && record.repairParts.length > 0 ? `
          <div class="repair-parts">
            ${record.repairParts.map(part => `
              <div class="repair-part">
                <span>${part.partName}</span>
                ${part.repairTypes?.map(type => {
                  const colors = repairTypeColors[type] || repairTypeColors['기타'];
                  const abbr = type.charAt(0);
                  return `<span class="repair-type" style="background: ${colors.bg}; color: ${colors.text}; border-color: ${colors.border}">${abbr}</span>`;
                }).join('') || ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
        ${record.repairCost ? `
          <div style="margin-top: 8px; font-size: 12px; color: #6b7280;">
            수리비: ${record.repairCost.toLocaleString()}원
          </div>
        ` : ''}
      </div>
    `).join('')}
  </div>

  <div class="footer">
    <div class="footer-logo">Charzing</div>
    <div>전기차 배터리 전문 진단 서비스</div>
    <div style="margin-top: 8px;">본 리포트는 진단 시점의 상태를 기준으로 작성되었습니다.</div>
  </div>
</body>
</html>
  `;
}
