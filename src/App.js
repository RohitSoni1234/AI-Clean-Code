import React, { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function App() {
  const [originalCode, setOriginalCode] = useState("");
  const [cleanedCode, setCleanedCode] = useState("");
  const [explanation, setExplanation] = useState("");
  const [language, setLanguage] = useState("text");
  const [loading, setLoading] = useState(false);

  // Detect language from extension
  const detectLanguage = (fileName) => {
    const ext = fileName.split(".").pop();
    const map = {
      py: "python",
      cpp: "cpp",
      c: "c",
      java: "java",
      js: "javascript",
      html: "html",
      css: "css",
      json: "json",
      xml: "xml",
    };
    return map[ext] || "text";
  };

  // Handle File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLanguage(detectLanguage(file.name));
      const reader = new FileReader();
      reader.onload = (ev) => setOriginalCode(ev.target.result);
      reader.readAsText(file);
    }
  };

  // Call Gemini API for cleaning
  const cleanCode = async () => {
    if (!originalCode) return alert("Upload a file first!");
    setLoading(true);
    try {
      const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `
        Please clean, format, and optimize the following ${language} code. Focus on readability, best practices, and minor efficiency improvements.
        IMPORTANT: Return ONLY the cleaned code as raw text — no markdown or explanations.
        Code:
        ${originalCode}
      `;
      const result = await model.generateContent(prompt);
      setCleanedCode(result.response.text().trim());
    } catch (err) {
      console.error(err);
      alert("Error calling Gemini API. Check console.");
    }
    setLoading(false);
  };

  // Call Gemini API for explanation
  const explainCode = async () => {
    if (!cleanedCode) return alert("Clean the code first!");
    setLoading(true);
    try {
      const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const explainPrompt = `
        Please explain the following ${language} code in Markdown.
        Use clear sections with headings and bullet points:
        1. Overall Goal
        2. Key Components/Functions
        3. Step-by-Step Logic
        4. Conclusion
        Code:
        ${cleanedCode}
      `;
      const result = await model.generateContent(explainPrompt);
      setExplanation(result.response.text());
    } catch (err) {
      console.error(err);
      alert("Error getting explanation.");
    }
    setLoading(false);
  };

  // Download cleaned code
  const downloadFile = () => {
    const blob = new Blob([cleanedCode], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "cleaned_code.txt";
    link.click();
  };

  return (
    <div className="p-6 font-sans text-white">
      <h1 className="text-2xl font-bold mb-4">Clean Code AI Assistant</h1>

      <input type="file" onChange={handleFileUpload} className="mb-4" />

      {originalCode && (
        <button
          onClick={cleanCode}
          className="px-4 py-2 bg-blue-600 text-white rounded mr-2"
        >
          {loading ? "Cleaning..." : "Clean Code"}
        </button>
      )}

      {cleanedCode && (
        <>
          <button
            onClick={downloadFile}
            className="px-4 py-2 bg-green-600 text-white rounded mr-2"
          >
            Download
          </button>
          <button
            onClick={explainCode}
            className="px-4 py-2 bg-purple-600 text-white rounded"
          >
            Explain
          </button>
        </>
      )}

      {/* Side-by-side view */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div>
          <h2 className="font-semibold mb-2">Original Code</h2>
          <pre className="bg-gray-100 text-black p-2 rounded overflow-x-auto h-80">
            {originalCode}
          </pre>
        </div>
        <div>
          <h2 className="font-semibold mb-2">Cleaned Code</h2>
          <pre className="bg-green-100 text-black p-2 rounded overflow-x-auto h-80">
            {cleanedCode}
          </pre>
        </div>
      </div>

      {/* Markdown Explanation */}
      {explanation && (
        <div className="mt-6">
          <h2 className="font-semibold mb-2 text-xl text-white">Code Explanation</h2>
          <div className="bg-white text-black p-4 rounded-lg shadow-md prose max-w-none overflow-y-auto max-h-[500px]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {explanation}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
