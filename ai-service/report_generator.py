import io
import datetime
from typing import Dict, Any, List

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker

class PDFReportGenerator:
    def __init__(self):
        self.width, self.height = A4
        self.styles = getSampleStyleSheet()
        self._setup_styles()

    def _setup_styles(self):
        # Custom styles
        self.styles.add(ParagraphStyle(
            name='ReportTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            leading=30,
            alignment=TA_CENTER,
            spaceAfter=20,
            textColor=colors.HexColor('#1f2937')
        ))
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=16,
            leading=20,
            spaceBefore=15,
            spaceAfter=10,
            textColor=colors.HexColor('#111827'),
            borderPadding=(0, 0, 5, 0),
            borderColor=colors.HexColor('#e5e7eb'),
            borderWidth=1,
            borderCollapse=True
        ))
        self.styles.add(ParagraphStyle(
            name='NormalJustified',
            parent=self.styles['Normal'],
            alignment=TA_JUSTIFY,
            leading=14,
            fontSize=10,
            spaceAfter=8,
            textColor=colors.HexColor('#374151')
        ))
        self.styles.add(ParagraphStyle(
            name='BulletPoint',
            parent=self.styles['Normal'],
            alignment=TA_LEFT,
            leading=14,
            fontSize=10,
            leftIndent=20,
            bulletIndent=10,
            spaceAfter=4,
            textColor=colors.HexColor('#4b5563')
        ))
        
    def generate(self, data: Dict[str, Any]) -> io.BytesIO:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer, 
            pagesize=A4,
            rightMargin=50, leftMargin=50,
            topMargin=50, bottomMargin=50
        )
        
        story = []
        
        # 1. Title Page / Header
        story.append(Spacer(1, 1*inch))
        story.append(Paragraph("AI Insights Report", self.styles['ReportTitle']))
        story.append(Paragraph(f"Generated on {datetime.datetime.now().strftime('%B %d, %Y')}", self.styles['Normal']))
        story.append(Spacer(1, 0.5*inch))
        
        # 2. Executive Summary
        if "executive_summary" in data:
            story.append(Paragraph("Executive Summary", self.styles['SectionHeader']))
            story.append(Paragraph(data["executive_summary"], self.styles['NormalJustified']))
            story.append(Spacer(1, 0.2*inch))

        # 3. Key Metrics (Table)
        metrics = data.get("raw_metrics", {})
        if metrics:
            story.append(Paragraph("Key Metrics Overview", self.styles['SectionHeader']))
            story.append(self._create_metrics_table(metrics))
            story.append(Spacer(1, 0.3*inch))

        # 4. Visual Analysis (Charts)
        story.append(PageBreak())
        story.append(Paragraph("Visual Analysis", self.styles['SectionHeader']))
        
        charts = self._create_charts(metrics)
        for chart_buf, title in charts:
            story.append(Paragraph(title, self.styles['Heading3']))
            img = Image(chart_buf, width=6*inch, height=3.5*inch)
            story.append(img)
            story.append(Spacer(1, 0.2*inch))

        # 5. Detailed Findings
        if "key_findings" in data:
            story.append(PageBreak())
            story.append(Paragraph("Key Findings", self.styles['SectionHeader']))
            findings = data["key_findings"]
            if isinstance(findings, dict) and "narrative" in findings:
                # Basic markdown-like parsing for the narrative
                lines = findings["narrative"].split("\n")
                for line in lines:
                    line = line.strip()
                    if not line:
                        continue
                    if line.startswith('**'):
                         story.append(Paragraph(line.replace('**', ''), self.styles['Heading4']))
                    elif line.startswith('- ') or line.startswith('• '):
                        story.append(Paragraph(line[2:], self.styles['BulletPoint']))
                    else:
                        story.append(Paragraph(line, self.styles['NormalJustified']))
            else:
                 story.append(Paragraph(str(findings), self.styles['Normal']))

        # 6. Recommendations
        if "recommendations" in data:
            story.append(Paragraph("Actionable Recommendations", self.styles['SectionHeader']))
            recs = data["recommendations"]
            if isinstance(recs, list):
                for i, rec in enumerate(recs, 1):
                    story.append(Paragraph(f"{i}. {rec}", self.styles['NormalJustified']))
            else:
                story.append(Paragraph(str(recs), self.styles['Normal']))

        # Build PDF
        doc.build(story, onFirstPage=self._header_footer, onLaterPages=self._header_footer)
        buffer.seek(0)
        return buffer

    def _header_footer(self, canvas, doc):
        canvas.saveState()
        canvas.setFont('Helvetica', 9)
        canvas.drawString(inch, 0.75 * inch, "The RawCodders AI Analytics")
        canvas.drawRightString(A4[0] - inch, 0.75 * inch, f"Page {doc.page}")
        canvas.restoreState()

    def _create_metrics_table(self, metrics: Dict[str, Any]) -> Table:
        # Extract some high-level metrics safely
        txs = metrics.get("transactions", {})
        returns = metrics.get("returns", {})
        demos = metrics.get("demographics", {})
        
        data = [
            ["Metric", "Value"],
            ["Total Transactions", str(txs.get("total_transactions", "—"))],
            ["Avg Order Value", f"${txs.get('avg_order_value', 0):.2f}" if "avg_order_value" in txs else "—"],
            ["Unique Customers", str(demos.get("total_unique_customers", "—"))],
            ["Return Rate", f"{returns.get('overall_return_rate', 0)*100:.1f}%" if "overall_return_rate" in returns else "—"],
        ]
        
        t = Table(data, colWidths=[3*inch, 2*inch], hAlign='LEFT')
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (1, 0), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (1, 0), colors.HexColor('#111827')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb')),
            ('ROWBACKGROUNDS', (1, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')])
        ]))
        return t

    def _create_charts(self, metrics: Dict[str, Any]) -> List[tuple]:
        charts = []
        
        # 1. Temporal: Transactions by Day
        temporal = metrics.get("temporal", {})
        if "transactions_by_day_of_week" in temporal:
            data = temporal["transactions_by_day_of_week"]
            if data:
                buf = io.BytesIO()
                fig, ax = plt.subplots(figsize=(8, 4))
                
                # Ensure correct order
                days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
                values = [data.get(d, 0) for d in days]
                
                ax.bar(days, values, color='#3b82f6')
                ax.set_title("Transactions by Day of Week")
                ax.set_ylabel("Count")
                plt.setp(ax.get_xticklabels(), rotation=45)
                
                fig.tight_layout()
                fig.savefig(buf, format='png', dpi=100)
                plt.close(fig)
                buf.seek(0)
                charts.append((buf, "Weekly Transaction Volume"))

        # 2. Products: Top Products
        products = metrics.get("products", {})
        if "top10_by_revenue" in products:
            data = products["top10_by_revenue"]
            if data:
                # Take top 5 for clarity
                items = list(data.items())[:5]
                labels = [i[0][:20] + '...' if len(i[0]) > 20 else i[0] for i in items]
                values = [i[1] for i in items]
                
                buf = io.BytesIO()
                fig, ax = plt.subplots(figsize=(8, 4))
                
                ax.barh(labels, values, color='#10b981')
                ax.set_title("Top 5 Products by Revenue")
                ax.set_xlabel("Revenue ($)")
                
                fig.tight_layout()
                fig.savefig(buf, format='png', dpi=100)
                plt.close(fig)
                buf.seek(0)
                charts.append((buf, "Top Performing Products"))

        return charts
