/**
 * useSpeech.js — Voice Input (STT) + Voice Output (TTS) hook
 *
 * Uses the browser's built-in Web Speech API:
 *   - SpeechRecognition for voice-to-text (Hindi + English)
 *   - SpeechSynthesis for text-to-speech (reads diagnosis aloud)
 *
 * Works in Chrome, Edge, Safari. Firefox has limited support.
 */

import { useState, useRef, useCallback, useEffect } from 'react';

// ── Speech-to-Text (Voice Input) ──────────────────────────────────────────

export function useSpeechToText(lang = 'en') {
    const [transcript, setTranscript] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState(null);
    const recognitionRef = useRef(null);

    const langCode = lang === 'hi' ? 'hi-IN' : 'en-IN';

    const startListening = useCallback(() => {
        setError(null);

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError('Voice input not supported in this browser. Use Chrome or Edge.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = langCode;
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);

        recognition.onresult = (event) => {
            let result = '';
            for (let i = 0; i < event.results.length; i++) {
                result += event.results[i][0].transcript;
            }
            setTranscript(result);
        };

        recognition.onerror = (event) => {
            setIsListening(false);
            if (event.error === 'not-allowed') {
                setError(lang === 'hi'
                    ? 'माइक्रोफोन की अनुमति दें'
                    : 'Please allow microphone permission');
            } else if (event.error === 'no-speech') {
                setError(lang === 'hi'
                    ? 'कोई आवाज़ नहीं सुनाई दी। फिर से बोलें।'
                    : 'No speech detected. Please try again.');
            } else {
                setError(`Voice error: ${event.error}`);
            }
        };

        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
        recognition.start();
    }, [langCode, lang]);

    const stopListening = useCallback(() => {
        recognitionRef.current?.stop();
        setIsListening(false);
    }, []);

    const resetTranscript = useCallback(() => {
        setTranscript('');
    }, []);

    return { transcript, isListening, error, startListening, stopListening, resetTranscript };
}


// ── Text-to-Speech (Voice Output) ─────────────────────────────────────────

export function useTextToSpeech(lang = 'en') {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const utteranceRef = useRef(null);

    const langCode = lang === 'hi' ? 'hi-IN' : 'en-IN';

    const speak = useCallback((text) => {
        if (!text || !window.speechSynthesis) return;

        // Stop any current speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = langCode;
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        // Try to find the best voice for the language
        const voices = window.speechSynthesis.getVoices();
        const langVoice = voices.find(v => v.lang.startsWith(lang === 'hi' ? 'hi' : 'en'));
        if (langVoice) utterance.voice = langVoice;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    }, [langCode, lang]);

    const stopSpeaking = useCallback(() => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => window.speechSynthesis?.cancel();
    }, []);

    return { isSpeaking, speak, stopSpeaking };
}


// ── Convenience: Combined hook ────────────────────────────────────────────

export function useSpeech(lang = 'en') {
    const stt = useSpeechToText(lang);
    const tts = useTextToSpeech(lang);
    return { ...stt, ...tts };
}

export default useSpeech;
