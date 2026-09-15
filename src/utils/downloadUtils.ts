/**
 * Trigger browser file download from string content
 */
export function triggerFileDownload(filename: string, content: string, mimeType: string = 'text/csv;charset=utf-8;'): void {
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('File download failed:', err);
  }
}
