import React, { useRef, useEffect } from 'react';

/**
 * A 6-digit OTP input that auto-advances focus between cells.
 *
 * Props:
 *   value      – string of up to 6 digits (controlled)
 *   onChange   – (newValue: string) => void
 *   disabled   – disable all cells when true
 *   hasError   – highlight cells in red when true
 */
export default function OtpInput({ value = '', onChange, disabled = false, hasError = false }) {
  const inputsRef = useRef([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');

  // Focus first empty cell on mount
  useEffect(() => {
    const firstEmpty = digits.findIndex(d => d === '');
    const idx = firstEmpty === -1 ? 5 : firstEmpty;
    if (inputsRef.current[idx]) {
      inputsRef.current[idx].focus();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e, idx) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = char;
    onChange(next.join(''));

    if (char && idx < 5) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace') {
      if (digits[idx]) {
        const next = [...digits];
        next[idx] = '';
        onChange(next.join(''));
      } else if (idx > 0) {
        const next = [...digits];
        next[idx - 1] = '';
        onChange(next.join(''));
        inputsRef.current[idx - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx < 5) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, 5);
    inputsRef.current[focusIdx]?.focus();
  };

  const borderColor = hasError
    ? 'rgba(220,38,38,0.8)'
    : 'rgba(75,85,99,0.5)';
  const focusBorderColor = hasError ? '#dc2626' : '#22c55e';

  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }} onPaste={handlePaste}>
      {digits.map((digit, idx) => (
        <input
          key={idx}
          ref={el => (inputsRef.current[idx] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={e => handleChange(e, idx)}
          onKeyDown={e => handleKeyDown(e, idx)}
          onFocus={e => e.target.select()}
          style={{
            width: '48px',
            height: '56px',
            textAlign: 'center',
            fontSize: '24px',
            fontWeight: '700',
            fontFamily: 'monospace',
            background: 'rgba(17,24,39,0.8)',
            border: `2px solid ${digit ? focusBorderColor : borderColor}`,
            borderRadius: '8px',
            color: hasError ? '#fca5a5' : '#f1f5f9',
            outline: 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            boxShadow: digit ? `0 0 0 2px ${hasError ? 'rgba(220,38,38,0.2)' : 'rgba(34,197,94,0.15)'}` : 'none',
            cursor: disabled ? 'not-allowed' : 'text',
            opacity: disabled ? 0.5 : 1,
          }}
        />
      ))}
    </div>
  );
}
