import React, { forwardRef, useId } from 'react';
import './Input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, required, className = '', id: propId, ...props }, ref) => {
    // Generate unique ID for aria-describedby linkage
    const generatedId = useId();
    const uniqueId = propId || generatedId;
    const errorId = error ? `${uniqueId}-error` : undefined;
    const helperId = helper && !error ? `${uniqueId}-helper` : undefined;
    const ariaDescribedBy = errorId || helperId;

    return (
      <div className="input-wrapper">
        {label && (
          <label htmlFor={uniqueId} className="input-label">
            {label}
            {required && <span className="input-required"> *</span>}
          </label>
        )}
        <input
          ref={ref}
          id={uniqueId}
          className={`input-field ${error ? 'input-error' : ''} ${className}`}
          aria-invalid={error ? 'true' : 'false'}
          {...(ariaDescribedBy ? { 'aria-describedby': ariaDescribedBy } : {})}
          {...props}
        />
        {error && <span id={errorId} className="input-error-text">{error}</span>}
        {helper && !error && <span id={helperId} className="input-helper">{helper}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
