'use client';

import { useState } from 'react';

export default function PhotoOrganizerPage() {
    const [inputDir, setInputDir] = useState('');
    const [logContent, setLogContent] = useState('');
    const [dryRun, setDryRun] = useState(true);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleOrganize = async () => {
        setLoading(true);
        setResult(null);

        try {
            const response = await fetch('/api/organize-photos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inputDir, logContent, dryRun }),
            });

            const data = await response.json();
            setResult(data);
        } catch (error) {
            setResult({ success: false, message: 'An unexpected error occurred.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-900">
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
                <h1 className="text-3xl font-bold mb-6 text-gray-800">📸 Photo Organizer</h1>

                <div className="space-y-6">
                    {/* Input Directory */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Photo Folder Path (Absolute Path)
                        </label>
                        <input
                            type="text"
                            value={inputDir}
                            onChange={(e) => setInputDir(e.target.value)}
                            placeholder="/Users/username/Desktop/20241205_Photos"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Tip: Drag and drop the folder into the terminal to get the path, then paste it here.
                        </p>
                    </div>

                    {/* Log Content */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Shooting Log (Markdown)
                        </label>
                        <textarea
                            value={logContent}
                            onChange={(e) => setLogContent(e.target.value)}
                            placeholder={`# Event Name\n\n| Start | End | Scene |\n| :--- | :--- | :--- |\n| 13:00 | 13:30 | Reception |`}
                            className="w-full h-48 p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        />
                    </div>

                    {/* Options */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="dryRun"
                            checked={dryRun}
                            onChange={(e) => setDryRun(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <label htmlFor="dryRun" className="text-sm text-gray-700">
                            Dry Run (Test without moving files)
                        </label>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={handleOrganize}
                        disabled={loading || !inputDir || !logContent}
                        className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-colors ${loading || !inputDir || !logContent
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        {loading ? 'Processing...' : 'Start Organization'}
                    </button>

                    {/* Results */}
                    {result && (
                        <div className={`mt-8 p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                            <h3 className={`font-bold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                                {result.success ? 'Success!' : 'Error'}
                            </h3>
                            <p className="text-sm mt-1 mb-3 text-gray-700">{result.message}</p>

                            {result.processedFiles && result.processedFiles.length > 0 && (
                                <div className="bg-white p-3 rounded border border-gray-200 max-h-60 overflow-y-auto font-mono text-xs">
                                    {result.processedFiles.map((line: string, i: number) => (
                                        <div key={i} className="truncate">{line}</div>
                                    ))}
                                </div>
                            )}

                            {result.errors && result.errors.length > 0 && (
                                <div className="mt-3 bg-red-100 p-3 rounded border border-red-200 max-h-40 overflow-y-auto font-mono text-xs text-red-700">
                                    {result.errors.map((line: string, i: number) => (
                                        <div key={i}>{line}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
