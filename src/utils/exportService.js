import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportToCSV = (data, filename) => {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(obj => 
    Object.values(obj).map(val => {
      if (val === null || val === undefined) return '""';
      if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
      if (val instanceof Date) return `"${val.toISOString()}"`;
      // Check for Firestore Timestamp
      if (typeof val === 'object' && val.seconds) {
        return `"${new Date(val.seconds * 1000).toISOString()}"`;
      }
      return val;
    }).join(',')
  ).join('\n');
  const csvContent = "data:text/csv;charset=utf-8," + headers + '\n' + rows;
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = (data, columns, filename, title) => {
  if (!data || !data.length) return;
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  // Format data
  const formattedData = data.map(row => {
    return columns.map(col => {
      let val = row[col.dataKey];
      if (val === null || val === undefined) return '';
      if (val instanceof Date) return val.toLocaleDateString();
      if (typeof val === 'object' && val.seconds) return new Date(val.seconds * 1000).toLocaleDateString();
      return String(val);
    });
  });

  autoTable(doc, {
    startY: 30,
    head: [columns.map(col => col.header)],
    body: formattedData,
    theme: 'grid',
    headStyles: { fillColor: [0, 237, 100], textColor: [0, 30, 43] },
    styles: { fontSize: 10, cellPadding: 3 }
  });
  
  doc.save(`${filename}.pdf`);
};
