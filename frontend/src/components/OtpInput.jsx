import React, { useRef, useEffect } from 'react';

export default function OtpInput({ value, onChange, onComplete, disabled = false, length = 6 }) {
  const inputRefs = useRef([]);

  useEffect(() => {
    // Focus on first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (e, index) => {
    const val = e.target.value;
    
    // Only allow digits
    if (!/^\d*$/.test(val)) {
      return;
    }

    // Update value
    const newValue = value.split('');
    newValue[index] = val;
    const fullValue = newValue.join('');
    
    onChange(fullValue);

    // Auto-focus to next input
    if (val && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }

    // Check if all fields are filled
    if (fullValue.length === length && onComplete) {
      onComplete(fullValue);
    }
  };

  const handleKeyDown = (e, index) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      const newValue = value.split('');
      newValue[index] = '';
      onChange(newValue.join(''));

      // Focus on previous input
      if (index > 0) {
        inputRefs.current[index - 1].focus();
      }
    }
    
    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1].focus();
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    
    // Only allow digits
    if (!/^\d*$/.test(pastedData)) {
      return;
    }

    const digits = pastedData.slice(0, length);
    onChange(digits);

    // Focus on next empty field or last field
    const nextIndex = Math.min(digits.length, length - 1);
    if (nextIndex < length) {
      inputRefs.current[nextIndex].focus();
    }

    if (digits.length === length && onComplete) {
      onComplete(digits);
    }
  };

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      justifyContent: 'center',
      margin: '24px 0'
    }}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => inputRefs.current[index] = el}
          type="text"
          maxLength="1"
          value={value[index] || ''}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          disabled={disabled}
          inputMode="numeric"
          style={{
            width: '50px',
            height: '50px',
            fontSize: '24px',
            fontWeight: 'bold',
            textAlign: 'center',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            backgroundColor: disabled ? '#f3f4f6' : '#ffffff',
            color: '#1f2937',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: value[index] ? '0 0 0 2px rgba(102, 126, 234, 0.2)' : 'none'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#667eea';
            e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e5e7eb';
            e.target.style.boxShadow = value[index] ? '0 0 0 2px rgba(102, 126, 234, 0.2)' : 'none';
          }}
        />
      ))}
    </div>
  );
}