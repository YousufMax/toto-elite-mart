'use client';

import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Send,
  Image as ImageIcon,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Key,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';

export default function AdminIntegrationsPage() {
  const [sheetsData, setSheetsData] = useState<any>(null);
  const [sheetsLoading, setSheetsLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  // Telegram state
  const [telegramTesting, setTelegramTesting] = useState(false);
  const [telegramResult, setTelegramResult] = useState<any>(null);
  const [customBotToken, setCustomBotToken] = useState('');
  const [customChatId, setCustomChatId] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [outboxLogs, setOutboxLogs] = useState<any[]>([]);

  // Sheets config state
  const [inputSheetUrl, setInputSheetUrl] = useState('');
  const [extractedSheetId, setExtractedSheetId] = useState('');

  const fetchSheetsStatus = async () => {
    setSheetsLoading(true);
    try {
      const res = await fetch('/api/sync/google-sheets');
      const data = await res.json();
      setSheetsData(data);
      if (data.spreadsheetId && data.spreadsheetId !== 'Not set') {
        setExtractedSheetId(data.spreadsheetId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSheetsLoading(false);
    }
  };

  useEffect(() => {
    fetchSheetsStatus();
  }, []);

  const handleSyncGoogleSheets = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/sync/google-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncType: 'FULL' }),
      });
      const data = await res.json();
      setSyncResult(data);
      fetchSheetsStatus();
    } catch {
      setSyncResult({ success: false, error: 'Failed to initiate sync' });
    } finally {
      setSyncing(false);
    }
  };

  const handleTestTelegram = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setTelegramTesting(true);
    setTelegramResult(null);
    try {
      const res = await fetch('/api/notifications/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customToken: customBotToken.trim() || undefined,
          customChatId: customChatId.trim() || undefined,
        }),
      });
      const data = await res.json();
      setTelegramResult(data);
      if (data.outbox) {
        setOutboxLogs(data.outbox);
      }
    } catch {
      setTelegramResult({ success: false, error: 'Network error calling Telegram API' });
    } finally {
      setTelegramTesting(false);
    }
  };

  const handleSheetUrlChange = (val: string) => {
    setInputSheetUrl(val);
    // Auto-extract Google Sheets ID if user pasted full URL
    const match = val.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      setExtractedSheetId(match[1]);
    } else if (val.trim().length > 20 && !val.includes('/')) {
      setExtractedSheetId(val.trim());
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-950">Integrations, Google Sheets & Telegram</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage zero-recurring-cost enterprise integrations: Google Sheets sync, Telegram Bot alerts, and ImageKit CDN.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1. Google Sheets Integration */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Google Sheets API</h2>
                <span className="text-[11px] text-slate-400">Automated 2-Way Accounting & Reporting</span>
              </div>
            </div>

            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                sheetsData?.isConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {sheetsData?.isConfigured ? 'CONNECTED' : 'MOCK / READY TO CONNECT'}
            </span>
          </div>

          {/* Interactive Spreadsheet URL/ID Config */}
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Paste Google Spreadsheet URL or Sheet ID:
              </label>
              <input
                type="text"
                value={inputSheetUrl}
                onChange={(e) => handleSheetUrlChange(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5.../edit"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {extractedSheetId && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="space-y-0.5 truncate mr-2">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">Extracted Target Sheet ID</span>
                  <span className="font-mono text-slate-900 text-xs truncate block">{extractedSheetId}</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(extractedSheetId)}
                  className="p-1.5 hover:bg-emerald-200 rounded text-emerald-800 shrink-0"
                  title="Copy ID"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="space-y-2 text-slate-600 pt-1">
              {sheetsData?.webAppUrl && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-emerald-800">Connected Web App URL</span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(sheetsData.webAppUrl)}
                      className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copy URL
                    </button>
                  </div>
                  <div className="font-mono text-[11px] text-slate-800 break-all select-all">
                    {sheetsData.webAppUrl}
                  </div>
                </div>
              )}

              {sheetsData?.deploymentId && (
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="font-semibold text-slate-700">Deployment ID:</span>
                  <span className="font-mono text-slate-900 text-[11px] truncate max-w-[200px]">
                    {sheetsData.deploymentId}
                  </span>
                </div>
              )}

              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="font-semibold text-slate-700">Integration Mode:</span>
                <span className="font-bold text-emerald-700">
                  {sheetsData?.connectionTest?.type === 'WEB_APP' ? 'Google Apps Script Web App' : 'Direct API Service Account'}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="font-semibold text-slate-700">Synchronized Worksheets:</span>
                <span className="font-bold text-slate-900">Orders, Products, Expenses</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="font-semibold text-slate-700">Idempotency & Safety:</span>
                <span className="text-emerald-700 font-semibold">Enabled (Stable DB ID Upsert)</span>
              </div>
            </div>
          </div>

          {/* Sync Now Action */}
          <div className="pt-2 space-y-3">
            <button
              onClick={handleSyncGoogleSheets}
              disabled={syncing}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synchronizing Database Records...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Sync Now to Google Sheets</span>
                </>
              )}
            </button>

            {syncResult && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold ${
                  syncResult.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {syncResult.success ? (
                  <span>✅ Synced {syncResult.recordsSynced} records to Google Sheets successfully!</span>
                ) : (
                  <span>⚠️ {syncResult.error}</span>
                )}
              </div>
            )}
          </div>

          {/* Setup Guide */}
          <div className="bg-slate-50 p-4 rounded-2xl space-y-2 text-[11px] text-slate-600">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
              Setup Instructions:
            </div>
            <ol className="list-decimal list-inside space-y-1">
              <li>Create a service account in Google Cloud Console & enable Google Sheets API.</li>
              <li>Share your Google Spreadsheet with the service account email (Editor access).</li>
              <li>
                Put <code>GOOGLE_SHEETS_SPREADSHEET_ID</code>, <code>GOOGLE_SERVICE_ACCOUNT_EMAIL</code>, and{' '}
                <code>GOOGLE_PRIVATE_KEY</code> into <code>.env</code>.
              </li>
            </ol>
          </div>
        </div>

        {/* 2. Telegram Bot Integration */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Telegram Bot Notifications</h2>
                <span className="text-[11px] text-slate-400">Instant Admin Dispatch & Low-Stock Alerts</span>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
              OUTBOX ACTIVE
            </span>
          </div>

          {/* Interactive Bot Settings Form */}
          <form onSubmit={handleTestTelegram} className="space-y-3 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-slate-500" /> Telegram Bot Token:
                </label>
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-[11px]"
                >
                  {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showToken ? 'Mask Token' : 'Reveal Token'}</span>
                </button>
              </div>
              <input
                type={showToken ? 'text' : 'password'}
                value={customBotToken}
                onChange={(e) => setCustomBotToken(e.target.value)}
                placeholder="Paste Bot Token (or leave empty to use .env)"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-slate-500" /> Telegram Chat / Channel ID:
              </label>
              <input
                type="text"
                value={customChatId}
                onChange={(e) => setCustomChatId(e.target.value)}
                placeholder="e.g. -100123456789 or @channelname (or leave empty to use .env)"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="space-y-1.5 text-slate-600 pt-1">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="font-semibold text-slate-700">Notification Triggers:</span>
                <span className="font-bold text-slate-900">New Orders, Stock Limits, Cancellations</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="font-semibold text-slate-700">Outbox Queueing:</span>
                <span className="text-emerald-700 font-semibold">PostgreSQL Transaction-Backed</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="font-semibold text-slate-700">Automatic Retries:</span>
                <span className="font-semibold text-slate-900">Exponential Backoff (Up to 5 Attempts)</span>
              </div>
            </div>

            {/* Test Button */}
            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={telegramTesting}
                className="w-full py-3 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition"
              >
                {telegramTesting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Dispatching Test Message...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Test Notification to Telegram</span>
                  </>
                )}
              </button>

              {telegramResult && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold ${
                    telegramResult.success
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  {telegramResult.success ? (
                    <span>✅ Test notification delivered to your Telegram channel successfully!</span>
                  ) : (
                    <span>
                      ⚠️ {telegramResult.error} (Ensure valid TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID)
                    </span>
                  )}
                </div>
              )}
            </div>
          </form>

          {/* Setup Guide */}
          <div className="bg-slate-50 p-4 rounded-2xl space-y-2 text-[11px] text-slate-600">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
              Setup Instructions:
            </div>
            <ol className="list-decimal list-inside space-y-1">
              <li>Message <b>@BotFather</b> on Telegram to create a bot and get your token.</li>
              <li>Create an admin Telegram group, add your bot as Admin, and send <code>/start</code>.</li>
              <li>Get your Chat ID via <b>@userinfobot</b> and set <code>TELEGRAM_BOT_TOKEN</code> and <code>TELEGRAM_CHAT_ID</code>.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* 3. ImageKit Free CDN Configuration Box */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">ImageKit CDN (Free Plan Hosting)</h2>
            <p className="text-xs text-slate-500">
              Direct browser-to-CDN upload with server-side authentication signatures. Zero binary storage in PostgreSQL.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Monthly Free Quota</span>
            <div className="text-sm font-black text-slate-900">20 GB Bandwidth + 20 GB Storage</div>
            <p className="text-[11px] text-slate-500">Sufficient for 10,000+ optimized product photos</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Security Architecture</span>
            <div className="text-sm font-black text-slate-900">Private Key Kept Server-Side</div>
            <p className="text-[11px] text-slate-500">Short-lived 30-min auth signatures generated on demand</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">CDN URL Endpoint</span>
            <div className="text-sm font-mono font-bold text-slate-900 truncate">
              {process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/demo'}
            </div>
            <p className="text-[11px] text-slate-500">Automatic WebP/AVIF format optimization</p>
          </div>
        </div>
      </div>
    </div>
  );
}
