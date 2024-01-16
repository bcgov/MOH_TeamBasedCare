export class FileDownload {
  public static download(buffer: Buffer, fileType: string, fileName: string) {
    // create blob
    const blob = new Blob([buffer], { type: fileType });

    // Create url for link
    const url = window.URL.createObjectURL(blob);

    // create link to download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';

    // Append to html link element page
    document.body.appendChild(link);

    // Start download
    link.click();

    // Clean up and remove the link
    link.parentNode?.removeChild(link);
  }
}
