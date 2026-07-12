import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ollama Setup Guide | Drasa AI',
  description: 'Learn how to set up and use local Ollama models with Drasa AI for a completely private, offline-capable AI experience.',
};

export default function OllamaSetupPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-20 px-4 md:px-8">
      <div className="max-w-3xl mx-auto space-y-12">
        
        <div className="space-y-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Ollama Setup Guide</h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Run AI models locally on your machine for absolute privacy. Follow these steps to connect your local models to Drasa AI.
          </p>
        </div>

        <div className="space-y-10">
          
          {/* Step 1 */}
          <section className="space-y-4 bg-[#111] p-6 md:p-8 rounded-2xl border border-white/5">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-black font-bold">1</div>
              <h2 className="text-2xl font-semibold">Download and Install Ollama</h2>
            </div>
            <p className="text-zinc-400 pl-12">
              First, you need to install the Ollama application on your local machine.
            </p>
            <ul className="list-disc pl-16 text-zinc-300 space-y-2">
              <li>Go to the official website: <a href="https://ollama.com/download" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">ollama.com/download</a></li>
              <li>Download the installer for your operating system (Windows, Mac, or Linux).</li>
              <li>Run the installer and complete the setup.</li>
            </ul>
          </section>

          {/* Step 2 */}
          <section className="space-y-4 bg-[#111] p-6 md:p-8 rounded-2xl border border-white/5">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-black font-bold">2</div>
              <h2 className="text-2xl font-semibold">Download (Pull) a Model</h2>
            </div>
            <p className="text-zinc-400 pl-12">
              Ollama comes empty by default. You need to download the models you want to use.
              Open your <strong>Command Prompt</strong> (Windows) or <strong>Terminal</strong> (Mac/Linux) and run:
            </p>
            <div className="pl-12">
              <div className="bg-black p-4 rounded-lg font-mono text-sm border border-white/10 text-green-400 overflow-x-auto">
                ollama run qwen2.5:0.5b
              </div>
            </div>
            <p className="text-sm text-zinc-500 pl-12">
              (You can replace <code>qwen2.5:0.5b</code> with any other model from the <a href="https://ollama.com/library" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Ollama Library</a>, such as <code>llama3</code>, <code>mistral</code>, or <code>phi3</code>. Smaller models like <code>qwen2.5:0.5b</code> or <code>phi3</code> are great for laptops, while <code>llama3</code> requires a bit more RAM).
            </p>
            <p className="text-zinc-400 pl-12">
              Once the model downloads, you will see a chat prompt in your terminal. You can type <code>/bye</code> to exit the terminal chat. The model is now saved on your machine!
            </p>
          </section>

          {/* Step 3 */}
          <section className="space-y-4 bg-[#111] p-6 md:p-8 rounded-2xl border border-white/5">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-black font-bold">3</div>
              <h2 className="text-2xl font-semibold">Configure CORS (Crucial for Web)</h2>
            </div>
            <p className="text-zinc-400 pl-12">
              By default, Ollama only allows connections from <code>localhost</code>. To allow the Drasa AI website to connect to your local models, you must set an environment variable before starting Ollama:
            </p>
            
            <div className="pl-12 space-y-4">
              <div>
                <h3 className="text-white font-medium mb-2">For Windows (Command Prompt):</h3>
                <div className="bg-black p-4 rounded-lg font-mono text-sm border border-white/10 text-green-400 overflow-x-auto">
                  set OLLAMA_ORIGINS="https://drasaai.ajaykeshri.com"<br/>
                  ollama serve
                </div>
              </div>
              
              <div>
                <h3 className="text-white font-medium mb-2">For Windows (PowerShell):</h3>
                <div className="bg-black p-4 rounded-lg font-mono text-sm border border-white/10 text-green-400 overflow-x-auto">
                  $env:OLLAMA_ORIGINS="https://drasaai.ajaykeshri.com"<br/>
                  ollama serve
                </div>
              </div>

              <div>
                <h3 className="text-white font-medium mb-2">For Mac/Linux (Terminal):</h3>
                <div className="bg-black p-4 rounded-lg font-mono text-sm border border-white/10 text-green-400 overflow-x-auto">
                  OLLAMA_ORIGINS="https://drasaai.ajaykeshri.com" ollama serve
                </div>
              </div>
            </div>

            <div className="pl-12 mt-4">
              <div className="bg-blue-950/30 border border-blue-900/50 p-4 rounded-lg flex gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <h4 className="text-blue-400 font-semibold mb-1">Important</h4>
                  <p className="text-blue-200/80 text-sm">
                    Keep this terminal window open! As long as this terminal is running <code>ollama serve</code>, your deployed website will be able to talk to your local models.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Step 4 */}
          <section className="space-y-4 bg-[#111] p-6 md:p-8 rounded-2xl border border-white/5">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-black font-bold">4</div>
              <h2 className="text-2xl font-semibold">Use it on Drasa AI!</h2>
            </div>
            <ul className="list-decimal pl-16 text-zinc-300 space-y-2">
              <li>Make sure you are on the same laptop/computer where Ollama is running.</li>
              <li>Refresh the Drasa AI chat page.</li>
              <li>Click on the model selector dropdown in the chat interface.</li>
              <li>You should now see <strong>OLLAMA</strong> and the specific models you downloaded.</li>
              <li>Select your local model and start chatting securely!</li>
            </ul>
          </section>

          {/* Tips */}
          <section className="mt-8 p-6 bg-zinc-900/50 rounded-2xl border border-white/5">
            <h3 className="text-xl font-semibold mb-4 text-white">💡 Pro Tips</h3>
            <ul className="space-y-4 text-zinc-400">
              <li className="flex gap-3">
                <span className="text-xl">🔒</span>
                <div>
                  <strong className="text-white block">Absolute Privacy</strong>
                  When you use an Ollama model, your chat data never leaves your laptop. It is processed 100% locally.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-xl">🔌</span>
                <div>
                  <strong className="text-white block">Offline Mode</strong>
                  Even without an internet connection, if you have Drasa AI running locally too, you can use Ollama completely offline.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-xl">🛑</span>
                <div>
                  <strong className="text-white block">Stop Ollama</strong>
                  When you are done, you can stop the server by simply closing the terminal window where <code>ollama serve</code> is running, or pressing <code>Ctrl + C</code>.
                </div>
              </li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
}
