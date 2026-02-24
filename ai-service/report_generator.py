from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
import io

def generate_pdf(data: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []

    # Title
    elements.append(Paragraph("Mountain Rescue: Tactical Command Report", styles['Title']))
    elements.append(Spacer(1, 12))

    # Executive Summary
    elements.append(Paragraph("Executive Summary", styles['Heading2']))
    elements.append(Paragraph(data.get('executive_summary', ''), styles['Normal']))
    elements.append(Spacer(1, 12))

    # Metrics Table
    elements.append(Paragraph("Operational Readiness Metrics", styles['Heading2']))
    metrics = data.get('raw_metrics', {})
    
    # Flatten metrics for the table
    table_data = [["Metric Category", "Value"]]
    
    incidents = metrics.get('incidents', {})
    table_data.append(["Total Active Incidents", str(incidents.get('total_incidents', 'N/A'))])
    table_data.append(["Avg Incident Severity", str(incidents.get('avg_severity', 'N/A'))])
    
    personnel = metrics.get('personnel', {})
    table_data.append(["Available Personnel", str(personnel.get('available_personnel', 'N/A'))])
    table_data.append(["Dispatched Rescuers", str(personnel.get('active_rescuers', 'N/A'))])

    eq = metrics.get('equipment', {})
    table_data.append(["Equipment In-Use", str(eq.get('in_use', 'N/A'))])

    t = Table(table_data, colWidths=[200, 100])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (1,0), colors.darkred),
        ('TEXTCOLOR', (0,0), (1,0), colors.whitesmoke),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,0), 12),
        ('GRID', (0,0), (-1,-1), 1, colors.black),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 12))

    # Recommendations
    elements.append(Paragraph("Tactical Recommendations", styles['Heading2']))
    for rec in data.get('recommendations', []):
        elements.append(Paragraph(f"• {rec}", styles['Normal']))
    
    elements.append(Spacer(1, 12))

    # Operational Actions
    elements.append(Paragraph("Immediate Operational Actions", styles['Heading2']))
    for action in data.get('operational_actions', []):
        elements.append(Paragraph(f"• {action}", styles['Normal']))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()