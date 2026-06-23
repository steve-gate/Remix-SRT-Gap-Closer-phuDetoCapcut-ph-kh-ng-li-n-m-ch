import React, { useState, useEffect } from 'react';
import { ArrowRight, Copy, Check, Download, AlertCircle, Settings2, Upload } from 'lucide-react';
import { processSRTGaps } from './utils/srt';

export default function App() {
  const [inputSrt, setInputSrt] = useState<string>('');
  const [outputSrt, setOutputSrt] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [maxGapStr, setMaxGapStr] = useState<string>('all'); // 'all' or number in ms

  useEffect(() => {
    if (!inputSrt.trim()) {
      setOutputSrt('');
      return;
    }
    try {
      const maxGapMs = maxGapStr === 'all' ? -1 : parseInt(maxGapStr, 10);
      const processed = processSRTGaps(inputSrt, isNaN(maxGapMs) ? -1 : maxGapMs);
      setOutputSrt(processed);
    } catch (e) {
      // Avoid breaking if parsing mid-typing
    }
  }, [inputSrt, maxGapStr]);

  const handleCopy = async () => {
    if (!outputSrt) return;
    try {
      await navigator.clipboard.writeText(outputSrt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const handleDownload = () => {
    if (!outputSrt) return;
    const blob = new Blob([outputSrt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'adjusted_subtitles.srt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setInputSrt(content);
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  // Sample data to test / demonstrate
  const handleLoadSample = () => {
    setInputSrt(`1\n00:00:00,000 --> 00:00:00,866\nbạn cảm thấy một cơn\n\n2\n00:00:00,900 --> 00:00:03,066\nđau nhói thấu xương truyền từ hàm lên tận óc`);
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">SRT Gap Closer</h1>
            <p className="text-neutral-500 mt-1 text-sm">Seamlessly connect subtitles by snapping end times to the next start time.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-neutral-200 shadow-sm text-sm">
              <Settings2 className="w-4 h-4 text-neutral-400" />
              <label htmlFor="maxGap" className="font-medium text-neutral-700">Max Gap to Snap:</label>
              <select 
                id="maxGap"
                value={maxGapStr}
                onChange={(e) => setMaxGapStr(e.target.value)}
                className="bg-transparent border-none outline-none font-mono text-neutral-900 cursor-pointer"
              >
                <option value="all">Any gap (Snap All)</option>
                <option value="500">500 ms</option>
                <option value="1000">1000 ms</option>
                <option value="2000">2000 ms</option>
              </select>
            </div>
            <button 
              onClick={handleLoadSample}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Load Example
            </button>
          </div>
        </header>

        {/* Work Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch min-h-[600px]">
          
          {/* Input Panel */}
          <div className="flex flex-col h-full bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 bg-neutral-50/50">
              <h2 className="text-sm font-medium text-neutral-700">Original Subtitles (.srt)</h2>
              <label className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 bg-white border border-neutral-200 hover:bg-neutral-50 px-2.5 py-1 rounded cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-blue-500">
                <Upload className="w-3.5 h-3.5" />
                Upload File
                <input
                  type="file"
                  accept=".srt"
                  className="sr-only"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
            <textarea
              value={inputSrt}
              onChange={(e) => setInputSrt(e.target.value)}
              placeholder="Paste your original SRT content here..."
              className="flex-1 w-full p-4 resize-none outline-none font-mono text-sm leading-relaxed text-neutral-800"
              spellCheck="false"
            />
          </div>

          {/* Output Panel */}
          <div className="flex flex-col h-full bg-neutral-900 rounded-xl border border-neutral-800 shadow-sm overflow-hidden relative">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-900/50">
              <h2 className="text-sm font-medium text-neutral-300">Processed Subtitles</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  disabled={!outputSrt}
                  className="flex items-center gap-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2.5 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                  onClick={handleDownload}
                  disabled={!outputSrt}
                  className="flex items-center gap-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              </div>
            </div>
            
            {!outputSrt && !inputSrt.trim() ? (
              <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 p-6 text-center">
                <ArrowRight className="w-8 h-8 mb-3 opacity-20" />
                <p className="text-sm">Processed output will appear here automatically.</p>
              </div>
            ) : (
              <textarea
                value={outputSrt}
                readOnly
                className="flex-1 w-full p-4 resize-none outline-none font-mono text-sm leading-relaxed text-neutral-300 bg-transparent"
                spellCheck="false"
              />
            )}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 text-blue-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-blue-600" />
          <p>
            <strong>How it works:</strong> The tool automatically finds gaps between subtitles and extends the end time of the current subtitle exactly up to the start time of the next subtitle. This eliminates black flashes between sequential dialogues.
          </p>
        </div>
      </div>
    </div>
  );
}
