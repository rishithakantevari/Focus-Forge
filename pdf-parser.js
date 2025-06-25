// Dark Mode Toggle
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('theme-toggle');
  const body = document.body;

  // Load saved theme or use system preference
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);

  body.classList.toggle('dark', isDark);
  if (toggle) toggle.checked = isDark;

  // Toggle handler
  if (toggle) {
    toggle.addEventListener('change', () => {
      const isDarkNow = toggle.checked;
      body.classList.toggle('dark', isDarkNow);
      localStorage.setItem('theme', isDarkNow ? 'dark' : 'light');
    });
  }
});


// PDF Processing
pdfjsLib.GlobalWorkerOptions.workerSrc = 
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';

const downloadBtn = document.getElementById('download-btn');

document.getElementById('pdf-upload').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Reset UI
  document.getElementById('file-name').textContent = `Selected: ${file.name}`;
  document.getElementById('summary-text').textContent = '';
  downloadBtn.classList.add('hidden');
  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('summary-text').classList.remove('error');

  try {
    const text = await extractTextFromPDF(file);
    const summary = summarizeText(text);
    document.getElementById('summary-text').textContent = summary;
    downloadBtn.classList.remove('hidden');
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('summary-text').textContent = 
      'Error: Failed to process PDF. Please try another file.';
    document.getElementById('summary-text').classList.add('error');
  } finally {
    document.getElementById('loading').classList.add('hidden');
  }
});

// Download Button
downloadBtn.addEventListener('click', () => {
  const summary = document.getElementById('summary-text').textContent;
  if (!summary || summary === 'Upload a PDF to generate summary.') return;
  
  const filename = document.getElementById('file-name').textContent
    .replace('Selected: ', '')
    .replace('.pdf', '_summary.txt');
  
  const blob = new Blob([summary], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'summary.txt';
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
});

// PDF Text Extraction
async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    fullText += textContent.items.map(item => item.str).join(' ');
  }

  return fullText;
}

// Text Summarization
function summarizeText(text, maxSentences = 3) {
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.trim().length > 20);

  const selected = sentences.slice(0, maxSentences);
  return selected
    .map(s => s.trim())
    .join('\n\n') + (sentences.length > maxSentences ? '...' : '');
}



