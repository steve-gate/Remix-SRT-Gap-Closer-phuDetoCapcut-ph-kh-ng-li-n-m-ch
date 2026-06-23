export interface SRTLine {
  id: number;
  startStr: string;
  endStr: string;
  startMs: number;
  endMs: number;
  text: string;
}

export function timeStrToMs(timeStr: string): number {
  const [h, m, s_ms] = timeStr.split(':');
  const [s, ms] = s_ms.split(',');
  return (
    parseInt(h) * 3600000 +
    parseInt(m) * 60000 +
    parseInt(s) * 1000 +
    parseInt(ms)
  );
}

export function msToTimeStr(ms: number): string {
  const h = Math.floor(ms / 3600000);
  ms = ms % 3600000;
  const m = Math.floor(ms / 60000);
  ms = ms % 60000;
  const s = Math.floor(ms / 1000);
  ms = Math.floor(ms % 1000); // ensure it's integer

  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

export function parseSRT(srt: string): SRTLine[] {
  const srtArray = srt.replace(/\r/g, '').split('\n');
  const result: SRTLine[] = [];
  let state = 0; // 0: expecting id, 1: expecting time, 2: expecting text
  let current: SRTLine = { id: 0, startStr: '', endStr: '', startMs: 0, endMs: 0, text: '' };

  for (let i = 0; i < srtArray.length; i++) {
    const line = srtArray[i].trim();

    if (state === 0) {
      if (line === '') continue;
      current.id = parseInt(line) || result.length + 1;
      state = 1;
    } else if (state === 1) {
      const timeMatch = line.match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
      if (timeMatch) {
        current.startStr = timeMatch[1];
        current.endStr = timeMatch[2];
        current.startMs = timeStrToMs(current.startStr);
        current.endMs = timeStrToMs(current.endStr);
        state = 2;
      } else {
        current.text += line + '\n';
      }
    } else if (state === 2) {
      if (line === '') {
        result.push({ ...current, text: current.text.trim() });
        current = { id: 0, startStr: '', endStr: '', startMs: 0, endMs: 0, text: '' };
        state = 0;
      } else {
        current.text += line + '\n';
      }
    }
  }
  
  if (state === 2 || current.text.trim() || current.startStr) {
    result.push({ ...current, text: current.text.trim() });
  }
  return result;
}

export function processSRTGaps(srt: string, maxGapMs: number): string {
  const srtLines = parseSRT(srt);
  
  for (let i = 0; i < srtLines.length - 1; i++) {
    const current = srtLines[i];
    const next = srtLines[i + 1];
    
    const gap = next.startMs - current.endMs;
    // Snap if there is a gap and it is within the allowed maximum limit.
    // Also support maxGapMs = -1 to mean 'snap all gaps regardless of length'.
    if (gap > 0 && (maxGapMs === -1 || gap <= maxGapMs)) {
      current.endMs = next.startMs;
      current.endStr = msToTimeStr(current.endMs);
    }
  }
  
  return srtLines.map(line => {
    return `${line.id}\n${line.startStr} --> ${line.endStr}\n${line.text}`;
  }).join('\n\n');
}
