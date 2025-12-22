import React from "react";
import html2canvas from "html2canvas";

const DownloadReportButton = ({ token }) => {

  const downloadImage = async () => {
    // Fetch HTML report from backend
    const response = await fetch(
      "http://127.0.0.1:8000/api/stocks/trades/download_report/",
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const html = await response.text();

    // Create hidden iframe to render HTML
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.left = "-9999px";
    document.body.appendChild(iframe);

    iframe.contentDocument.open();
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();

    // Give browser some time to render
    setTimeout(async () => {
      const canvas = await html2canvas(
        iframe.contentDocument.body,
        {
          scale: 2,
          width: iframe.contentDocument.body.scrollWidth,
          height: iframe.contentDocument.body.scrollHeight,
          windowWidth: iframe.contentDocument.body.scrollWidth,
          windowHeight: iframe.contentDocument.body.scrollHeight,
        }
      );

      // Trigger download
      const link = document.createElement("a");
      link.download = "portfolio.png";
      link.href = canvas.toDataURL("image/png");
      link.click();

      document.body.removeChild(iframe);
    }, 500);
  };

  return (
    <button onClick={downloadImage}>
      Download Report
    </button>
  );
};

export default DownloadReportButton;
