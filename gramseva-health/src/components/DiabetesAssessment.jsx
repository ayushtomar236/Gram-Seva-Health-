import React, { useState } from 'react';

const assessmentFlow = {
  intro: {
    message: "Hi! Let's assess your risk for diabetes. To start, do you have a family history of diabetes?",
    options: [
      { label: "Yes", nextNode: "diet" },
      { label: "No", nextNode: "diet" },
      { label: "Not sure", nextNode: "diet" }
    ]
  },
  diet: {
    message: "Got it. A nutritious diet is key. How often do you consume high-sugar foods?",
    options: [
      { label: "Daily", nextNode: "exercise" },
      { label: "Rarely", nextNode: "exercise" }
    ]
  },
  exercise: {
    message: "Lastly, how many days a week do you engage in physical activity (30+ mins)?",
    options: [
      { label: "0-2 Days", nextNode: "result" },
      { label: "3+ Days", nextNode: "result" }
    ]
  }
};

export default function DiabetesAssessment() {
  const [currentNode, setCurrentNode] = useState('intro');
  const [history, setHistory] = useState([]);
  const [answers, setAnswers] = useState({});

  const handleOptionSelect = (optionLabel, nextNode) => {
    // Save user answer
    setAnswers(prev => ({ ...prev, [currentNode]: optionLabel }));
    
    // Add current question & user answer to chat history
    setHistory(prev => [
      ...prev, 
      { type: 'bot', text: assessmentFlow[currentNode].message },
      { type: 'user', text: optionLabel }
    ]);

    // Move to next step or submit
    if (nextNode === 'result') {
      submitAssessment();
    } else {
      setCurrentNode(nextNode);
    }
  };

  const submitAssessment = () => {
    // API Call to submit 'answers' object
    setCurrentNode('completed');
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto h-[400px] border border-gray-100 rounded-3xl shadow-sm bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-teal-600 text-white p-4 font-bold text-sm shadow-sm flex items-center justify-between">
        <span>Self-Check for Diabetes</span>
        <span className="bg-teal-700 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider">AI Bot</span>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 scrollbar-hide">
        {history.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 text-sm rounded-2xl max-w-[85%] ${msg.type === 'user' ? 'bg-teal-500 text-white rounded-br-none shadow-sm' : 'bg-white border border-gray-100 rounded-bl-none shadow-sm text-gray-700'}`}>
              {msg.text}
            </div>
          </div>
        ))}

        {/* Current Active Question */}
        {currentNode !== 'completed' && (
          <div className="flex justify-start animate-fade-in-up">
            <div className="p-3 bg-white border border-gray-100 rounded-2xl rounded-bl-none shadow-sm max-w-[90%] w-full">
              <p className="mb-3 text-sm text-gray-700 leading-relaxed font-medium">{assessmentFlow[currentNode].message}</p>
              <div className="flex flex-wrap gap-2">
                {assessmentFlow[currentNode].options.map((opt, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleOptionSelect(opt.label, opt.nextNode)}
                    className="px-4 py-2 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-100 rounded-xl transition-colors shadow-sm"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Completion State */}
        {currentNode === 'completed' && (
          <div className="text-center p-5 bg-emerald-50 rounded-2xl border border-emerald-100 mt-2">
            <h3 className="text-emerald-800 font-black mb-1 text-sm uppercase tracking-widest">Assessment Complete</h3>
            <p className="text-emerald-600/80 text-xs font-bold leading-relaxed">
              We are analyzing your results. A doctor will review this shortly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
