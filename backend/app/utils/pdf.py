from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib import colors
import base64, logging

logger = logging.getLogger("airq")

def build_report(title, cities, content, chart_images=None, llm_conclusion=None):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("<b>AirSense</b>", styles["Title"]))
    story.append(Spacer(1, 12))
    story.append(Paragraph(f"<b>{title}</b>", styles["Heading2"]))
    story.append(Spacer(1, 12))
    story.append(Paragraph(f"<b>Cities:</b> {', '.join(cities)}", styles["Normal"]))
    story.append(Spacer(1, 12))

    if isinstance(content, dict) and "byCity" in content:
        data = [["City", "Mean PM2.5 (µg/m³)", "Min", "Max", "Points"]]
        for c, vals in content["byCity"].items():
            mean_val = vals.get("mean_pm25", vals.get("mean_yhat"))
            data.append([
                c,
                f"{mean_val:.2f}" if mean_val is not None else "-",
                vals.get("min_pm25", "-"),
                vals.get("max_pm25", "-"),
                vals.get("n_points", "-"),
            ])
        t = Table(data)
        t.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#4B5563")),
            ("TEXTCOLOR", (0,0), (-1,0), colors.white),
            ("GRID", (0,0), (-1,-1), 0.5, colors.grey),
            ("BACKGROUND", (0,1), (-1,-1), colors.whitesmoke),
        ]))
        story.append(t)
        story.append(Spacer(1, 12))

    if chart_images:
        story.append(Paragraph("<b>Charts:</b>", styles["Heading3"]))
        story.append(Spacer(1, 12))
        for img_b64 in chart_images:
            try:
                img_data = base64.b64decode(img_b64)
                story.append(Image(BytesIO(img_data), width=400, height=250))
                story.append(Spacer(1, 12))
            except Exception as e:
                logger.warning(f"Failed to process chart image: {e}")

    if llm_conclusion:
        story.append(Paragraph("<b>AI Assistant Conclusion:</b>", styles["Heading3"]))
        story.append(Spacer(1, 6))
        story.append(Paragraph(llm_conclusion, styles["Normal"]))
        story.append(Spacer(1, 12))

    doc.build(story)
    buffer.seek(0)
    return buffer
