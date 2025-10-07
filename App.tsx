
import React, { useState, useCallback } from 'react';
import { AnalysisResult } from './types';
import { analyzeVideoFrames } from './services/geminiService';
import { extractFramesFromVideo } from './utils/videoProcessor';
import UploadZone from './components/UploadZone';
import VideoPlayer from './components/VideoPlayer';
import AnalysisDisplay from './components/AnalysisDisplay';
import Header from './components/Header';
import Footer from './components/Footer';
import Tooltip from './components/Tooltip';
import { InfoIcon } from './components/icons';

const App: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [frameCount, setFrameCount] = useState<number>(15);
  const [extractionProgress, setExtractionProgress] = useState<number>(0);


  const handleFileUpload = (file: File) => {
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setAnalysisResult(null);
      setError(null);
    } else {
      setError('Please upload a valid video file.');
    }
  };

  const handleAnalyze = useCallback(async () => {
    if (!videoFile) {
      setError('No video file selected.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setExtractionProgress(0);

    try {
      setLoadingMessage('Extracting key frames from video...');
      const frames = await extractFramesFromVideo(
        videoFile,
        frameCount,
        (progress) => setExtractionProgress(progress)
      );

      if(frames.length === 0){
        throw new Error("Could not extract any frames from the video. The file might be corrupted or in an unsupported format.");
      }

      setLoadingMessage('Sending frames to Gemini for analysis...');
      const result = await analyzeVideoFrames(frames);
      setAnalysisResult(result);

    } catch (err) {
      console.error('Analysis failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during analysis.';
      setError(`Analysis Failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [videoFile, frameCount]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col font-sans">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col space-y-6">
            <UploadZone onFileUpload={handleFileUpload} isLoading={isLoading} />
            {videoUrl && <VideoPlayer videoUrl={videoUrl} />}
            {videoFile && (
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <label htmlFor="frameCountSlider" className="block mb-2 text-sm font-medium text-gray-300 flex items-center">
                  <span>Number of frames to analyze: <span className="font-bold text-blue-400">{frameCount}</span></span>
                   <Tooltip content="A higher number of frames might provide more detailed analysis but will take longer to process.">
                     <InfoIcon className="ml-2 h-4 w-4 text-gray-400 hover:text-blue-300 cursor-help" />
                   </Tooltip>
                </label>
                <input
                  id="frameCountSlider"
                  type="range"
                  min="5"
                  max="50"
                  step="1"
                  value={frameCount}
                  onChange={(e) => setFrameCount(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  disabled={isLoading}
                />
              </div>
            )}
            {videoFile && !isLoading && (
              <button
                onClick={handleAnalyze}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:transform-none"
                disabled={isLoading}
              >
                Analyze Video Content
              </button>
            )}
          </div>
          <div className="bg-gray-800/50 rounded-lg p-6 shadow-2xl backdrop-blur-sm border border-gray-700">
            <AnalysisDisplay
              analysis={analysisResult}
              isLoading={isLoading}
              loadingMessage={loadingMessage}
              error={error}
              hasVideo={!!videoFile}
              extractionProgress={extractionProgress}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;
