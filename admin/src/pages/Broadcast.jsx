import React, { useState, useEffect } from 'react';
import { Send, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

const PARSE_MODES = [
  { value: '', label: 'Oddiy matn' },
  { value: 'HTML', label: 'HTML' },
  { value: 'Markdown', label: 'Markdown' },
];

function formatDate(isoString) {
  if (!isoString) return '—';
  try {
    return new Date(isoString).toLocaleString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

function MessagePreview({ message, parseMode }) {
  if (!message.trim()) {
    return (
      <p className="text-gray-600 text-sm italic">
        Xabar yozing — bu yerda ko'rinadi
      </p>
    );
  }

  if (parseMode === 'HTML') {
    return (
      <div
        className="text-gray-200 text-sm leading-relaxed break-words"
        dangerouslySetInnerHTML={{ __html: message }}
      />
    );
  }

  if (parseMode === 'Markdown') {
    // Basic markdown preview
    const html = message
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      .replace(/_(.+?)_/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code class="bg-gray-700 px-1 rounded text-xs font-mono">$1</code>')
      .replace(/\n/g, '<br>');
    return (
      <div
        className="text-gray-200 text-sm leading-relaxed break-words"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap break-words">
      {message}
    </p>
  );
}

export default function Broadcast() {
  const [message, setMessage] = useState('');
  const [parseMode, setParseMode] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);

  async function fetchHistory() {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch('/api/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // Get more broadcasts via separate call isn't available — use stats endpoint
        // which returns last 5; we'll just show those
        setHistory(data.recentBroadcasts || []);
      }
    } catch {
      // ignore
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    fetchHistory();
  }, []);

  async function handleSend() {
    if (!message.trim()) return;
    setShowConfirm(false);
    setSending(true);
    setResult(null);
    setError('');

    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch('/api/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: message.trim(), parseMode }),
      });

      if (res.status === 401) {
        localStorage.removeItem('admin_token');
        window.location.href = '/login';
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server xatosi');

      setResult(data);
      setMessage('');
      fetchHistory();
    } catch (err) {
      setError(err.message || 'Xato yuz berdi');
    } finally {
      setSending(false);
    }
  }

  const charCount = message.length;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-white text-2xl font-bold">Broadcast</h1>
        <p className="text-gray-500 text-sm mt-0.5">Barcha foydalanuvchilarga xabar yuborish</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Compose panel */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-semibold text-sm">Xabar yozing</h2>

          {/* Parse mode */}
          <div>
            <label className="block text-gray-400 text-xs mb-2 uppercase tracking-wide font-medium">
              Format
            </label>
            <div className="flex gap-2">
              {PARSE_MODES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setParseMode(value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    parseMode === value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <div>
            <label className="block text-gray-400 text-xs mb-2 uppercase tracking-wide font-medium">
              Xabar matni
            </label>
            <textarea
              rows={8}
              value={message}
              onChange={(e) => { setMessage(e.target.value); setResult(null); setError(''); }}
              placeholder={
                parseMode === 'HTML'
                  ? 'HTML ishlatishingiz mumkin:\n<b>qalin</b>, <i>kursiv</i>,\n<code>kod</code>, <a href="...">havola</a>'
                  : parseMode === 'Markdown'
                  ? 'Markdown ishlatishingiz mumkin:\n**qalin**, *kursiv*,\n`kod`, [havola](url)'
                  : 'Xabar matnini kiriting...'
              }
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:border-indigo-500 transition-colors placeholder-gray-600 font-mono"
            />
            <p className="text-gray-600 text-xs mt-1 text-right">{charCount} belgi</p>
          </div>

          {/* Result / Error */}
          {result && (
            <div className="bg-green-900/30 border border-green-800 rounded-lg px-4 py-3 space-y-1">
              <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                <CheckCircle size={15} />
                Broadcast yakunlandi
              </div>
              <div className="text-xs text-gray-400 space-y-0.5">
                <p>Jami: <span className="text-white">{result.total}</span></p>
                <p>
                  <span className="text-green-400">✓ {result.success} yuborildi</span>
                  {result.failed > 0 && (
                    <span className="text-red-400 ml-3">✗ {result.failed} xato</span>
                  )}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-900/30 border border-red-800 rounded-lg px-4 py-3 flex items-start gap-2">
              <AlertTriangle size={15} className="text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Send button */}
          <button
            onClick={() => setShowConfirm(true)}
            disabled={!message.trim() || sending}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
          >
            {sending ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Yuborilmoqda...
              </>
            ) : (
              <>
                <Send size={15} />
                Yuborish
              </>
            )}
          </button>
        </div>

        {/* Preview panel */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-white font-semibold text-sm mb-4">Ko'rinish (Preview)</h2>
          <div className="bg-gray-800 rounded-xl p-4 min-h-32">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-700">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                🏐
              </div>
              <div>
                <p className="text-white text-xs font-semibold">Volleyball Bot</p>
                <p className="text-gray-500 text-xs">Telegram Bot</p>
              </div>
            </div>
            <div className="bg-gray-700 rounded-2xl rounded-tl-sm px-3 py-2 inline-block max-w-full">
              <MessagePreview message={message} parseMode={parseMode} />
            </div>
          </div>

          <div className="mt-4 text-xs text-gray-600 space-y-1">
            {parseMode === 'HTML' && (
              <p>HTML teglar: &lt;b&gt;, &lt;i&gt;, &lt;code&gt;, &lt;pre&gt;, &lt;a href&gt;</p>
            )}
            {parseMode === 'Markdown' && (
              <p>Markdown: **qalin**, *kursiv*, `kod`, [matn](url)</p>
            )}
            {!parseMode && <p>Oddiy matn — formatlash yo'q</p>}
          </div>
        </div>
      </div>

      {/* Broadcast history */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-800">
          <Clock size={15} className="text-gray-400" />
          <h2 className="text-white font-semibold text-sm">Broadcast tarixi</h2>
        </div>

        {historyLoading ? (
          <div className="px-6 py-8 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : !history.length ? (
          <div className="px-6 py-10 text-center text-gray-600 text-sm">
            Hali broadcast yuborilmagan
          </div>
        ) : (
          <div className="divide-y divide-gray-800/50">
            {history.map((b, i) => (
              <div key={i} className="px-6 py-4 hover:bg-gray-800/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-gray-300 text-sm truncate">
                      {b.message?.slice(0, 80)}{b.message?.length > 80 ? '…' : ''}
                    </p>
                    <p className="text-gray-600 text-xs mt-0.5">{formatDate(b.sentAt)}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs flex-shrink-0">
                    <span className="text-green-400 flex items-center gap-1">
                      <CheckCircle size={12} />
                      {b.success}
                    </span>
                    {b.failed > 0 && (
                      <span className="text-red-400 flex items-center gap-1">
                        <XCircle size={12} />
                        {b.failed}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <AlertTriangle size={20} className="text-orange-400" />
              </div>
              <h3 className="text-white font-semibold">Tasdiqlang</h3>
            </div>
            <p className="text-gray-400 text-sm mb-2">
              Bu xabar barcha foydalanuvchilarga yuboriladi:
            </p>
            <div className="bg-gray-800 rounded-lg px-3 py-2 mb-5">
              <p className="text-gray-300 text-sm line-clamp-3">
                {message.slice(0, 120)}{message.length > 120 ? '…' : ''}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSend}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Ha, yuborish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
