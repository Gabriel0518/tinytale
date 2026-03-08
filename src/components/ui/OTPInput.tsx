'use client';

import { useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
}

export default function OTPInput({
  length = 6,
  value,
  onChange,
  error = false,
  disabled = false,
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Auto-focus first input on mount
    if (inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [disabled]);

  const handleChange = (index: number, digit: string) => {
    if (disabled) return;

    // Only allow single digit
    const newDigit = digit.slice(-1);

    // Only allow numbers
    if (newDigit && !/^\d$/.test(newDigit)) return;

    // Update value
    const newValue = value.split('');
    newValue[index] = newDigit;
    const updatedValue = newValue.join('').slice(0, length);
    onChange(updatedValue);

    // Auto-advance to next input
    if (newDigit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    // Handle backspace
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        // Move to previous input if current is empty
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current input
        const newValue = value.split('');
        newValue[index] = '';
        onChange(newValue.join(''));
      }
    }

    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain');
    const digits = pastedData.replace(/\D/g, '').slice(0, length);

    if (digits) {
      onChange(digits);
      // Focus last filled input
      const lastIndex = Math.min(digits.length - 1, length - 1);
      inputRefs.current[lastIndex]?.focus();
    }
  };

  return (
    <div className="flex justify-between gap-2">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className="w-12 h-14 text-center text-xl font-bold rounded-lg focus:ring-0 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: error ? 'rgba(239, 68, 68, 0.1)' : 'rgba(58, 51, 24, 0.6)',
            color: '#f5f5f5',
            border: error ? '2px solid rgba(239, 68, 68, 0.5)' : '2px solid transparent',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)'
          }}
          onFocus={(e) => {
            e.target.style.border = '2px solid #f2b90d';
          }}
          onBlur={(e) => {
            if (!error) {
              e.target.style.border = '2px solid transparent';
            }
          }}
        />
      ))}
    </div>
  );
}
