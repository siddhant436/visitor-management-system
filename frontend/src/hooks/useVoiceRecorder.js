import { useState, useRef } from 'react';

export const useVoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      console.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone access granted');
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        console.log('Data available:', event.data.size);
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        console.log('Recording stopped, creating blob...');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        console.log('Audio blob created:', audioBlob.size);
        setAudioBlob(audioBlob);
        setAudioURL(URL.createObjectURL(audioBlob));
        
        stream.getTracks().forEach(track => {
          console.log('Stopping audio track');
          track.stop();
        });
      };

      console.log('Starting MediaRecorder...');
      mediaRecorderRef.current.start();
      setIsRecording(true);
      console.log('Recording started');
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Please allow microphone access to use voice recording');
    }
  };

  const stopRecording = () => {
    console.log('Stop recording called');
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log('Recording stopped');
    }
  };

  const resetRecording = () => {
    console.log('Resetting recording');
    setAudioBlob(null);
    setAudioURL(null);
    audioChunksRef.current = [];
  };

  return {
    isRecording,
    audioBlob,
    audioURL,
    startRecording,
    stopRecording,
    resetRecording,
  };
};